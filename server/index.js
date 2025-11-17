'use strict';

// 加载环境变量（如果存在.env文件）
try {
  require('dotenv').config({ path: require('path').join(__dirname, '.env') });
} catch (e) {
  // dotenv未安装或.env文件不存在，忽略错误
}

const cluster = require('cluster');
const os = require('os');
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const chalk = require('chalk');
const proxyConfig = require('./config/proxy');
const serverConfig = require('./config/server');

// 是否启用集群模式
const ENABLE_CLUSTER = process.env.ENABLE_CLUSTER === 'true' || process.env.ENABLE_CLUSTER === '1';
const NUM_WORKERS = parseInt(process.env.NUM_WORKERS, 10) || Math.min(os.cpus().length, 4);
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// 集群模式：主进程管理worker进程
if (ENABLE_CLUSTER && cluster.isPrimary) {
  console.log(chalk.cyan(`\n${'='.repeat(60)}`));
  console.log(chalk.cyan(`Master process ${process.pid} is running`));
  console.log(chalk.cyan(`Forking ${NUM_WORKERS} worker(s)...`));
  console.log(chalk.cyan(`${'='.repeat(60)}\n`));

  // Fork workers
  for (let i = 0; i < NUM_WORKERS; i++) {
    cluster.fork();
  }

  // 监听worker退出事件，自动重启
  cluster.on('exit', (worker, code, signal) => {
    console.log(chalk.yellow(`\nWorker ${worker.process.pid} exited with code ${code}`));
    if (signal) {
      console.log(chalk.yellow(`Signal: ${signal}`));
    }
    console.log(chalk.cyan('Starting a new worker...\n'));
    cluster.fork();
  });

  // 监听worker上线事件
  cluster.on('online', (worker) => {
    console.log(chalk.green(`Worker ${worker.process.pid} is online`));
  });

  // 监听来自workers的消息
  cluster.on('message', (worker, message) => {
    if (message && message.type === 'broadcast') {
      console.log(chalk.cyan(`\n[Master] 收到来自 Worker ${worker.process.pid} 的消息: ${message.data}`));
      
      // 广播给其他workers
      let broadcastCount = 0;
      for (const id in cluster.workers) {
        const targetWorker = cluster.workers[id];
        if (targetWorker.process.pid !== worker.process.pid) {
          targetWorker.send({
            type: 'broadcast-message',
            from: worker.process.pid,
            data: message.data,
            timestamp: Date.now()
          });
          broadcastCount++;
        }
      }
      console.log(chalk.cyan(`[Master] 共广播给 ${broadcastCount} 个 Workers\n`));
    }
  });

  // 优雅关闭
  process.on('SIGTERM', () => {
    console.log(chalk.yellow('\nMaster received SIGTERM, shutting down gracefully...'));
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
  });

  process.on('SIGINT', () => {
    console.log(chalk.yellow('\nMaster received SIGINT, shutting down gracefully...'));
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
    process.exit(0);
  });
} else {
  // Worker进程或单进程模式：启动Express服务器
  const app = express();

  // 中间件：解析JSON和URL编码的请求体
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 中间件：请求日志
  app.use((req, res, next) => {
    const workerId = ENABLE_CLUSTER ? `[Worker ${process.pid}]` : '[Server]';
    console.log(chalk.gray(`${workerId} ${req.method} ${req.path}`));
    next();
  });

  // 健康检查端点
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      workerId: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      clusterMode: ENABLE_CLUSTER,
      timestamp: new Date().toISOString()
    });
  });

  // 静态文件服务（可选：如果需要服务前端构建文件）
  if (serverConfig.staticPath) {
    const staticPath = path.resolve(serverConfig.staticPath);
    app.use(express.static(staticPath));
    console.log(chalk.cyan(`Static files served from: ${staticPath}`));
    
    // SPA 路由支持：所有非 API 请求都返回 index.html
    app.get('*', (req, res, next) => {
      // 跳过 API 路由和已存在的文件
      if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
        return next();
      }
      // 返回 index.html 以支持前端路由
      const indexPath = path.join(staticPath, 'index.html');
      res.sendFile(indexPath);
    });
  }

  // 代理配置
  if (proxyConfig && Object.keys(proxyConfig).length > 0) {
    console.log(chalk.cyan('\n配置代理规则:'));
    Object.keys(proxyConfig).forEach(context => {
      const config = proxyConfig[context];
      const target = typeof config === 'string' ? config : config.target;
      
      console.log(chalk.green(`  ${context} -> ${target}`));
      
      // 创建代理中间件
      const proxyOptions = typeof config === 'string' 
        ? { target: config, changeOrigin: true }
        : { ...config, changeOrigin: config.changeOrigin !== false };
      
      app.use(context, createProxyMiddleware(proxyOptions));
    });
    console.log('');
  }

  // API路由示例
  app.get('/api/info', (req, res) => {
    res.json({
      message: 'Express Server with Cluster Mode',
      workerId: process.pid,
      clusterMode: ENABLE_CLUSTER,
      nodeVersion: process.version,
      platform: process.platform
    });
  });

  // Worker通信API（仅在集群模式下可用）
  if (ENABLE_CLUSTER) {
    // 存储接收到的消息
    let receivedMessages = [];
    const MAX_MESSAGES = 100;

    // 监听来自Master的广播消息
    process.on('message', (message) => {
      if (message && message.type === 'broadcast-message') {
        const messageData = {
          from: message.from,
          data: message.data,
          timestamp: message.timestamp,
          receivedAt: Date.now()
        };
        
        receivedMessages.push(messageData);
        if (receivedMessages.length > MAX_MESSAGES) {
          receivedMessages.shift();
        }
        
        console.log(chalk.yellow(`[Worker ${process.pid}] 收到广播消息: ${message.data}`));
      }
    });

    // 发送消息给其他Workers
    app.post('/api/worker/broadcast', (req, res) => {
      const message = req.body?.message || req.body?.data || '';
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      // 发送消息给Master
      process.send({
        type: 'broadcast',
        data: message
      });
      
      res.json({
        success: true,
        workerId: process.pid,
        message: 'Message sent to other workers',
        data: message
      });
    });

    // 获取Worker信息和接收到的消息
    app.get('/api/worker/info', (req, res) => {
      res.json({
        workerId: process.pid,
        receivedMessages: receivedMessages || [],
        messageCount: receivedMessages?.length || 0,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      });
    });
  }

  // 根路径处理（如果没有配置静态文件）
  if (!serverConfig.staticPath) {
    app.get('/', (req, res) => {
      res.json({
        message: 'Express Server is running',
        endpoints: {
          health: '/health',
          info: '/api/info',
          ...(ENABLE_CLUSTER && {
            workerInfo: '/api/worker/info',
            workerBroadcast: 'POST /api/worker/broadcast'
          })
        },
        staticFiles: 'Not configured. Set STATIC_PATH to serve static files.',
        proxy: Object.keys(proxyConfig || {}).length > 0 ? 'Configured' : 'Not configured'
      });
    });
  }

  // 404处理
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      path: req.path,
      message: 'The requested resource was not found on this server.',
      availableEndpoints: {
        health: '/health',
        info: '/api/info',
        ...(ENABLE_CLUSTER && {
          workerInfo: '/api/worker/info'
        })
      }
    });
  });

  // 错误处理中间件
  app.use((err, req, res, next) => {
    console.error(chalk.red(`[Error] ${err.message}`));
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  });

  // 启动服务器
  const server = app.listen(PORT, HOST, () => {
    const workerId = ENABLE_CLUSTER ? `Worker ${process.pid}` : 'Server';
    console.log(chalk.green(`\n${'='.repeat(60)}`));
    console.log(chalk.green(`${workerId} is running!`));
    console.log(chalk.green(`Listening on http://${HOST}:${PORT}`));
    console.log(chalk.green(`Cluster Mode: ${ENABLE_CLUSTER ? 'Enabled' : 'Disabled'}`));
    console.log(chalk.green(`${'='.repeat(60)}\n`));
  });

  // 优雅关闭
  const gracefulShutdown = (signal) => {
    console.log(chalk.yellow(`\n${ENABLE_CLUSTER ? `[Worker ${process.pid}]` : '[Server]'} 收到 ${signal}，正在关闭...`));
    server.close(() => {
      console.log(chalk.green('Server closed gracefully'));
      process.exit(0);
    });

    // 强制关闭超时
    setTimeout(() => {
      console.error(chalk.red('Forced shutdown'));
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

