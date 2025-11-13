'use strict';

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

// Ensure environment variables are read.
require('../config/env');

// Add cluster module
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const fs = require('fs');
const chalk = require('react-dev-utils/chalk');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const clearConsole = require('react-dev-utils/clearConsole');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const {
  choosePort,
  createCompiler,
  prepareProxy,
  prepareUrls,
} = require('react-dev-utils/WebpackDevServerUtils');
const openBrowser = require('react-dev-utils/openBrowser');
const semver = require('semver');
const paths = require('../config/paths');
const configFactory = require('../config/webpack.config');
const createDevServerConfig = require('../config/webpackDevServer.config');
const getClientEnvironment = require('../config/env');
const react = require('react');

const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));
const useYarn = fs.existsSync(paths.yarnLockFile);
const isInteractive = process.stdout.isTY;

// Cluster task
const IF_CLUSTER = process.env.IF_CLUSTER === 'true';
// Warn and crash if required files are missing
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
  process.exit(1);
}

// Tools like Cloud9 rely on this.
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

if (process.env.HOST) {
  console.log(
    chalk.cyan(
      `Attempting to bind to HOST environment variable: ${chalk.yellow(
        chalk.bold(process.env.HOST)
      )}`
    )
  );
  console.log(
    `If this was unintentional, check that you haven't mistakenly set it in your shell.`
  );
  console.log(
    `Learn more here: ${chalk.yellow('https://cra.link/advanced-config')}`
  );
  console.log();
}

