#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 创建新的app并设置共享配置
 * 使用方法: pnpm create-app <app-name> 或 node scripts/create-app.js <app-name>
 * 例如: pnpm create-app app3
 */

const appName = process.argv[2];

if (!appName) {
  console.error('请提供app名称');
  console.log('使用方法: pnpm create-app <app-name>');
  process.exit(1);
}

const projectRoot = path.resolve(__dirname, '..');
const packagesDir = path.join(projectRoot, 'apps');
const newAppDir = path.join(packagesDir, appName);

// 检查app是否已存在
if (fs.existsSync(newAppDir)) {
  console.error(`App "${appName}" 已存在`);
  process.exit(1);
}

console.log(`正在创建app: ${appName}`);

try {
  // 1. 创建app目录结构
  fs.mkdirSync(newAppDir, { recursive: true });
  fs.mkdirSync(path.join(newAppDir, 'src'), { recursive: true });

  // 2. 创建package.json (与app1、app2保持一致)
  const packageJson = {
    name: `@my-monorepo/${appName}`,
    private: true,
    scripts: {
      "start": "node ../../packages/shared/scripts/start.js",
      "build": "node ../../packages/shared/scripts/build.js",
      "build:shared": "pnpm --filter @my-monorepo/shared build",
      "test": "node ../../packages/shared/scripts/test.js",
      "watch:shared": "pnpm --filter @my-monorepo/shared watch"
    },
    dependencies: {
      "@my-monorepo/shared": "workspace:*",
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "web-vitals": "^2.1.4"
    },
    devDependencies: {
      "@types/react": "^18.2.14",
      "@types/react-dom": "^18.2.6",
      "typescript": "^4.9.5"
    },
    browserslist: {
      production: [
        ">0.2%",
        "not dead",
        "not op_mini all"
      ],
      development: [
        "last 1 chrome version",
        "last 1 firefox version",
        "last 1 safari version"
      ]
    }
  };

  fs.writeFileSync(
    path.join(newAppDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // 3. 创建tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: "es5",
      lib: [
        "dom",
        "dom.iterable",
        "es6"
      ],
      allowJs: true,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      noFallthroughCasesInSwitch: true,
      module: "esnext",
      moduleResolution: "node",
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react-jsx"
    },
    include: [
      "src"
    ]
  };

  fs.writeFileSync(
    path.join(newAppDir, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  );

  // 4. 创建基本的React文件 (与app1、app2保持一致)

  const indexTsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();`;

  fs.writeFileSync(path.join(newAppDir, 'src', 'index.tsx'), indexTsx);

  const appTsx = `import React from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;`;

  fs.writeFileSync(path.join(newAppDir, 'src', 'App.tsx'), appTsx);

  // App.css - 完整样式，占满整个屏幕
  const appCss = `.App {
  text-align: center;
}

.App-logo {
  height: 40vmin;
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  .App-logo {
    animation: App-logo-spin infinite 20s linear;
  }
}

.App-header {
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
}

.App-link {
  color: #61dafb;
}

@keyframes App-logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}`;

  fs.writeFileSync(path.join(newAppDir, 'src', 'App.css'), appCss);

  const indexCss = `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`;

  fs.writeFileSync(path.join(newAppDir, 'src', 'index.css'), indexCss);

  const reportWebVitals = `import { ReportHandler } from 'web-vitals';

const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;`;

  fs.writeFileSync(path.join(newAppDir, 'src', 'reportWebVitals.ts'), reportWebVitals);

  // 5. 创建 react-app-env.d.ts (TypeScript类型声明文件)
  const reactAppEnv = `/// <reference types="node" />
/// <reference types="react" />
/// <reference types="react-dom" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly PUBLIC_URL: string;
  }
}

declare module '*.avif' {
  const src: string;
  export default src;
}

declare module '*.bmp' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.webp' {
    const src: string;
    export default src;
}

declare module '*.svg' {
  import * as React from 'react';

  export const ReactComponent: React.FunctionComponent<React.SVGProps<
    SVGSVGElement
  > & { title?: string }>;

  const src: string;
  export default src;
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
`;

  fs.writeFileSync(path.join(newAppDir, 'src', 'react-app-env.d.ts'), reactAppEnv);

  // 6. 复制logo.svg
  const app1LogoPath = path.join(projectRoot, 'packages', 'images', 'logo.svg');
  const newAppLogoPath = path.join(newAppDir, 'src', 'logo.svg');
  if (fs.existsSync(app1LogoPath)) {
    fs.copyFileSync(app1LogoPath, newAppLogoPath);
  }

  console.log(`✅ App "${appName}" 创建成功！`);
  console.log(`📁 位置: ${newAppDir}`);
  console.log(`\n🚀 使用方法:`);
  console.log(`  pnpm install`);
  console.log(`  pnpm start:${appName}`);

} catch (error) {
  console.error('创建app时出错:', error.message);
  process.exit(1);
}
