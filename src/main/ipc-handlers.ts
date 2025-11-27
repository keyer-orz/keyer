import { app, ipcMain } from 'electron'
import { updateGlobalShortcut, updateCommandShortcut } from './shortcut-manager'
import { executeInTerminal, executeInWindow } from './command-executor'
import { extensionManager } from './ext-manager'
import { VITE_DEV_SERVER_URL } from './window-manager'

/** 
 * 注册所有 IPC 处理器
 */
export function registerIpcHandlers(): void {
  // 获取应用路径相关信息
  ipcMain.handle('get-app-paths', () => {
    return {
      userData: app.getPath('userData'),
      appData: app.getPath('appData'),
      temp: app.getPath('temp'),
      home: app.getPath('home'),
      appRoot: VITE_DEV_SERVER_URL ? process.env.APP_ROOT : undefined
    }
  })

  // 扫描并获取扩展列表
  ipcMain.handle('scan-extensions', async () => {
    try {
      const devDir = VITE_DEV_SERVER_URL ? process.env.APP_ROOT : undefined
      const extensions = await extensionManager.scanExtensions(devDir)
      console.log(`📦 Scanned ${extensions.length} extensions`)
      return extensions
    } catch (error) {
      console.error('❌ Failed to scan extensions:', error)
      return []
    }
  })

  // 获取扩展文件的完整路径
  ipcMain.handle('get-extension-path', (_event, extensionMain: string) => {
    const devDir = VITE_DEV_SERVER_URL ? process.env.APP_ROOT : undefined
    return extensionManager.getExtensionPath(devDir, extensionMain)
  })

  // 更新全局快捷键
  ipcMain.handle('update-global-shortcut', (_event, newShortcut: string) => {
    return updateGlobalShortcut(newShortcut)
  })

  // 更新命令快捷键
  ipcMain.handle('update-cmd-shortcut', (_event, cmdId: string, newShortcut: string | undefined) => {
    return updateCommandShortcut(cmdId, newShortcut)
  })

  // 命令执行 - 系统终端模式
  ipcMain.handle('exec-terminal', async (_event, cmd: string, cwd?: string) => {
    return executeInTerminal(cmd, cwd)
  })

  // 命令执行 - 新窗口模式
  ipcMain.handle('exec-window', async (_event, cmd: string) => {
    return executeInWindow(cmd)
  })
}
