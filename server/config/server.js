'use strict';

/**
 * 服务器配置
 */

module.exports = {
  // 静态文件路径（可选）
  // 如果设置了此路径，Express将服务该目录下的静态文件
  // 例如：服务前端构建后的文件
  staticPath: process.env.STATIC_PATH || null,
  
  // 其他服务器配置可以在这里添加
  // 例如：CORS配置、安全配置等
};

