# my-monorepo

一个按照工业界标准实现的 **大仓(Monorepo)** 项目架构。

## 🎯 项目特点

采用现代 Monorepo 架构，所有 React 应用共享统一的：
- 📦 依赖管理（所有构建工具、加载器、插件集中在 shared）
- ⚙️ 构建配置（webpack、Babel、TypeScript）
- 🛠️ 构建脚本（start、build、test）
- 📁 静态资源（通过符号链接共享）

## 📁 项目结构

```
my-monorepo/
├── packages/
│   ├── shared/          # 共享依赖和配置中心
│   │   ├── package.json # 包含所有React应用所需的依赖（60+个）
│   │   ├── config/      # webpack、Jest配置
│   │   ├── scripts/     # start.js、build.js、test.js
│   │   ├── public/      # 共享静态资源
│   │   ├── src/         # 共享TypeScript代码
│   │   └── dist/        # 编译输出
│   ├── app1/            # React应用1
│   │   ├── package.json # 仅包含对shared的依赖
│   │   ├── tsconfig.json
│   │   ├── src/         # 应用源代码
│   │   └── public/      # 符号链接 -> ../shared/public
│   └── app2/            # React应用2（同app1结构）
├── scripts/
│   └── create-app.js    # 新应用生成脚本
├── pnpm-workspace.yaml  # pnpm workspace配置
└── package.json         # 根目录脚本
```

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动应用

```bash
# 启动app1（默认）
pnpm start

# 启动特定应用
pnpm start:app1
pnpm start:app2
```

### 构建应用

```bash
# 构建所有应用
pnpm build

# 构建特定应用
pnpm build:app1
pnpm build:app2

# 仅构建shared库
pnpm build:shared
```

### 运行测试

```bash
pnpm test
```

### 创建新应用

```bash
pnpm create-app app3
```

会自动创建：
- `packages/app3/` 目录
- `package.json` 和 `tsconfig.json`
- 基本的 React 应用文件
- 到 shared 的符号链接

## 🏗️ 大仓架构优势

### 1. **集中化依赖管理**
所有应用使用统一版本的依赖，避免版本冲突
```json
// shared/package.json 包含所有依赖
{
  "dependencies": {
    "react": "^18.2.0",
    "webpack": "^5.88.0",
    "@babel/core": "^7.22.9",
    // 以及其他60+个依赖
  }
}

// app1/package.json 仅依赖shared
{
  "dependencies": {
    "@my-monorepo/shared": "workspace:*"
  }
}
```

### 2. **统一的构建流程**
```
app1 → shared/scripts/start.js → shared/config/webpack.config.js → webpack
app2 → shared/scripts/start.js → shared/config/webpack.config.js → webpack
```

### 3. **减少重复**
- 不需要在每个应用中复制 webpack、Babel、TypeScript 配置
- 修改构建配置只需改一处
- 所有应用自动应用新配置

### 4. **易于共享代码**
在 shared/src 中放置可复用代码
```typescript
// shared/src/utils.ts
export const greet = (name: string) => `Hello, ${name}!`;

// app1/src/App.tsx
import { greet } from '@my-monorepo/shared';
```

### 5. **一致的开发体验**
- 统一的代码检查规则
- 相同的测试框架
- 统一的 TypeScript 配置

## 📦 共享依赖概览

### 构建工具
- `webpack` v5.88.0 - 模块打包
- `webpack-dev-server` v4.15.1 - 开发服务器
- `html-webpack-plugin` v5.5.3 - HTML处理
- `mini-css-extract-plugin` v2.7.6 - CSS提取

### 加载器和转译
- `babel-loader` - JavaScript转译
- `css-loader` - CSS加载
- `style-loader` - 样式注入
- `file-loader` - 文件处理

### Babel预设
- `@babel/preset-react` - React支持
- `@babel/preset-typescript` - TypeScript支持
- `babel-preset-react-app` - Create React App预设

### React运行时
- `react` v18.2.0
- `react-dom` v18.2.0
- `react-refresh` - 快速刷新

### 开发工具
- `typescript` v4.9.5
- `jest` v29.6.2 - 测试框架
- `eslint` v8.44.0 - 代码检查
- `react-dev-utils` v12.0.1 - 开发工具集

## 🔧 常见任务

### 添加新依赖

```bash
# 1. 修改 packages/shared/package.json
{
  "dependencies": {
    "new-library": "^1.0.0"
  }
}

# 2. 安装
pnpm install

# 3. 所有应用自动可用
```

### 修改构建配置

```bash
# 1. 编辑 packages/shared/config/webpack.config.js

# 2. 重启开发服务器
pnpm start
```

### 在shared中添加共享代码

```typescript
// packages/shared/src/components/Button.tsx
export const Button = () => <button>Click me</button>;

// packages/shared/package.json
{
  "exports": {
    "./components": "./dist/components.js"
  }
}

// app1/src/App.tsx
import { Button } from '@my-monorepo/shared/components';
```

## 📊 与其他Monorepo工具的对比

| 特性 | 我们的架构 | Nx | Turbo | Lerna |
|------|---------|----|----|-------|
| 包管理 | pnpm | 内置 | 与包管理器集成 | npm/yarn/pnpm |
| 共享配置 | 符号链接 + 继承 | 配置生成 | 配置继承 | 链接 + 发布 |
| 依赖管理 | 集中式 | 智能链接 | 智能链接 | 工作区 |
| 性能优化 | 基础缓存 | 高级缓存 | 任务管理 | 并行化 |

## 🎓 工业界实践

这个项目遵循以下公司的最佳实践：

### Google (Monorepo)
- 集中化依赖管理
- 统一构建系统
- 共享配置

### Facebook/Meta
- 高效的符号链接系统
- 智能缓存策略
- 快速开发循环

### Microsoft
- 工作区管理
- 跨语言支持
- CI/CD集成

## 🚦 系统要求

- Node.js v18+
- pnpm v10.17.1+
- Windows 10+ / macOS / Linux

## 📝 配置文件说明

- `pnpm-workspace.yaml` - 定义 workspace 范围
- `packages/shared/package.json` - 所有依赖集中地
- `packages/shared/config/webpack.config.js` - webpack 主配置
- `packages/shared/scripts/start.js` - 开发脚本
- `packages/shared/scripts/build.js` - 构建脚本

详见 [SHARED_CONFIG.md](./SHARED_CONFIG.md)

## 🔍 故障排除

### 符号链接问题

```powershell
# Windows: 以管理员运行 PowerShell
# 或手动创建: mklink /D target source
```

### 缓存问题

```bash
rm -r node_modules/.cache
pnpm install
pnpm start
```

### 路径错误

检查 `packages/shared/config/paths.js` 的配置

## 🤝 贡献指南

1. 在 `packages/` 中创建新应用
2. 所有应用共享 shared 中的依赖和配置
3. 在 shared/src 中添加共享代码
4. 运行 `pnpm install` 同步所有工作区

## 📄 许可证

ISC

---

**相关文档**: [大仓架构详解](./SHARED_CONFIG.md)
