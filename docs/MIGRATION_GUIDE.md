# 迁移指南

本文档说明如何将现有代码迁移到新的架构。

## 1. Extension Package.json 迁移

### 变更对照表

| 旧字段 | 新字段 | 说明 |
|--------|--------|------|
| `id` | 移除 | 使用 `name` 作为唯一标识 |
| `name` | `name` | 保持不变 |
| `title` | `title` | 保持不变 |
| `description` | `desc` | 字段名简化 |
| `version` | `version` | 保持不变，可选 |
| `commands` | `commands` | 保持不变，可选（一般由 onPrepare 动态生成）|
| `main` | `main` | 保持不变 |
| - | `icon` | 新增：扩展图标（emoji 或路径）|

### 迁移步骤

1. 移除 `id` 字段
2. 将 `description` 改为 `desc`
3. 添加 `icon` 字段（可选，建议添加）
4. 移除或清空 `commands` 数组（如果使用 onPrepare 动态生成）

### 示例

**迁移前**:
```json
{
  "id": "com.keyer.app-launcher",
  "name": "app-launcher",
  "title": "App Launcher",
  "version": "1.0.0",
  "description": "Launch macOS applications",
  "commands": [],
  "main": "dist/index.js"
}
```

**迁移后**:
```json
{
  "icon": "🚀",
  "name": "app-launcher",
  "title": "App Launcher",
  "desc": "Launch macOS applications",
  "version": "1.0.0",
  "main": "dist/index.js"
}
```

## 2. Extension 代码迁移

### IActionDef 返回值变更

**迁移前**:
```typescript
async onPrepare(): Promise<IActionDef[]> {
  return [{
    key: 'open-calculator',
    name: '计算器',
    desc: 'Calculator - Utilities',
    typeLabel: 'App'
  }]
}
```

**迁移后**:
```typescript
async onPrepare(): Promise<IActionDef[]> {
  return [{
    name: 'calculator',            // 存储名称（小写，用于生成 ucid）
    title: '计算器',               // 展示名称
    desc: 'Calculator - Utilities', // 展示描述
    type: 'App',                   // 类型（可选）
    icon: '🧮'                     // 图标（可选）
  }]
}
```

### doAction 方法参数变更

**迁移前**:
```typescript
async doAction(key: string): Promise<ExtensionResult> {
  // key: 'open-calculator'
  const appPath = this.appPathMap.get(key)
  // ...
}
```

**迁移后**:
```typescript
async doAction(name: string): Promise<ExtensionResult> {
  // name: 'calculator'
  const appPath = this.appPathMap.get(name)
  // ...
}
```

### 关键变更点

1. **字段名称变更**:
   - `key` → `name` (用于内部标识)
   - `name` → `title` (用于显示)
   - `typeLabel` → `type`

2. **UCID 自动生成**:
   - 不需要手动生成 id 或 key
   - 框架会自动生成 ucid: `ext.name#action.name`
   - 例如: `app-launcher#calculator`

3. **图标优先级**:
   - Action icon > Extension icon > 默认图标
   - 在 `IActionDef` 中设置 `icon` 可覆盖扩展的图标

## 3. 脚本迁移

### 注释格式变更

**迁移前**:
```bash
#!/bin/bash
# @keyer.id com.keyer.open-terminal
# @keyer.key open-terminal
# @keyer.name 打开终端
# @keyer.desc 在当前目录打开终端
```

**迁移后**:
```bash
#!/bin/bash
# @keyer.icon 🖥️
# @keyer.name open-terminal
# @keyer.title 打开终端
# @keyer.desc 在当前目录打开终端
# @keyer.type Script
```

### 关键变更点

1. 移除 `@keyer.id` (使用 `@keyer.name` 作为标识)
2. 移除 `@keyer.key`
3. `@keyer.name` → `@keyer.title` (用于显示的名称)
4. `@keyer.name` 现在用于生成 ucid: `@script#name`
5. 新增 `@keyer.icon` (可选)
6. 新增 `@keyer.type` (可选，默认为 Script)

## 4. Config.json 迁移

### 配置结构变更

**迁移前**:
```json
{
  "theme": "dark",
  "globalShortcut": "Shift+Space",
  "shortcuts": {
    "com.keyer.app-launcher#open-calculator": "⌘⇧C"
  },
  "enabledCommands": {
    "com.keyer.app-launcher#open-calculator": true
  },
  "extensions": {
    "com.keyer.app-launcher": {
      "enabled": true,
      "shortcuts": {}
    }
  },
  "scripts": {
    "com.keyer.open-terminal": {
      "enabled": true,
      "shortcut": "⌘⇧T"
    }
  }
}
```

**迁移后**:
```json
{
  "theme": "dark",
  "hotkey": "Shift+Space",
  "scripts": [
    "/Users/username/my-scripts"
  ],
  "extensions": [
    "/Users/username/my-extensions"
  ],
  "disabled": [
    "app-launcher#calculator"
  ],
  "hotkeys": {
    "app-launcher#calculator": "⌘⇧C",
    "@script#open-terminal": "⌘⇧T"
  }
}
```

### 关键变更点

1. **字段名称变更**:
   - `globalShortcut` → `hotkey`
   - `shortcuts` → `hotkeys`

