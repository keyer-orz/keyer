/**
 * 主进程入口
 */
import { app, BrowserWindow } from 'electron'
import { ConfigManager } from '../shared/Config'
import { createWindow, getMainWindow } from './window'
import { registerGlobalShortcut, registerCommandShortcuts, unregisterAllShortcuts } from './shortcuts'
import { setupIPCHandlers } from './ipc-handlers'

// 禁用 GPU 和 Sandbox 以避免在某些系统上的崩溃
app.commandLine.appendSwitch('disable-gpu-sandbox')
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-software-rasterizer')

// 保证热重载只保留单实例
const hasSingleInstanceLock = app.requestSingleInstanceLock()

if (!hasSingleInstanceLock) {
  app.quit()
  process.exit(0)
}

app.on('second-instance', () => {
  const existingWindow = getMainWindow()
  if (existingWindow) {
    if (existingWindow.isMinimized()) {
      existingWindow.restore()
    }
    existingWindow.show()

    existingWindow.focus()
  } else {
    createWindow()
  }
})

// 应用就绪
app.whenReady().then(async () => { 
  // 初始化配置管理器
  const configManager = ConfigManager.getInstance()

  // 创建窗口
  createWindow()

  // 注册快捷键
  registerGlobalShortcut()
  registerCommandShortcuts()

  // 设置 IPC 处理器
  setupIPCHandlers()

  // 监听配置变化，自动重新注册快捷键
  configManager.onHotkeysChange(() => {
    console.log('Hotkeys configuration changed, re-registering shortcuts...')
    registerCommandShortcuts()
  })

  // macOS 激活时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 退出前注销快捷键
app.on('will-quit', () => {
  unregisterAllShortcuts()
})

// 所有窗口关闭时退出（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
