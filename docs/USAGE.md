# Keyer 使用说明

## 项目结构

```
keyer/
├── electron/              # Electron 主进程和预加载脚本
│   ├── main.ts           # 主进程入口
│   └── preload.ts        # 预加载脚本
├── src/                   # React 渲染进程
│   ├── core/             # 核心功能模块
│   │   ├── CommandManager.ts    # 命令管理器
│   │   ├── ScriptManager.ts     # 脚本管理器
│   │   └── ExtensionManager.ts  # 扩展管理器
│   ├── types/            # TypeScript 类型定义
│   │   └── index.ts      # ICommand, IAction, IExtension 等
│   ├── App.tsx           # 主 UI 组件
│   ├── App.css           # 样式
│   └── main.tsx          # React 入口
├── extensions/            # 扩展目录
│   ├── app-launcher/     # 应用启动器扩展
│   └── system-preferences/  # 系统设置扩展
└── scripts/               # 脚本目录
    ├── finder-to-terminal.sh    # Finder 到终端
    └── terminal-to-finder.sh    # 终端到 Finder
```

## 启动项目

### 开发模式

```bash
npm run dev
```

这将同时启动 Vite 开发服务器和 Electron 应用。

### 构建打包

```bash
npm run build
```

这将构建应用并打包成可执行文件，输出到 `release` 目录。

## 快捷键

- `Shift+Space`: 呼出/隐藏命令面板
- `↑/↓`: 在搜索结果中上下选择
- `Enter`: 执行选中的命令
- `Esc`: 隐藏命令面板

## 已实现的功能

### 1. App 打开（Extension）

可以搜索并打开 macOS 应用程序，支持：
- 实用工具目录下的应用（计算器、日历、终端等）
- /Applications 目录下的所有应用
- 中英文搜索（如："计算器" 或 "calculator"）

**使用示例：**
- 输入 "计算器" 或 "calculator" 打开计算器
- 输入 "终端" 或 "terminal" 打开终端
- 输入 "utilities" 查看所有实用工具

### 2. 设置项打开（Extension）

可以搜索并打开系统设置项，支持：
- 网络设置
- Wi-Fi 设置
- 其他常用系统设置
- 中英文搜索

**使用示例：**
- 输入 "网络" 或 "network" 打开网络设置
- 输入 "wifi" 打开 Wi-Fi 设置
- 输入 "蓝牙" 或 "bluetooth" 打开蓝牙设置

### 3. Finder <-> Terminal（Script）

两个便捷脚本：
- **Finder 到终端**：在终端中打开当前 Finder 所在目录
- **终端到 Finder**：在 Finder 中打开当前终端所在目录

**使用示例：**
- 输入 "Finder到终端" 执行脚本
- 输入 "终端到Finder" 执行脚本

## 扩展开发

### 创建 Extension

1. 在 `extensions/` 目录下创建新文件夹
2. 创建 `package.json`:

```json
{
  "id": "com.keyer.your-extension",
  "name": "Your Extension Name",
  "version": "1.0.0",
  "commands": [
    {
      "id": "com.keyer.your-extension.command",
      "name": "命令名称",
      "desc": "命令描述"
    }
  ],
  "main": "index.js"
}
```

3. 创建 `index.js` 并实现 IExtension 接口:

```javascript
class YourExtension {
  async onPrepare() {
    // 初始化逻辑
  }

  async onSearch(input) {
    // 返回搜索结果
    return [
      {
        id: 'your-action-id',
        name: '动作名称',
        desc: '动作描述',
        ext: { /* 自定义数据 */ }
      }
    ]
  }

  async doAction(action) {
    // 执行动作
  }
}

module.exports = new YourExtension()
```

### 创建 Script

1. 在 `scripts/` 目录下创建脚本文件（.sh, .js, .py）
2. 在文件开头添加注释：

```bash
#!/bin/bash

# @keyer.id com.keyer.your-script
# @keyer.name 脚本名称
# @keyer.desc 脚本描述

# 脚本内容...
```

## 技术栈

- **Electron**: 跨平台桌面应用框架
- **React**: UI 框架
- **TypeScript**: 类型安全的 JavaScript
- **Vite**: 快速的构建工具

## 注意事项

1. 脚本文件需要有执行权限（`chmod +x`）
2. macOS 可能需要授予 Electron 应用辅助功能权限
3. 全局快捷键可能与系统快捷键冲突，可在 `electron/main.ts` 中修改
4. Extension 需要重启应用才能加载，Script 可以热加载

## 故障排除

### 快捷键不生效

检查系统是否已有其他应用占用 `Shift+Space` 快捷键，可以在 `electron/main.ts` 的 `registerGlobalShortcut()` 函数中修改。

### Extension 无法加载

1. 检查 `extensions/` 目录下的 `package.json` 格式是否正确
2. 检查 `main` 字段指向的文件是否存在
3. 查看控制台输出的错误信息

### Script 无法执行

1. 检查脚本文件是否有执行权限
2. 检查注释格式是否正确（`@keyer.id`, `@keyer.name`, `@keyer.desc`）
3. 检查脚本语法是否正确

## 许可证

MIT
