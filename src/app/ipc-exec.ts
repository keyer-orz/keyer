/**
 * IPC 命令执行处理器
 */
import { ipcMain } from 'electron'
import { exec } from 'child_process'
import type { ExecOptions } from 'keyerext'
import { createExecWindow } from './exec-window'

/**
 * 在 Terminal.app 中执行命令 (macOS)
 */
function execInTerminal(command: string, cwd?: string): void {
  const workDir = cwd || process.cwd()

  // 构建 AppleScript 命令
  const script = `
    tell application "Terminal"
      activate
      do script "cd '${workDir.replace(/'/g, "'\\''")}' && ${command.replace(/"/g, '\\"')}"
    end tell
  `

  // 执行 AppleScript
  exec(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, (error) => {
    if (error) {
      console.error('Failed to execute in Terminal:', error)
    }
  })
}

/**
 * 设置命令执行相关的 IPC 处理器
 */
export function setupExecIPCHandlers() {
  // 执行命令
  ipcMain.handle('exec-command', async (_event, command: string, options?: ExecOptions) => {
    const windowMode = options?.window || 'terminal'
    const cwd = options?.cwd
    console.log(`Executing command: ${command} in mode: ${windowMode} with cwd: ${cwd || 'default'}`)

    if (windowMode === 'terminal') {
      // 在 Terminal.app 中执行
      execInTerminal(command, cwd)
    } else if (windowMode === 'new') {
      // 在新 Electron 窗口中执行
      createExecWindow(command, cwd)
    }
  })
}