2. **结构简化**:
   - `extensions` 从对象改为路径数组
   - `scripts` 从对象改为路径数组
   - `enabledCommands` 改为 `disabled` 数组（反向逻辑）

3. **禁用机制**:
   ```json
   // 禁用整个扩展
   "disabled": ["app-launcher#"]

   // 禁用扩展的特定命令
   "disabled": ["app-launcher#calculator"]

   // 禁用脚本
   "disabled": ["@script#open-terminal"]
   ```

4. **UCID 格式**:
   - Extension: `ext.name#cmd.name`
   - Script: `@script#script.name`

## 5. 主进程代码迁移

### ExtensionManager 初始化

**迁移前**:
```typescript
const extensionsDirs = [
  path.join(__dirname, '../extensions'),
  path.join(app.getPath('userData'), 'extensions')
]
extensionManager = new ExtensionManager(extensionsDirs)
```

**迁移后**:
```typescript
const isDev = !!process.env.VITE_DEV_SERVER_URL
const configManager = new ConfigManager()
const config = configManager.getConfig()

extensionManager = new ExtensionManager({
  devDir: isDev ? path.join(__dirname, '../extensions') : undefined,
  mineDirs: config.extensions || [],
  sandboxDir: path.join(app.getPath('userData'), 'extensions')
})
```

### ScriptManager 初始化

**迁移前**:
```typescript
const scriptsDir = path.join(__dirname, '../scripts')
scriptManager = new ScriptManager(scriptsDir)
```

**迁移后**:
```typescript
const isDev = !!process.env.VITE_DEV_SERVER_URL
const configManager = new ConfigManager()
const config = configManager.getConfig()

scriptManager = new ScriptManager({
  devDir: isDev ? path.join(__dirname, '../scripts') : undefined,
  mineDirs: config.scripts || [],
  sandboxDir: path.join(app.getPath('userData'), 'scripts')
})
```

## 6. 渲染进程代码迁移

### Command ID 引用变更

所有使用 `command.id` 的地方需要改为 `command.ucid`:

**迁移前**:
```typescript
const commandId = command.id
executeAction(command.id)
```

**迁移后**:
```typescript
const commandId = command.ucid
executeAction(command.ucid)
```

### Commands 管理器调用变更

**迁移前**:
```typescript
import { Commands } from './shared/Commands'

const commands = new Commands()
await commands.init()
const allCommands = commands.getAllCommands()
```

**迁移后**:
```typescript
import { ExtensionManager } from './shared/Extensions'
import { ScriptManager } from './shared/Scripts'

const extensionManager = new ExtensionManager({...})
const scriptManager = new ScriptManager({...})

await extensionManager.loadExtensions()
await scriptManager.scanScripts()

const extensionCommands = extensionManager.getCommands()
const scriptCommands = scriptManager.getCommands()
const allCommands = [...extensionCommands, ...scriptCommands]
```

## 7. 过滤禁用的命令

```typescript
const configManager = new ConfigManager()

// 过滤禁用的命令
const enabledCommands = allCommands.filter(cmd => {
  return !configManager.isDisabled(cmd.ucid)
})
```

## 8. 显示来源标记

在 UI 中显示命令来源：

```typescript
function getSourceBadge(source?: 'dev' | 'mine' | 'sandbox'): string {
  switch (source) {
    case 'dev':
      return '🔧 Dev'
    case 'mine':
      return '📁 Mine'
    case 'sandbox':
      return '📦 Sandbox'
    default:
      return ''
  }
}

// 使用
<span>{command.title}</span>
<span className="source-badge">{getSourceBadge(command.source)}</span>
```

## 9. 常见问题

### Q: 旧的扩展还能正常工作吗？

A: 部分兼容。由于接口变更，需要更新 package.json 和代码才能正常工作。

### Q: 如何保留用户数据？

A: Store 系统使用 `ext.name` 作为标识，只要 name 不变，数据会自动保留。

### Q: 多个扩展同名会怎样？

A: 按照优先级覆盖：开发环境 > 本地路径 > 沙箱。高优先级的会覆盖低优先级的。

### Q: 如何临时禁用某个扩展？

A: 在 config.json 的 `disabled` 数组中添加 `ext.name#` 即可禁用整个扩展。

### Q: 如何添加自定义扩展路径？

A: 在 config.json 的 `extensions` 数组中添加路径即可。

## 10. 迁移检查清单

- [ ] 更新所有 extension 的 package.json
- [ ] 更新所有 extension 代码中的 IActionDef 返回值
- [ ] 更新所有 extension 代码中的 doAction 参数名
- [ ] 更新所有 script 的注释格式
- [ ] 更新 config.json 格式
- [ ] 更新主进程的 ExtensionManager 初始化
- [ ] 更新主进程的 ScriptManager 初始化
- [ ] 更新渲染进程中所有 command.id 引用为 command.ucid
- [ ] 测试多源加载机制
- [ ] 测试 disabled 功能
- [ ] 测试 hotkeys 功能
- [ ] 测试 source 标记显示

## 11. 完整迁移示例

参考项目中的示例：
- Extension: `extensions/app-launcher/`
- Script: `scripts/open-finder-in-terminal.sh`
- 重构总结: `docs/REFACTORING_SUMMARY.md`
