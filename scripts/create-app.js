#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 创建新的app并设置共享配置
 * 使用方法: node scripts/create-app.js <app-name>
 * 例如: node scripts/create-app.js app3
 */

const appName = process.argv[2];

if (!appName) {
  console.error('请提供app名称');
  console.log('使用方法: node scripts/create-app.js <app-name>');
  process.exit(1);
}

const projectRoot = path.resolve(__dirname, '..');
const packagesDir = path.join(projectRoot, 'packages');
const newAppDir = path.join(packagesDir, appName);
const sharedConfigDir = path.join(packagesDir, 'shared', 'config');

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

  // 2. 创建package.json
  const packageJson = {
    name: `@my-monorepo/${appName}`,
    version: "1.0.0",
    private: true,
    dependencies: {
      "@my-monorepo/shared": "workspace:*",
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "react-scripts": "5.0.1",
      "typescript": "^4.9.5",
      "web-vitals": "^2.1.4"
    },
    scripts: {
      "start": "node ../shared/scripts/start.js",
      "build": "node ../shared/scripts/build.js",
      "test": "node ../shared/scripts/test.js",
      "eject": "react-scripts eject"
    },
    "eslintConfig": {
      "extends": [
        "react-app",
        "react-app/jest"
      ]
    },
    "browserslist": {
      "production": [
        ">0.2%",
        "not dead",
        "not op_mini all"
      ],
      "development": [
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
    "compilerOptions": {
      "target": "es5",
      "lib": [
        "dom",
        "dom.iterable",
        "es6"
      ],
      "allowJs": true,
      "skipLibCheck": true,
      "esModuleInterop": true,
      "allowSyntheticDefaultImports": true,
      "strict": true,
      "forceConsistentCasingInFileNames": true,
      "noFallthroughCasesInSwitch": true,
      "module": "esnext",
      "moduleResolution": "node",
      "resolveJsonModule": true,
      "isolatedModules": true,
      "noEmit": true,
      "jsx": "react-jsx"
    },
    "include": [
      "src"
    ]
  };

  fs.writeFileSync(
    path.join(newAppDir, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  );

  // 4. 创建符号链接指向shared的config
  const configLinkPath = path.join(newAppDir, 'config');
  const sharedConfigPath = path.join(projectRoot, 'packages', 'shared', 'config');
  
  // 在Windows上创建符号链接
  if (process.platform === 'win32') {
    execSync(`New-Item -ItemType SymbolicLink -Path "${configLinkPath}" -Target "${sharedConfigPath}"`, {
      shell: 'powershell',
      cwd: projectRoot
    });
  } else {
    // 在Unix系统上创建符号链接
    fs.symlinkSync(sharedConfigPath, configLinkPath, 'dir');
  }

  // 5. 创建符号链接指向shared的scripts
  const scriptsLinkPath = path.join(newAppDir, 'scripts');
  const sharedScriptsPath = path.join(projectRoot, 'packages', 'shared', 'scripts');
  
  if (process.platform === 'win32') {
    execSync(`New-Item -ItemType SymbolicLink -Path "${scriptsLinkPath}" -Target "${sharedScriptsPath}"`, {
      shell: 'powershell',
      cwd: projectRoot
    });
  } else {
    fs.symlinkSync(sharedScriptsPath, scriptsLinkPath, 'dir');
  }

  // 6. 创建符号链接指向shared的public
  const publicLinkPath = path.join(newAppDir, 'public');
  const sharedPublicPath = path.join(projectRoot, 'packages', 'shared', 'public');
  
  if (process.platform === 'win32') {
    execSync(`New-Item -ItemType SymbolicLink -Path "${publicLinkPath}" -Target "${sharedPublicPath}"`, {
      shell: 'powershell',
      cwd: projectRoot
    });
  } else {
    fs.symlinkSync(sharedPublicPath, publicLinkPath, 'dir');
  }

  // 7. 创建基本的React文件
  // 注意：不再创建index.html，因为我们使用shared中的public目录

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
  padding: 20px;
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

  console.log(`✅ App "${appName}" 创建成功！`);
  console.log(`📁 位置: ${newAppDir}`);
  console.log(`🔗 已创建符号链接指向shared的config、scripts和public`);
  console.log(`\n🚀 使用方法:`);
  console.log(`  cd packages/${appName}`);
  console.log(`  pnpm install`);
  console.log(`  pnpm start`);

} catch (error) {
  console.error('创建app时出错:', error.message);
  process.exit(1);
}
