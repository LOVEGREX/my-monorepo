/**
 * setupProxy.js - 共享代理配置
 * 
 * Webpack Dev Server 会自动加载此文件
 * 用于配置开发环境的代理规则
 * 
 * 此文件位于 packages/shared/src/，所有应用共享使用
 * 如果某个应用需要自定义代理，可以在应用的 src/setupProxy.js 中覆盖
 * 
 * 文档：https://create-react-app.dev/docs/proxying-api-requests-in-development/
 */

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 代理所有 /api 请求到后端服务器
  // 后端服务器运行在 http://localhost:3001 (或你配置的端口)
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_URL || 'http://localhost:3001',
      changeOrigin: true,
      // 可选：路径重写
      // pathRewrite: {
      //   '^/api': '', // 移除 /api 前缀
      // },
      // 可选：日志级别 ('silent', 'warn', 'info', 'debug')
      logLevel: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
    })
  );

  // 可以添加更多代理规则
  // app.use(
  //   '/external-api',
  //   createProxyMiddleware({
  //     target: 'https://api.example.com',
  //     changeOrigin: true,
  //     secure: true,
  //     headers: {
  //       'Authorization': 'Bearer your-token-here'
  //     }
  //   })
  // );

  // WebSocket 代理示例
  // app.use(
  //   '/ws',
  //   createProxyMiddleware({
  //     target: 'ws://localhost:3001',
  //     ws: true,
  //     changeOrigin: true,
  //   })
  // );
};

