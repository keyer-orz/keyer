import { BrowserWindow } from 'electron'
import path from 'node:path'

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

let mainWindow: BrowserWindow | null = null

/**
 * 创建主窗口
 */
export function createMainWindow(): BrowserWindow {
  const isDev = !!VITE_DEV_SERVER_URL

  mainWindow = new BrowserWindow({
    width: 800,
    height: 500,
    show: isDev, // 开发模式下默认显示，生产模式隐藏
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
      allowRunningInsecureContent: false
    },
  })

  // 页面加载完成后处理
  mainWindow.webContents.on('did-finish-load', () => {
    if (isDev && mainWindow) {
      mainWindow.show()
    }
  })

  // 监听窗口失去焦点时自动隐藏
  mainWindow.on('blur', () => {
    if (mainWindow) {
      mainWindow.hide()
      mainWindow.setVisibleOnAllWorkspaces(false)
    }
  })

  // 窗口操作现在通过新的IPC系统处理 (window-module.ts)

  // 加载页面
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(path.join(process.env.APP_ROOT!, 'dist'), 'index.html'))
  }

  return mainWindow
}

/**
 * 获取主窗口实例
 */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

/**
 * 向主窗口发送消息
 */
export function sendToMainWindow(channel: string, ...args: any[]): void {
  mainWindow?.webContents.send(channel, ...args)
}

/**
 * 清空窗口引用
 */
export function clearMainWindow(): void {
  mainWindow = null
}