// 集群模式逻辑
if (IF_CLUSTER && cluster.isPrimary) {
  console.log(chalk.cyan(`\n${'='.repeat(60)}`));
  console.log(chalk.cyan(`Master process ${process.pid} is running`));
  console.log(chalk.cyan(`Forking ${Math.min(numCPUs, 4)} worker(s)...`));
  console.log(chalk.cyan(`${'='.repeat(60)}\n`));

  // Fork workers
  for (let i = 0; i < Math.min(numCPUs, 4); i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(chalk.yellow(`\nWorker ${worker.process.pid} exited with code ${code}`));
    if (signal) {
      console.log(chalk.yellow(`Signal: ${signal}`));
    }
    console.log(chalk.cyan('Starting a new worker...\n'));
    cluster.fork();
  });

  // 监听worker启动
  cluster.on('online', (worker) => {
    console.log(chalk.green(`Worker ${worker.process.pid} is online`));
  });

  // ========== Worker 通信功能 ==========
  // 监听来自 Workers 的消息
  cluster.on('message', (worker, message) => {
    if (message && message.type === 'broadcast') {
      console.log(chalk.cyan(`\n${'='.repeat(60)}`));
      console.log(chalk.cyan(`[Master] 收到来自 Worker ${worker.process.pid} 的消息:`));
      console.log(chalk.cyan(`  内容: ${message.data}`));
      console.log(chalk.cyan(`[Master] 正在广播给其他 Workers...`));
      
      let broadcastCount = 0;
      // 广播给除了发送者之外的所有 Workers
      for (const id in cluster.workers) {
        const targetWorker = cluster.workers[id];
        // 排除发送者自己
        if (targetWorker.process.pid !== worker.process.pid) {
          targetWorker.send({
            type: 'broadcast-message',
            from: worker.process.pid,
            data: message.data,
            timestamp: Date.now()
          });
          broadcastCount++;
          console.log(chalk.green(`  ✓ 已发送给 Worker ${targetWorker.process.pid}`));
        }
      }
      console.log(chalk.cyan(`[Master] 共广播给 ${broadcastCount} 个 Workers`));
      console.log(chalk.cyan(`${'='.repeat(60)}\n`));
    } else {
      // 调试：显示所有收到的消息类型
      if (message) {
        console.log(chalk.gray(`[Master] 收到来自 Worker ${worker.process.pid} 的消息类型: ${message.type || 'unknown'}`));
      }
    }
  });
} else {
  // We require that you explicitly set browsers and do not fall back to
  // browserslist defaults.
  const { checkBrowsers } = require('react-dev-utils/browsersHelper');
  checkBrowsers(paths.appPath, isInteractive)
    .then(() => {
      // We attempt to use the default port but if it is busy, we offer the user to
      // run on a different port. `choosePort()` Promise resolves to the next free port.
      return choosePort(HOST, DEFAULT_PORT);
    })
    .then(port => {
      if (port == null) {
        // We have not found a port.
        return;
      }

      const config = configFactory('development');
      const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
      const appName = require(paths.appPackageJson).name;

      const useTypeScript = fs.existsSync(paths.appTsConfig);
      const urls = prepareUrls(
        protocol,
        HOST,
        port,
        paths.publicUrlOrPath.slice(0, -1)
      );
      
      // Create a webpack compiler that is configured with custom messages.
      const compiler = createCompiler({
        appName,
        config,
        urls,
        useYarn,
        useTypeScript,
        webpack,
      });
      
      // Load proxy config
      const proxySetting = require(paths.appPackageJson).proxy;
      const proxyConfig = prepareProxy(
        proxySetting,
        paths.appPublic,
        paths.publicUrlOrPath
      );
      
      // Serve webpack assets generated by the compiler over a web server.
      const serverConfig = {
        ...createDevServerConfig(proxyConfig, urls.lanUrlForConfig),
        host: HOST,
        port,
      };
      
      const devServer = new WebpackDevServer(serverConfig, compiler);
      
      // Launch WebpackDevServer.
      devServer.startCallback(() => {
        if (isInteractive) {
          clearConsole();
        }

        if (env.raw.FAST_REFRESH && semver.lt(react.version, '16.10.0')) {
          console.log(
            chalk.yellow(
              `Fast Refresh requires React 16.10 or higher. You are using React ${react.version}.`
            )
          );
        }

        console.log(chalk.cyan('Starting the development server...\n'));
        
        if (IF_CLUSTER) {
          console.log(chalk.green(`Worker ${process.pid} is ready and serving on ${urls.localUrlForBrowser}`));
          
          // ========== Worker 通信功能 ==========
          // 监听来自 Master 的广播消息
          process.on('message', (message) => {
            if (message && message.type === 'broadcast-message') {
              console.log(chalk.yellow(`\n[Worker ${process.pid}] 收到广播消息:`));
              console.log(chalk.yellow(`  来自: Worker ${message.from}`));
              console.log(chalk.yellow(`  内容: ${message.data}`));
              console.log(chalk.yellow(`  时间: ${new Date(message.timestamp).toLocaleTimeString()}\n`));
            }
          });

          // 默认启用广播功能：延迟 3 秒后开始发送，确保所有 Workers 都已启动
          setTimeout(() => {
            let messageCount = 0;
            console.log(chalk.cyan(`\n[Worker ${process.pid}] 通信功能已启用，将每 1 秒发送一条消息\n`));
            
            // 立即发送第一条消息
            messageCount++;
            const firstMessage = `这是 Worker ${process.pid} 的第 ${messageCount} 条消息（启动测试）`;
            console.log(chalk.cyan(`[Worker ${process.pid}] 发送消息给 Master: ${firstMessage}`));
            process.send({
              type: 'broadcast',
              data: firstMessage
            });
            
            // 之后每 1 秒发送一条
            setInterval(() => {
              messageCount++;
              const message = `这是 Worker ${process.pid} 的第 ${messageCount} 条消息`;
              console.log(chalk.cyan(`[Worker ${process.pid}] 发送消息给 Master: ${message}`));
              process.send({
                type: 'broadcast',
                data: message
              });
            }, 1000);
          }, 3000);
        } else {
          openBrowser(urls.localUrlForBrowser);
        }
      });

      ['SIGINT', 'SIGTERM'].forEach(function (sig) {
        process.on(sig, function () {
          devServer.close();
          process.exit();
        });
      });

      if (process.env.CI !== 'true') {
        // Gracefully exit when stdin ends
        process.stdin.on('end', function () {
          devServer.close();
          process.exit();
        });
      }
    })
    .catch(err => {
      if (err && err.message) {
        console.log(err.message);
      }
      process.exit(1);
    });
}

function broadcastToAllWorkers(message) {
  for (const id in cluster.workers) {
    cluster.workers[id].send(message);
  }
}