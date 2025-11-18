'use strict';

module.exports = {
  // 示例：代理所有 /api 请求到后端服务器
  // '/api': 'http://localhost:8080',
  
  // 示例：代理到不同路径
  // '/api/v1': {
  //   target: 'http://localhost:8080',
  //   changeOrigin: true,
  //   pathRewrite: {
  //     '^/api/v1': '/api'
  //   }
  // },
  
  // 示例：代理到外部API
  // '/external-api': {
  //   target: 'https://api.example.com',
  //   changeOrigin: true,
  //   secure: true,
  //   headers: {
  //     'Authorization': 'Bearer your-token-here'
  //   }
  // }
};

