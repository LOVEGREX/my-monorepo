module.exports = {
  apps: [
    {
      name: 'my-monorepo-server',
      script: './server/index.js',
      instances: 'max', // 使用所有 CPU 核心，或指定数字如 4
      exec_mode: 'cluster', // 集群模式
      
      // 环境变量
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        HOST: '0.0.0.0',
        // 如果使用 PM2 的集群模式，可以禁用内置的 cluster 逻辑
        ENABLE_CLUSTER: 'false'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
        ENABLE_CLUSTER: 'false'
      },
      
      // 自动重启配置
      watch: false, // 生产环境设为 false，开发环境可以设为 true
      autorestart: true, // 自动重启
      max_memory_restart: '1G', // 内存超过 1G 自动重启
      min_uptime: '10s', // 最小运行时间，小于此时间重启会被视为异常
      max_restarts: 10, // 最大重启次数（在 min_uptime 时间内）
      restart_delay: 4000, // 重启延迟（毫秒）
      
      // 日志配置
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true, // 合并所有实例的日志
      log_type: 'json', // 日志格式：json 或 raw
      
      // 其他配置
      kill_timeout: 5000, // 等待进程关闭的超时时间
      listen_timeout: 3000, // 等待应用启动的超时时间
      shutdown_with_message: true, // 优雅关闭
      
      // 忽略文件变化（如果 watch 为 true）
      ignore_watch: [
        'node_modules',
        'logs',
        '*.log',
        '.git'
      ]
    }
  ]
};

