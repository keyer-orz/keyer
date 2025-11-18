# Keyer Exec API

在 Keyer 扩展中执行命令的 API。

## API 定义

```typescript
Keyer.exec(command: string, options?: ExecOptions): Promise<void>
```

### 参数

#### `command: string`
要执行的命令字符串。

#### `options?: ExecOptions`
可选的配置项：

```typescript
interface ExecOptions {
  /** 命令执行窗口类型 */
  window?: 'new' | 'terminal'
  /** 工作目录 */
  cwd?: string
}
```

- `window`: 命令执行方式
  - `'terminal'` (默认): 在 Terminal.app 中打开并执行命令
  - `'new'`: 在新的 Electron 窗口中执行命令，实时显示输出
- `cwd`: 命令执行的工作目录，默认为当前进程的工作目录

## 使用示例

### 1. 在 Terminal 中执行命令（默认）

```typescript
import { Keyer } from 'keyerext'

// 在 Terminal.app 中执行
await Keyer.exec('npm install')

// 指定工作目录
await Keyer.exec('git status', {
  window: 'terminal',
  cwd: '/path/to/project'
})
```

### 2. 在新窗口中执行命令

```typescript
import { Keyer } from 'keyerext'

// 在新 Electron 窗口中执行，查看实时输出
await Keyer.exec('npm run build', {
  window: 'new'
})

// 执行长时间运行的命令
await Keyer.exec('npm run dev', {
  window: 'new',
  cwd: '/path/to/project'
})
```

### 3. 完整扩展示例

```typescript
import { IExtension, ICommand, ExtensionResult, Keyer } from 'keyerext'

class DevToolsExtension implements IExtension {
  enabledPreview = false

  async onPrepare(): Promise<Partial<ICommand>[]> {
    return [
      {
        name: 'npm-install',
        title: 'NPM Install',
        desc: '在当前目录执行 npm install',
        icon: '📦'
      },
      {
        name: 'git-status',
        title: 'Git Status',
        desc: '查看 Git 状态',
        icon: '🔍'
      }
    ]
  }

  async doAction(name: string): Promise<ExtensionResult> {
    if (name === 'npm-install') {
      // 在 Terminal 中执行
      await Keyer.exec('npm install', {
        window: 'terminal'
      })
      return null // 关闭 Keyer 窗口
    }

    if (name === 'git-status') {
      // 在新窗口中执行，查看输出
      await Keyer.exec('git status', {
        window: 'new'
      })
      return null
    }

    return null
  }
}

export default new DevToolsExtension()
```

## 窗口模式对比

### Terminal 模式 (`window: 'terminal'`)

**优点：**
- 使用系统原生 Terminal.app
- 支持交互式命令（需要输入的命令）
- 保持命令历史记录
- 用户可以继续在终端中操作

**适用场景：**
- 交互式命令（如 `npm login`）
- 需要长期运行的服务（如 `npm run dev`）
- 用户需要在终端中继续操作

### New Window 模式 (`window: 'new'`)

**优点：**
- 集成在 Keyer 中
- 实时显示输出
- 更好的视觉反馈（显示退出码、错误高亮）
- 不需要切换应用

**适用场景：**
- 非交互式命令
- 需要查看输出的命令（如 `npm run build`）
- 快速执行并查看结果的场景

## 进程管理

### New Window 模式
- 当窗口关闭时，**会自动终止**正在运行的命令进程
- 首先发送 `SIGTERM` 信号（优雅终止）
- 如果 2 秒内进程未终止，会发送 `SIGKILL` 强制终止
- 确保不会有僵尸进程残留

### Terminal 模式
- 命令在系统 Terminal.app 中运行
- 关闭 Keyer 窗口**不会**影响 Terminal 中的进程
- 进程由用户在 Terminal 中管理

## 注意事项

1. **macOS 专有**: 目前 Terminal 模式仅支持 macOS 的 Terminal.app
2. **安全性**: 命令会在 shell 环境中执行，请注意防止命令注入
3. **异步执行**: exec 是异步方法，返回 Promise
4. **错误处理**: New Window 模式会显示错误信息，Terminal 模式由终端处理
5. **进程终止**: New Window 模式在窗口关闭时会自动终止进程，防止资源泄漏
