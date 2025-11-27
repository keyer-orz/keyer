import { BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

let mainWindow: BrowserWindow | null = null

function getRendererDist(): string {
  return path.join(process.env.APP_ROOT!, 'dist')
}

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
    mainWindow?.hide()
  })

  // 监听窗口显示/隐藏事件
  ipcMain.on('window-show', () => {
    if (mainWindow) {
      // 确保窗口显示并置于最前面
      mainWindow.show()
      mainWindow.focus()
    }
  })

  ipcMain.on('window-hide', () => {
    if (mainWindow && mainWindow.isVisible()) {
      mainWindow.hide()
    }
  })

  // 监听窗口尺寸调整事件
  ipcMain.on('window-resize', (_event, size: { width: number; height: number }) => {
    if (mainWindow) {
      console.log('Window resized to:', size)
      mainWindow.setSize(size.width, size.height, false) // true 表示动画
      mainWindow.center() // 调整尺寸后居中
    }
  })

  // 加载页面
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(getRendererDist(), 'index.html'))
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
 * 显示主窗口并聚焦
 */
export function showMainWindow(): void {
  if (mainWindow) {
    if (!mainWindow.isVisible()) {
      mainWindow.show()
    }
    mainWindow.focus()
    // 确保窗口置于最前面
    mainWindow.setAlwaysOnTop(true)
    mainWindow.setAlwaysOnTop(false)
  }
}

/**
 * 隐藏主窗口
 */
export function hideMainWindow(): void {
  mainWindow?.hide()
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
