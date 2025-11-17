#!/usr/bin/env node

const shell = require('shelljs');
const path = require('path');
const chalk = require('chalk');

/**
 * 智能启动脚本 - 支持灵活的包名和命令
 * 使用方法:
 *   pnpm start                    - 默认启动 app1
 *   pnpm start app1               - 启动 app1
 *   pnpm start @my-monorepo/app1  - 启动 app1
 *   pnpm start app1 test          - 运行 app1 的 test 命令
 *   pnpm start app2 build         - 运行 app2 的 build 命令
 *   pnpm start --list             - 列出所有可用的应用
 *   pnpm start --help             - 显示帮助信息
 * 
 * 注意: 集群模式已移除，如需使用集群模式，请使用 server 目录下的 Express 服务器
 *       启动命令: pnpm server:start:cluster
 */

const projectRoot = path.resolve(__dirname, '..');
const packagesDir = path.join(projectRoot, 'apps');

// 解析命令行参数
const args = process.argv.slice(2);

// 显示帮助信息
function showHelp() {
  shell.echo('');
  shell.echo('📦 Monorepo 启动脚本');
  shell.echo('');
  shell.echo('使用方法:');
  shell.echo('  pnpm start                    - 默认启动 app1');
  shell.echo('  pnpm start <app-name>         - 启动指定应用');
  shell.echo('  pnpm start <app-name> <cmd>   - 运行指定应用的命令');
  shell.echo('');
  shell.echo('参数:');
  shell.echo('  <app-name>  应用名称，可以是:');
  shell.echo('              - 简短名称: app1, app2, app3, ...');
  shell.echo('              - 完整名称: @my-monorepo/app1, @my-monorepo/app2, ...');
  shell.echo('  <cmd>       要执行的命令 (start, build, test 等)');
  shell.echo('');
  shell.echo('选项:');
  shell.echo('  --list, -l     列出所有可用的应用');
  shell.echo('  --help, -h     显示此帮助信息');
  shell.echo('');
  shell.echo('示例:');
  shell.echo('  pnpm start app1                 - 启动 app1 (执行 start 命令)');
  shell.echo('  pnpm start app2 test            - 运行 app2 的测试');
  shell.echo('  pnpm start @my-monorepo/app3 build - 构建 app3');
  shell.echo('');
  shell.echo('注意: 集群模式已移除，如需使用集群模式，请使用 server 目录下的 Express 服务器');
  shell.echo('      启动命令: pnpm server:start:cluster');
  shell.echo('');
}

// 列出所有可用的应用
function listApps() {
  shell.echo('');
  shell.echo('可用的应用:');
  shell.echo('');
  
  const packages = shell.ls(packagesDir);
  
  packages.forEach(pkg => {
    const pkgPath = path.join(packagesDir, pkg);
    if (shell.test('-d', pkgPath)) {
      const packageJsonPath = path.join(pkgPath, 'package.json');
      if (shell.test('-f', packageJsonPath)) {
        const packageJson = require(packageJsonPath);
        shell.echo(`  - ${pkg.padEnd(15)} (${packageJson.name})`);
      }
    }
  });
  
  shell.echo('');
}

// 标准化包名
function normalizePackageName(appName) {
  // 如果已经是完整的包名，直接返回
  if (appName.startsWith('@my-monorepo/')) {
    return appName;
  }
  
  // 否则添加前缀
  return `@my-monorepo/${appName}`;
}

// 从完整包名获取目录名
function getPackageDir(fullPackageName) {
  // @my-monorepo/app1 -> app1
  return fullPackageName.replace('@my-monorepo/', '');
}

// 验证包是否存在
function validatePackage(appName) {
  const fullPackageName = normalizePackageName(appName);
  const packageDir = getPackageDir(fullPackageName);
  const packagePath = path.join(packagesDir, packageDir);
  
  if (!shell.test('-d', packagePath)) {
    shell.echo('');
    shell.echo(`应用 "${appName}" 不存在`);
    shell.echo('');
    shell.echo('使用 "pnpm start --list" 查看所有可用的应用');
    shell.echo('');
    return false;
  }
  
  return true;
}

// 构建并执行命令
function executeCommand(appName, command = 'start', extraArgs = []) {
  const fullPackageName = normalizePackageName(appName);
  
  // 验证包
  if (!validatePackage(appName)) {
    shell.exit(1);
  }
  
  // 构建 pnpm 命令
  let cmdParts = [
    'pnpm',
    '--filter',
    fullPackageName,
    'run',
    command
  ];
  
  // 添加额外参数
  if (extraArgs.length > 0) {
    cmdParts.push('--', ...extraArgs);
  }
  
  const fullCommand = cmdParts.join(' ');
  
  shell.echo('');
  shell.echo(chalk.cyan(`执行命令: ${fullCommand}`));
  shell.echo('');
  
  // 执行命令，继承标准输入输出和环境变量
  const execOptions = {
    stdio: 'inherit',
    env: { ...process.env }
  };
  
  const result = shell.exec(fullCommand, execOptions);
  
  // 退出并返回相同的退出码
  shell.exit(result.code);
}

// 主逻辑
function main() {
  // 处理帮助选项
  if (args.length === 0) {
    // 默认启动 app1
    executeCommand('app1', 'start');
    return;
  }
  
  const firstArg = args[0];
  
  // 处理特殊选项
  if (firstArg === '--help' || firstArg === '-h') {
    showHelp();
    shell.exit(0);
    return;
  }
  
  if (firstArg === '--list' || firstArg === '-l') {
    listApps();
    shell.exit(0);
    return;
  }
  
  // 解析应用名和命令
  const appName = firstArg;
  const command = args[1] || 'start';
  const extraArgs = args.slice(2);
  
  // 执行命令
  executeCommand(appName, command, extraArgs);
}

// 运行主逻辑
main();