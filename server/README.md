# Express Server with Cluster Mode

这是一个基于 Express 的服务器，支持集群模式和代理配置。

## 功能特性

- ✅ Express 框架
- ✅ Cluster 模式（多进程）
- ✅ 代理配置支持
- ✅ 静态文件服务
- ✅ 健康检查端点
- ✅ Worker 进程通信
- ✅ 优雅关闭

## 快速开始

### 安装依赖

```bash
# 在项目根目录执行
pnpm install
```

### 启动服务器

```bash
# 单进程模式
pnpm server:start

# 集群模式
pnpm server:start:cluster
```

### 环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp server/.env.example server/.env
```

主要配置项：

- `PORT`: 服务器端口（默认：3000）
- `HOST`: 服务器主机（默认：0.0.0.0）
- `ENABLE_CLUSTER`: 是否启用集群模式（true/false）
- `NUM_WORKERS`: Worker 进程数量（默认：CPU核心数，最多4个）
- `STATIC_PATH`: 静态文件路径（可选）

## 代理配置

编辑 `server/config/proxy.js` 文件来配置代理规则：

```javascript
module.exports = {
  // 简单配置：代理所有 /api 请求
  '/api': 'http://localhost:8080',
  
  // 详细配置：包含路径重写等选项
  '/api/v2': {
    target: 'http://localhost:8080',
    changeOrigin: true,
    pathRewrite: {
      '^/api/v2': '/api'
    }
  }
};
```

更多配置选项请参考 [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware) 文档。

## API 端点

### 健康检查

```
GET /health
```

返回服务器状态信息。

### 服务器信息

```
GET /api/info
```

返回服务器基本信息。

### Worker 信息（仅集群模式）

```
GET /api/worker/info
```

返回当前 Worker 的信息和接收到的消息。

### 广播消息（仅集群模式）

```
POST /api/worker/broadcast
Content-Type: application/json

{
  "message": "Hello from worker"
}
```

向其他 Worker 进程广播消息。

## 集群模式

集群模式使用 Node.js 的 `cluster` 模块，可以：

- 充分利用多核 CPU
- 提高服务器性能和稳定性
- 自动重启崩溃的 Worker 进程
- 支持 Worker 进程间通信

### 启用集群模式

```bash
# 方式1：使用环境变量
ENABLE_CLUSTER=true pnpm server:start

# 方式2：使用脚本
pnpm server:start:cluster
```

### Worker 进程数量

默认情况下，Worker 数量为 CPU 核心数，最多 4 个。可以通过环境变量调整：

```bash
NUM_WORKERS=8 pnpm server:start:cluster
```

## 静态文件服务

如果需要服务前端构建后的文件，设置 `STATIC_PATH` 环境变量：

```bash
STATIC_PATH=./apps/app1/build pnpm server:start
```

或者在 `.env` 文件中配置：

```
STATIC_PATH=./apps/app1/build
```

## 开发建议

1. **开发环境**：使用单进程模式，便于调试
2. **生产环境**：使用集群模式，提高性能
3. **代理配置**：根据实际后端服务地址配置代理
4. **静态文件**：生产环境建议使用 Nginx 等服务静态文件

## 故障排除

### 端口被占用

修改 `PORT` 环境变量或 `.env` 文件中的端口号。

### 代理不工作

检查 `server/config/proxy.js` 中的配置是否正确，确保目标服务器可访问。

### Worker 进程频繁重启

检查应用代码是否有未捕获的错误，查看日志定位问题。

