# 重构总结

根据 `docs/Extensions.md` 文档规范，对 Keyer 项目进行了全面重构。

## 主要变更

### 1. 类型系统重构 (`packages/keyerext/src/index.ts`)

#### ICommand 接口
- **变更前**: 使用 `id`, `key`, `name`, `desc`
- **变更后**: 使用 `ucid`, `icon`, `name`, `title`, `desc`, `type`, `source`

```typescript
export interface ICommand {
  ucid: string        // 唯一命令ID: "ext.name#cmd.name" 或 "@script#script.name"
  icon?: string       // 图标（emoji 或图标路径）
  name: string        // 存储名称
  title: string       // 展示名称
  desc: string        // 展示描述
  type?: string       // 类型：Command、Script 等
  source?: 'dev' | 'mine' | 'sandbox'  // 来源标记
}
```

#### IActionDef 接口
- **变更前**: `name`, `desc`, `typeLabel`, `key`
- **变更后**: `icon`, `name`, `title`, `desc`, `type`

```typescript
export interface IActionDef {
  icon?: string       // 图标（可选，未设置时使用 extension 的 icon）
  name: string        // 存储名称
  title: string       // 展示名称
  desc: string        // 展示描述
  type?: string       // 类型，默认为 Command
}
```

#### ExtensionPackage 接口
- **变更前**: `id`, `name`, `title`, `description`, `version`, `commands`, `main`
- **变更后**: `icon`, `name`, `title`, `desc`, `version`, `commands`, `main`

```typescript
export interface ExtensionPackage {
  icon?: string         // 展示图标（emoji 或图标路径）
  name: string          // 存储名称，建议 xxx-xxx-xx 格式
  title: string         // 展示名称
  desc?: string         // 展示描述
  version?: string      // 版本号
  commands?: ICommand[] // 静态命令列表（可选）
  main: string          // 主入口文件
}
```

### 2. UCID (Unique Command ID) 系统

实现了统一的命令标识符系统：

- **Extension Command**: `ext.name#cmd.name`
  - 例如: `app-launcher#calculator`, `clipboard-history#show`

- **Script Command**: `@script#script.name`
  - 例如: `@script#open-finder-in-terminal`

### 3. ExtensionManager 重构 (`src/shared/Extensions.ts`)

#### 多源加载机制
按照优先级加载扩展：**开发环境 > 本地路径 > 沙箱**

```typescript
constructor(config: {
  devDir?: string       // 开发环境目录（项目根目录/extensions）
  mineDirs?: string[]   // 本地路径目录列表（config.json 中配置）
  sandboxDir?: string   // 沙箱目录（~/Library/Application Support/keyer/extensions）
})
```

#### 来源标记系统
每个扩展和命令都带有 `source` 标记：
- `dev`: 开发环境
- `mine`: 本地路径
- `sandbox`: 沙箱

#### 图标层级
命令图标的优先级：**Command icon >> Extension icon >> 默认图标**

```typescript
const action: IAction = {
  ucid: `${pkg.name}#${def.name}`,
  icon: def.icon || pkg.icon,  // 动作图标 >> 扩展图标
  // ...
}
```

### 4. ScriptManager 重构 (`src/shared/Scripts.ts`)

#### 多源加载
与 ExtensionManager 相同的多源加载机制

#### 脚本注释格式
支持以下注释标记：

```bash
#!/bin/bash
# @keyer.icon 🖥️
# @keyer.name open-finder-in-terminal
# @keyer.title Finder->Terminal
# @keyer.desc 在终端中打开当前Finder所在目录
# @keyer.type Script
```

#### 递归扫描
支持递归扫描子目录，实现文件夹批量加载

### 5. Config 系统重构 (`src/main/Config.ts`)

按照文档规范重构配置结构：

```typescript
interface AppConfig {
  theme: 'dark' | 'light'
  hotkey: string               // 全局快捷键
  scripts: string[]            // 脚本路径列表
  extensions: string[]         // 扩展路径列表
  disabled: string[]           // 禁用列表（ucid 格式）
  hotkeys: {
    [ucid: string]: string     // 各个命令的快捷键
  }
}
```

#### 禁用功能
支持通过 UCID 禁用命令：

```typescript
// 禁用整个扩展
disabled: ["app-launcher#"]

