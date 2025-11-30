import { app, BrowserWindow, ipcMain, protocol } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import Store from 'electron-store'
import { createMainWindow, clearMainWindow } from './window-module'
import { registerShortcuts, unregisterAllShortcuts } from './shortcuts-module'
import { appHandler } from './app-module'
import { fileHandler } from './file-module'
import { windowHandler } from './window-module'
import { extensionsHandler } from './extensions-module'
import { shortcutsHandler } from './shortcuts-module'
import { execHandler } from './exec-module'
import { registerAppIconProtocol } from './app-icon'

// 设置应用根目录
const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.APP_ROOT = path.join(__dirname, '..')

const modules = {
  app: appHandler,
  file: fileHandler,
  window: windowHandler,
  extensions: extensionsHandler,
  shortcuts: shortcutsHandler,
  exec: execHandler,
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
  registerAppIconProtocol()
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

  console.log('user data:', app.getPath('userData'))
})

