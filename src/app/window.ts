/**
 * 窗口管理模块
 */
import { BrowserWindow } from 'electron'
import * as path from 'path'

let mainWindow: BrowserWindow | null = null

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function createWindow(): BrowserWindow {
  const isDev = !!process.env.VITE_DEV_SERVER_URL
  const windowSize = isDev
    ? { width: 1200, height: 800 }
    : { width: 800, height: 500 }

  mainWindow = new BrowserWindow({
    width: windowSize.width,
    height: windowSize.height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
      webSecurity: false, // 关闭 web 安全策略
      allowRunningInsecureContent: true // 允许不安全内容
    },
  })

  // 保存原始窗口大小
  ;(mainWindow as any).originalSize = windowSize

  // 加载页面
  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || "")
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 初始状态隐藏窗口
  mainWindow.hide()

  // 点击窗口外部时隐藏
  mainWindow.on('blur', () => {
    if (mainWindow) {
      mainWindow.hide()
    }
  })

  return mainWindow
}
