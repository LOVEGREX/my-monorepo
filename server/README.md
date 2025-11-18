# Backend API Server

这是项目的后端 API 服务器，使用 Express 框架，支持集群模式。

## 📋 定位

- ✅ **后端业务服务器**：提供数据接口和业务逻辑
- ✅ **API 服务**：处理 `/api/*` 请求
- ✅ **静态文件服务**（可选）：生产环境服务前端构建文件
- ❌ **不是代理服务器**：代理配置在前端的 `src/setupProxy.js`

## 🚀 快速开始

### 开发环境

```bash
# 启动后端服务器（默认端口 3001，避免与前端冲突）
PORT=3001 pnpm server:start

# 或使用 PM2
PORT=3001 pnpm pm2:start
```

### 生产环境

```bash
# 使用 PM2（推荐）
PORT=3001 pnpm pm2:start:prod
```

## 📁 项目结构

```
server/
├── index.js              # 服务器主文件
├── config/
│   └── server.js         # 服务器配置
├── routes/               # API 路由（可扩展）
├── controllers/          # 控制器（可扩展）
├── models/              # 数据模型（可扩展）
└── middleware/          # 中间件（可扩展）
```

## 🔌 API 接口

### 健康检查

```
GET /health
```

### 服务器信息

```
GET /api/info
```

### 自定义 API

在 `server/index.js` 中添加你的业务接口：

```javascript
// 用户接口
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.post('/api/users', (req, res) => {
  // 创建用户
  res.json({ success: true });
});
```

## 🔗 与前端集成

### 前端代理配置

前端使用 `src/setupProxy.js` 配置代理：

```javascript
// apps/app1/src/setupProxy.js
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3001', // 后端服务器地址
  changeOrigin: true,
}));
```

### 开发环境工作流程

```
前端 (WebpackDevServer:3000)
    ↓ /api/* 请求
setupProxy.js 代理
    ↓
后端服务器 (Express:3001)
    ↓
返回数据
```

## ⚙️ 配置

### 环境变量

编辑 `server/.env`：

```env
PORT=3001
HOST=0.0.0.0
ENABLE_CLUSTER=false
NODE_ENV=development
STATIC_PATH=./apps/app1/build  # 可选：静态文件路径
```

### 服务器配置

编辑 `server/config/server.js`：

```javascript
module.exports = {
  staticPath: process.env.STATIC_PATH || null,
  // 其他配置...
};
```

## 🔄 集群模式

### 启用集群模式

```bash
# 方式1：环境变量
ENABLE_CLUSTER=true pnpm server:start

# 方式2：PM2（推荐）
pnpm pm2:start
```

### PM2 配置

PM2 会自动管理多个进程，无需在代码中启用 cluster。

## 📝 扩展开发

### 添加路由

创建 `server/routes/api.js`：

```javascript
const express = require('express');
const router = express.Router();

router.get('/users', (req, res) => {
  res.json({ users: [] });
});

module.exports = router;
```

在 `server/index.js` 中使用：

```javascript
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);
```

### 添加中间件

```javascript
// 自定义中间件
app.use((req, res, next) => {
  // 你的逻辑
  next();
});
```

## 🐛 调试

### 查看日志

```bash
# PM2 日志
pnpm pm2:logs

# 或直接运行
pnpm server:start
```

### 测试 API

```bash
# 健康检查
curl http://localhost:3001/health

# API 测试
curl http://localhost:3001/api/info
```

## 📚 相关文档

- [SERVER_USAGE.md](../SERVER_USAGE.md) - 详细使用说明
- [PM2_USAGE.md](../PM2_USAGE.md) - PM2 使用指南
- [CLUSTER_IMPLEMENTATION.md](../CLUSTER_IMPLEMENTATION.md) - 集群模式实现
