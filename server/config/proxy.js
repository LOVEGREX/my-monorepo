'use strict';

/**
 * 代理配置
 * 
 * 配置格式：
 * {
 *   '/api': 'http://localhost:8080',  // 简单配置：路径 -> 目标地址
 *   '/api/v2': {                      // 详细配置：包含更多选项
 *     target: 'http://localhost:8080',
 *     changeOrigin: true,
 *     pathRewrite: {
 *       '^/api/v2': '/api'
 *     },
 *     onProxyReq: (proxyReq, req, res) => {
 *       // 自定义请求处理
 *     }
 *   }
 * }
 * 
 * 更多配置选项请参考：https://github.com/chimurai/http-proxy-middleware
 */

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

