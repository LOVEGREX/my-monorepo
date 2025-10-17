# 共享配置系统

本项目使用共享配置系统，让多个app共享相同的config、scripts和public文件。这样可以确保所有app使用相同的构建脚本、配置和静态资源，减少重复代码，提高维护效率。

## 项目结构

```
packages/
├── shared/           # 共享配置和资源
│   ├── config/       # 共享的webpack、jest等配置
│   ├── scripts/      # 共享的构建脚本
│   ├── public/       # 共享的静态资源
│   └── src/          # 共享的源代码
├── app1/             # 应用1
│   ├── config/       # 符号链接 -> ../shared/config
│   ├── scripts/      # 符号链接 -> ../shared/scripts
│   ├── public/       # 符号链接 -> ../shared/public
│   └── src/          # 应用特定的源代码
└── app2/             # 应用2
    ├── config/       # 符号链接 -> ../shared/config
    ├── scripts/      # 符号链接 -> ../shared/scripts
    ├── public/       # 符号链接 -> ../shared/public
    └── src/          # 应用特定的源代码
```

## 优势

1. **统一配置**: 所有app使用相同的webpack、jest等配置
2. **易于维护**: 修改配置只需要在shared中修改一次
3. **减少重复**: 避免在多个app中重复相同的配置文件
4. **版本同步**: 所有app自动使用最新的共享配置

## 使用方法

### 启动应用

```bash
# 启动app1
pnpm start:app1

# 启动app2
pnpm start:app2

# 启动默认应用(app1)
pnpm start
```

### 构建应用

```bash
# 构建所有应用
pnpm build

# 构建特定应用
pnpm build:app1
pnpm build:app2

# 构建共享库
pnpm build:shared
```

### 创建新应用

```bash
# 创建新应用app3
pnpm create-app app3

# 或者直接使用node
node scripts/create-app.js app3
```

新创建的应用会自动：
- 创建package.json配置
- 创建符号链接指向shared的config、scripts、public
- 创建基本的React文件结构

### 安装依赖

```bash
# 安装所有依赖
pnpm install:all
```

## 配置说明

### 共享配置位置

- **Webpack配置**: `packages/shared/config/webpack.config.js`
- **Jest配置**: `packages/shared/config/jest/`
- **环境配置**: `packages/shared/config/env.js`
- **路径配置**: `packages/shared/config/paths.js`

### 修改配置

1. 直接修改 `packages/shared/config/` 中的文件
2. 所有app会自动使用新的配置
3. 重启开发服务器以应用新配置

### 添加新的共享配置

1. 在 `packages/shared/config/` 中添加新文件
2. 在 `packages/shared/scripts/` 中添加相关脚本
3. 在 `packages/shared/public/` 中添加静态资源

## 注意事项

1. **符号链接**: 在Windows上需要管理员权限创建符号链接
2. **Git**: 符号链接在Git中会显示为文件，这是正常的
3. **IDE**: 大多数IDE都能正确识别符号链接
4. **删除应用**: 删除应用时，符号链接会自动删除

## 故障排除

### 符号链接创建失败

在Windows上，如果符号链接创建失败，请：
1. 以管理员身份运行PowerShell
2. 或者使用 `mklink` 命令手动创建

### 配置不生效

1. 检查符号链接是否正确创建
2. 重启开发服务器
3. 清除缓存后重新启动

### 路径问题

如果遇到路径问题，检查：
1. `packages/shared/config/paths.js` 中的路径配置
2. 确保所有app的package.json中的脚本路径正确
