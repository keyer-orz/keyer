import { BrowserWindow } from 'electron'
import { VITE_DEV_SERVER_URL, store } from './shared'
import path from 'node:path'
import { _IMainAPI, CommandData } from '@/shared/main-api'

// 缓存每个 command 对应的窗口
const commandWindowCache = new Map<string, BrowserWindow>()

// 窗口位置存储的 key
const WINDOW_POSITION_KEY = 'mainWindow.position'

// 窗口位置类型
interface WindowPosition {
  x: number
  y: number
}

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
      // 不要调用 center()，保持用户设置的位置
    }
  },

  create: async (command: CommandData) => {
    const isDev = !!VITE_DEV_SERVER_URL
    const commandKey = `${command.ext.name}#${command.name}`

    // 检查缓存中是否已存在该 command 的窗口
    let existingWindow = commandWindowCache.get(commandKey)
    
    // 如果窗口存在且未被销毁，则显示并聚焦该窗口
    if (existingWindow && !existingWindow.isDestroyed()) {
      existingWindow.show()
      if (existingWindow.isMinimized()) {
        existingWindow.restore()
      }
      existingWindow.focus()
      // 重新发送 command 初始化数据
      existingWindow.webContents.send('command.init', command)
      return
    }

    // 创建一个新的独立窗口，不影响主窗口
    const newWindow = new BrowserWindow({
      width: 800,
      height: 660,
      fullscreenable: false, // 禁用全屏按钮
      simpleFullscreen: false, // 禁用简单全屏模式
      resizable: false, // 可选：禁止调整窗口大小
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        sandbox: false,
        allowRunningInsecureContent: false
      },
    })

    // 将新窗口添加到缓存
    commandWindowCache.set(commandKey, newWindow)

    // 窗口关闭时从缓存中移除
    newWindow.on('closed', () => {
      commandWindowCache.delete(commandKey)
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

/**
 * 保存主窗口位置
 */
function saveMainWindowPosition() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }
  
  const [x, y] = mainWindow.getPosition()
  store.set(WINDOW_POSITION_KEY, { x, y })
}

/**
 * 获取保存的主窗口位置
 */
function getSavedMainWindowPosition(): WindowPosition | null {
  const position = store.get(WINDOW_POSITION_KEY) as WindowPosition | undefined
  return position || null
}

////////////////////////////////////////////////////////////////////////////////


let mainWindow: BrowserWindow | null = null

/**
 * 创建主窗口
 */
export function createMainWindow(): BrowserWindow {
  const isDev = !!VITE_DEV_SERVER_URL

  // 获取保存的窗口位置
  const savedPosition = getSavedMainWindowPosition()

  mainWindow = new BrowserWindow({
    width: 800,
    height: 500,
    x: savedPosition?.x,
    y: savedPosition?.y,
    show: isDev, // 开发模式下默认显示，生产模式隐藏
    frame: false,
    movable: true, // 允许拖动
    fullscreenable: false, // 禁用全屏按钮
    simpleFullscreen: false, // 禁用简单全屏模式
    resizable: false, // 可选：禁止调整窗口大小
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
      allowRunningInsecureContent: false
    },
  })

  // 如果没有保存的位置，则居中显示
  if (!savedPosition) {
    mainWindow.center()
  }

  // 监听窗口移动事件，保存位置
  let savePositionTimer: NodeJS.Timeout | null = null
  mainWindow.on('move', () => {
    // 使用防抖，避免频繁保存
    if (savePositionTimer) {
      clearTimeout(savePositionTimer)
    }
    savePositionTimer = setTimeout(() => {
      saveMainWindowPosition()
    }, 500)
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
