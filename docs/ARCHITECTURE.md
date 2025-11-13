# Keyer 架构文档

## 项目概述

Keyer 是一个基于 Electron + React + TypeScript 的应用启动器，支持扩展系统和脚本管理。

## 目录结构

```
keyer/
├── electron/                    # Electron 主进程
│   └── main.ts                  # 主进程入口，窗口管理、IPC 处理
│
├── src/
│   ├── main/                    # 主进程专用代码
│   │   └── ConfigManager.ts     # 配置管理（需要访问 app.getPath）
│   │
│   ├── renderer/                # 渲染进程代码
│   │   ├── App.tsx              # React 主组件
│   │   ├── App.css              # 主组件样式
│   │   ├── main.tsx             # React 入口
│   │   ├── index.css            # 全局样式
│   │   └── components/          # React 组件
│   │       ├── Settings.tsx     # 设置面板
│   │       └── Settings.css
│   │
│   └── shared/                  # 共享业务逻辑（在渲染进程中运行）
│       ├── CommandManager.ts    # 命令管理器（包含单例逻辑）
│       ├── ExtensionManager.ts  # 扩展管理器
│       ├── ScriptManager.ts     # 脚本管理器
│       ├── ExtensionStore.ts    # 扩展持久化存储
│       └── types/               # 类型定义
│           └── index.ts         # 导出 keyerext 包的类型
│
├── packages/
│   └── keyerext/                # 扩展开发 SDK
│       └── src/
│           ├── index.ts         # 核心接口定义
│           └── hooks.ts         # React Hooks
│
├── extensions/                  # 扩展目录
│   ├── app-launcher/            # 应用启动器扩展
│   ├── clipboard-history/       # 剪贴板历史扩展
│   └── system-preferences/      # 系统偏好设置扩展
│
└── scripts/                     # 脚本目录
    └── *.sh, *.js, *.py         # 用户脚本
```

## 架构分层

### 1. 主进程层 (Main Process)

**位置**: `electron/main.ts`, `src/main/`

**职责**:
- 创建和管理应用窗口
- 注册全局快捷键 (Shift+Space)
- 处理 IPC 通信
- 管理应用配置 (ConfigManager)

**关键组件**:
- `electron/main.ts` - Electron 主进程入口
- `src/main/ConfigManager.ts` - 配置文件管理（主进程专用）

**IPC 事件**:
- `get-paths` - 获取脚本和扩展目录路径
- `get-config` - 获取应用配置
- `update-config` - 更新应用配置
- `hide-window` - 隐藏主窗口
- `theme-changed` - 主题变更通知

### 2. 渲染进程层 (Renderer Process)

**位置**: `src/renderer/`

**职责**:
- UI 渲染和用户交互
- 调用业务逻辑层执行命令
- 动态加载和显示扩展组件

**关键组件**:
- `main.tsx` - React 应用入口
- `App.tsx` - 主 UI 组件
  - 搜索输入框
  - 结果列表
  - 扩展组件渲染
  - 设置面板切换
- `components/Settings.tsx` - 设置界面
  - 主题切换
  - 扩展列表
  - 脚本列表

### 3. 共享业务逻辑层 (Shared Logic)

**位置**: `src/shared/`

**职责**:
- 命令搜索和执行
- 扩展加载和管理
- 脚本扫描和执行
- 数据持久化

**关键组件**:

#### CommandManager
统一管理所有命令来源：
- **单例模式**: 使用静态方法 `createInstance()` 和 `getInstance()` 管理唯一实例
- 聚合脚本和扩展的命令
- 提供搜索接口（模糊匹配）
- 执行命令并返回结果

**使用方式**:
```typescript
// 初始化单例（在 App.tsx 中）
await CommandManager.createInstance(scriptsDir, extensionsDir)

// 获取单例实例
const manager = CommandManager.getInstance()
await manager.search('keyword')
```

