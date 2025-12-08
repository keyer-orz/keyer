import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import Store from 'electron-store'
import { createMainWindow, clearMainWindow } from './window-module'
import { registerShortcuts, unregisterAllShortcuts } from './shortcuts-module'
import { fileHandler } from './file-module'
import { windowHandler } from './window-module'
import { shortcutsHandler } from './shortcuts-module'
import { execHandler } from './exec-module'
import { registerAppProtocol } from './app-icon'
import { _IMainAPI } from '@/shared/main-api'
import { pathHandler } from './path-module'

// 设置应用根目录
const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.APP_ROOT = path.join(__dirname, '..')

const modules: _IMainAPI = {
  file: fileHandler,
  window: windowHandler,
  shortcuts: shortcutsHandler,
  exec: execHandler,
  path: pathHandler,
}

export function registerIPC() {
  for (const namespace of Object.keys(modules)) {
    const methods = modules[namespace as keyof typeof modules]!
    for (const method of Object.keys(methods)) {
      const channel = `${namespace}.${method}`
      ipcMain.handle(channel, (_, ...args: any[]) => {
        return (methods as any)[method](...args)
      })
    }
  }
}

export function registerCustomProtocols() {
  registerAppProtocol()
}

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
  // 注册自定义协议
  registerCustomProtocols()
  // 注册新的模块化 IPC 处理器
  registerIPC()
  // 创建主窗口
  createMainWindow()
  // 注册全局快捷键
  registerShortcuts()
})

