# Keyer

Electron + React + Vite + TypeScript 项目模板

## 技术栈

- **Electron**: 跨平台桌面应用框架
- **React 18**: 用户界面构建库
- **Vite**: 快速的前端构建工具
- **TypeScript**: JavaScript 的类型化超集

## 项目结构

```
keyer/
├── electron/           # Electron 主进程和预加载脚本
│   ├── main.ts        # 主进程入口
│   └── preload.ts     # 预加载脚本
├── src/               # React 应用源代码
│   ├── App.tsx        # 主应用组件
│   ├── App.css        # 应用样式
│   ├── main.tsx       # React 入口
│   ├── index.css      # 全局样式
│   └── vite-env.d.ts  # TypeScript 类型声明
├── public/            # 静态资源
├── index.html         # HTML 模板
├── vite.config.ts     # Vite 配置
├── tsconfig.json      # TypeScript 配置 (React)
├── tsconfig.node.json # TypeScript 配置 (Vite)
├── tsconfig.electron.json # TypeScript 配置 (Electron)
└── package.json       # 项目依赖和脚本
```

## 开始使用

### 安装依赖

```bash
npm install
```

### 开发模式

启动 Vite 开发服务器并运行 Electron:

```bash
npm start
```

或者分别启动:

```bash
# 启动 Vite 开发服务器
npm run dev

# 在另一个终端运行 Electron
npm run electron:dev
```

### 构建生产版本

```bash
npm run build
```

构建完成后，打包文件将生成在 `release` 目录中。

## 功能特性

- 热模块替换 (HMR) 支持
- TypeScript 类型检查
- Electron 主进程与渲染进程通信
- 自动打包为可分发的应用程序

## 开发说明

### 主进程与渲染进程通信

项目使用 `contextBridge` 和 `ipcRenderer` 实现安全的进程间通信。

在 `electron/preload.ts` 中暴露 API:

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  // 定义你的 API
})
```

在 React 组件中使用:

```typescript
window.electronAPI.onMessage((message) => {
  console.log(message)
})
```

### 添加新的依赖

```bash
npm install <package-name>
```

### TypeScript 配置

- `tsconfig.json`: React 应用的配置
- `tsconfig.electron.json`: Electron 主进程的配置
- `tsconfig.node.json`: Vite 配置文件的配置

## 许可证

ISC
