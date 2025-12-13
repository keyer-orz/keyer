import { BrowserWindow } from 'electron'
import { VITE_DEV_SERVER_URL } from './shared'
import path from 'node:path'
import { _IMainAPI, CommandData } from '@/shared/main-api'

export const windowHandler: _IMainAPI['window'] = {
  show: async () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      mainWindow.show()
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()
    }
  },

  hide: async () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      mainWindow.hide()
    }
  },

  resize: async (size: { width: number; height: number }) => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      mainWindow.setSize(size.width, size.height)
      mainWindow.center()
    }
  },

  create: async (command: CommandData) => {
    const isDev = !!VITE_DEV_SERVER_URL

    // 创建一个新的独立窗口，不影响主窗口
    const newWindow = new BrowserWindow({
      width: 800,
      height: 660,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        sandbox: false,
        allowRunningInsecureContent: false
      },
    })

    // 页面加载完成后显示
    newWindow.webContents.on('did-finish-load', () => {
      if (!newWindow.isDestroyed()) {
        newWindow.show()
        newWindow.focus()
      }
      newWindow.webContents.send('command.init', command)
    })

    // 加载页面，通过 URL 参数传递 commandScriptPath
    if (VITE_DEV_SERVER_URL) {
      newWindow.loadURL(`${VITE_DEV_SERVER_URL}/command_index.html`)
      if (isDev) {
        newWindow.webContents.openDevTools()
      }
    } else {
      const htmlPath = path.join(process.env.APP_ROOT!, 'dist', 'command_index.html')
      newWindow.loadFile(htmlPath)
    }
  }
}

////////////////////////////////////////////////////////////////////////////////


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

  // 加载页面
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(process.env.APP_ROOT!, 'dist', 'index.html'))
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