// 禁用扩展的某个命令
disabled: ["app-launcher#calculator"]

// 禁用脚本
disabled: ["@script#open-finder-in-terminal"]
```

### 6. Extension Package.json 更新

更新了所有扩展的 package.json 格式：

**变更前**:
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

**变更后**:
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

### 7. Extension 代码更新

#### IExtension 接口变更
- `doAction(key: string)` → `doAction(name: string)`
- 参数从 `key` 改为 `name`，使用 `IActionDef.name` 而不是独立的 key

#### 示例：app-launcher

**变更前**:
```typescript
return {
  key: actionKey,
  name: actionName,
  desc: `${app.enName} - ${app.category}`,
  typeLabel: 'App'
}
```

**变更后**:
```typescript
return {
  name: actionName,
  title: `${app.name}`,
  desc: `${app.enName} - ${app.category}`,
  type: 'App'
}
```

## App 启动流程

按照文档定义的顺序：

1. **检索沙箱**: `$app-root/extensions`, `$app-root/scripts`
2. **检索本地**: config.json 中的 scripts, extensions 对应的目录
3. **检索开发环境**: 项目的 scripts, extensions 目录

优先级：**开发环境 > 磁盘路径 > 沙箱**

如果有冲突，高优先级覆盖低优先级。

## 生成的数据结构

启动完成后生成：

1. **extensions hash-map**: `Map<string, ExtensionInfo>`
   - Key: extension.name

2. **extension-commands hash-map**: `Map<string, ICommand>`
   - Key: ucid (ext.name#cmd.name)

3. **script-commands hash-map**: `Map<string, ICommand>`
   - Key: ucid (@script#script.name)

## 过滤禁用项

根据 config.json 的 `disabled` 数组过滤：
- 扩展的所有命令
- 扩展的特定命令
- 脚本命令

## Tip 提示系统

每个 extension/command 和 script 都有来源标记：
- `dev`: 仅开发环境展示
- `mine`: 本地路径
- `sandbox`: 沙箱

## 示例文件

### Extension Package.json
参考: `extensions/app-launcher/package.json`

### Script 文件
参考: `scripts/open-finder-in-terminal.sh`

### Config.json 示例
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
    "app-launcher#calculator",
    "@script#old-script"
  ],
  "hotkeys": {
    "app-launcher#terminal": "⌘⇧T",
    "@script#open-finder-in-terminal": "⌘⇧F"
  }
}
```

## 兼容性说明

### 向后兼容
- 保留了 `IAction.typeLabel` 以兼容旧代码
- `ICommand` 继承自文档规范，添加了 `source` 字段

### 需要迁移的代码
1. 所有扩展的 package.json 需要更新格式
2. 扩展代码中的 `IActionDef` 返回值需要更新
3. 所有使用 `command.id` 的地方需要改为 `command.ucid`
4. 所有使用 `action.key` 的地方需要改为 `action.name`

## 下一步工作

### 必须完成
1. 更新所有现有 extensions 的 package.json 格式
2. 更新所有 extensions 代码以使用新接口
3. 更新渲染进程代码以使用 UCID 系统
4. 更新 main.ts 以使用新的 ExtensionManager 和 ScriptManager 构造函数
5. 测试多源加载机制
6. 测试 disabled 功能
7. 测试 hotkeys 功能

### 可选优化
1. 添加扩展热重载功能
2. 添加脚本权限管理
3. 添加扩展版本检测和更新
4. UI 展示 source 标记（dev/mine/sandbox）