#### ExtensionManager
扩展生命周期管理：
- 扫描 `extensions/` 目录
- 解析 `package.json` 获取元数据
- 动态加载扩展主文件
- 注入 `store` (ExtensionStore) 到扩展实例
- 调用扩展的 `onPrepare()` 获取 actions
- 执行扩展的 `doAction(key)` 方法

**React 共享机制**:
通过 Module.prototype.require 劫持，让扩展使用主应用的 React 实例，避免多实例导致 Hooks 失效。

#### ScriptManager
脚本文件管理：
- 扫描 `scripts/` 目录下的 `.sh`, `.js`, `.py` 文件
- 解析文件头部的元数据注释：
  ```bash
  # @keyer.name: Script Name
  # @keyer.desc: Description
  # @keyer.key: unique-key
  ```
- 使用 `child_process` 执行脚本

#### ExtensionStore
扩展数据持久化：
- 为每个扩展提供独立的 key-value 存储
- 数据保存在 `~/.config/keyer/extensions/{extensionId}/store.json`
- 实现 `IStore` 接口

## 数据流

### 应用启动流程

```
1. electron/main.ts
   ├── 创建 BrowserWindow
   ├── 初始化 ConfigManager
   ├── 注册全局快捷键
   └── 加载 index.html

2. src/renderer/main.tsx
   ├── 渲染 React 根组件
   └── 挂载 <App />

3. App.tsx - useEffect
   ├── 调用 initializeCommandManager()
   │   ├── 通过 IPC 获取路径信息
   │   ├── 创建 CommandManager 实例
   │   │   ├── ScriptManager.scanScripts()
   │   │   └── ExtensionManager.loadExtensions()
   │   │       ├── 读取 package.json
   │   │       ├── require() 加载扩展
   │   │       ├── 注入 store
   │   │       └── 调用 extension.onPrepare()
   │   └── commandManager.initialize()
   └── 设置 commandManagerReady = true
```

### 搜索执行流程

```
1. 用户输入 → App.tsx setState(input)

2. useEffect 触发 → commandManager.search(input)
   ├── scriptManager.getCommands()
   ├── extensionManager.getCommands()
   └── 模糊匹配过滤

3. 返回 IAction[] → 渲染结果列表

4. 用户选择 → handleExecute(action)
   ├── commandManager.execute(action)
   │   ├── 如果是脚本 → scriptManager.execute()
   │   └── 如果是扩展 → extension.doAction(key)
   │       ├── 返回 boolean → 控制窗口显示/隐藏
   │       └── 返回 IExtensionResult
   │           ├── component → 渲染扩展组件
   │           └── keepOpen → 控制窗口状态
   └── 处理返回值
       ├── 显示扩展组件（如果有）
       └── 隐藏窗口（如果需要）
```

## 扩展系统

### 扩展结构

```
extensions/example-extension/
├── package.json          # 扩展元数据
├── index.ts              # 扩展主文件
├── tsconfig.json         # TypeScript 配置
└── dist/
    └── index.js          # 编译后的文件
```

### package.json 格式

```json
{
  "id": "com.keyer.example",
  "name": "example-extension",
  "title": "Example Extension",
  "version": "1.0.0",
  "main": "dist/index.js",
  "commands": [
    {
      "key": "show-panel",
      "name": "Show Panel",
      "desc": "Show extension panel"
    }
  ],
  "scripts": {
    "build": "tsc"
  }
}
```

### 扩展接口

扩展必须实现 `IExtension` 接口：

```typescript
import { IExtension, IActionDef, IExtensionResult, IStore } from 'keyerext'

class MyExtension implements IExtension {
  store?: IStore  // 由框架注入

  async onPrepare(): Promise<IActionDef[]> {
    // 返回扩展提供的 actions
    return []
  }

  doAction(key: string): boolean | IExtensionResult {
    // 执行命令
    // 返回 boolean 控制窗口状态
    // 或返回 IExtensionResult 提供 React 组件
    return true
  }
}

export default new MyExtension()
```

