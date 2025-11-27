import { app, BrowserWindow } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import Store from 'electron-store'
import { createMainWindow, clearMainWindow } from './window-manager'
import { registerShortcuts, unregisterAllShortcuts } from './shortcut-manager'
import { registerIpcHandlers } from './ipc-handlers'

// 设置应用根目录
const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.APP_ROOT = path.join(__dirname, '..')

// 应用生命周期事件
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    clearMainWindow()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})

app.on('will-quit', () => {
  // 注销所有快捷键
  unregisterAllShortcuts()
})

// 应用启动
app.whenReady().then(() => {
  // 初始化 electron-store 以供渲染进程使用
  Store.initRenderer()

  // 注册所有 IPC 处理器
  registerIpcHandlers()

  // 创建主窗口
  createMainWindow()

  // 注册全局快捷键
  registerShortcuts()

  console.log('user data:', app.getPath('userData'))
})