### 扩展返回 React 组件

```typescript
doAction(key: string): IExtensionResult {
  return {
    keepOpen: true,
    component: MyReactComponent,
    props: {
      data: someData,
      onClose: () => { /* 由框架注入 */ }
    }
  }
}
```

## 脚本系统

### 脚本格式

在脚本文件头部使用注释定义元数据：

**Shell 脚本 (.sh)**:
```bash
#!/bin/bash
# @keyer.name: My Script
# @keyer.desc: Does something cool
# @keyer.key: my-script

echo "Hello World"
```

**JavaScript 脚本 (.js)**:
```javascript
// @keyer.name: My Script
// @keyer.desc: Does something cool
// @keyer.key: my-script

console.log('Hello World')
```

**Python 脚本 (.py)**:
```python
# @keyer.name: My Script
# @keyer.desc: Does something cool
# @keyer.key: my-script

print('Hello World')
```

## 技术栈

- **Electron**: 27.0.0 - 跨平台桌面应用框架
- **React**: 18.2.0 - UI 框架
- **TypeScript**: 5.0.0 - 类型安全
- **Vite**: 5.0.0 - 构建工具
- **vite-plugin-electron**: Electron 集成

## 构建流程

```bash
# 开发模式
npm run electron:dev
# → 并行运行 Vite 开发服务器和 Electron

# 构建
npm run build
# → 1. npm run build:extensions  # 构建所有扩展
# → 2. tsc                        # 编译 TypeScript
# → 3. vite build                 # 构建渲染进程
# → 4. electron-builder           # 打包应用
```

## 配置文件

### 应用配置

**位置**: `~/.config/keyer/config.json`

```json
{
  "theme": "dark",
  "shortcut": "Shift+Space"
}
```

### 扩展数据

**位置**: `~/.config/keyer/extensions/{extensionId}/store.json`

每个扩展有独立的存储文件。

## 设计决策

### 为什么分离 main/renderer/shared?

1. **清晰的职责分离**:
   - `main/` 只包含需要 Electron 主进程 API 的代码
   - `renderer/` 只包含 UI 相关代码
   - `shared/` 包含可在渲染进程中运行的业务逻辑

2. **类型安全**:
   - 避免在渲染进程中误用主进程 API
   - 编译时就能发现错误

3. **可维护性**:
   - 代码组织清晰，易于理解和维护
   - 新成员能快速找到需要修改的代码

### 为什么扩展在渲染进程运行?

1. **访问 React**: 扩展可以返回 React 组件在主窗口中渲染
2. **简化架构**: 不需要复杂的进程间通信
3. **性能**: 直接在 UI 线程执行，响应更快

### 为什么劫持 Module.require?

扩展需要使用 React 创建组件，但如果每个扩展都打包自己的 React：
1. 包体积大
2. 多个 React 实例导致 Hooks 失效
3. 性能差

通过劫持 `require('react')`，让所有扩展共享主应用的 React 实例。

## 已移除的代码

在架构重构中，以下代码已被移除：

1. **Panel.tsx / Panel.css**: 未使用的 Panel 组件
2. **UIExtensionLoader.ts**: 未集成的动态加载器
3. **PanelController.ts**: 重复的主进程 Panel 控制器
4. **RendererPanelController.ts**: 已废弃的渲染进程 Panel 控制器
5. **RendererCommandManager.ts**: 包装类（单例逻辑已整合到 CommandManager 中）

当前扩展 UI 通过 `IExtensionResult` 直接返回 React 组件实现，不再需要 Panel 控制器。
CommandManager 使用静态方法管理单例，不再需要独立的包装类。

## 未来扩展方向

1. **插件市场**: 扩展发现和安装
2. **主题系统**: 可自定义的 UI 主题
3. **快捷键自定义**: 用户自定义快捷键
4. **多窗口支持**: 支持多个独立窗口
5. **搜索算法优化**: 更智能的模糊匹配和排序
