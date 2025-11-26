import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import Store from 'electron-store'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win: BrowserWindow | null

// 快捷键配置
const shortcutConfig: Record<string, string> = {
  '@system#main': 'Shift+Space', // This will be overwritten by user config
  '@system#setting': 'Shift+P',
}

function createWindow() {
  const isDev = !!VITE_DEV_SERVER_URL

  win = new BrowserWindow({
    width: 800,
    height: 500,
    show: isDev, // 开发模式下默认显示，生产模式隐藏
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
      // webSecurity: false, // 移除以提升安全性
      allowRunningInsecureContent: false
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    // 开发模式下，页面加载完成后显示窗口
    if (isDev && win) {
      win.show()
    }
  })

  // 监听栈变化事件
  ipcMain.on('stack-change', (_event, stackLength: number) => {
    if (stackLength === 0) {
      win?.hide()
    } else if (win && !win.isVisible()) {
      win.show()
    }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// 注册全局快捷键
function registerShortcuts() {
  const store = new Store()
  const userShortcut = store.get('globalShortcut') as string

  if (userShortcut) {
    shortcutConfig['@system#main'] = userShortcut
  }

  Object.entries(shortcutConfig).forEach(([pageName, shortcut]) => {
    // 先注销可能存在的旧快捷键（虽然 register 会覆盖，但显式注销更安全）
    if (globalShortcut.isRegistered(shortcut)) {
      // globalShortcut.unregister(shortcut) 
    }

    const success = globalShortcut.register(shortcut, () => {
      console.log(`🔥 Shortcut triggered: ${shortcut} -> ${pageName}`)
      if (win) {
        win.webContents.send('navigate-to-page', pageName)
        if (!win.isVisible()) {
          win.show()
        }
        win.focus()
      }
    })

    if (!success) {
      console.error(`❌ Failed to register shortcut: ${shortcut}`)
    } else {
      console.log(`✅ Registered shortcut: ${shortcut} -> ${pageName}`)
    }
  })
}

// 更新全局快捷键
ipcMain.handle('update-global-shortcut', (_event, newShortcut: string) => {
  const oldShortcut = shortcutConfig['@system#main']

  // 如果新旧快捷键相同，直接返回成功
  if (oldShortcut === newShortcut) return true

  // 注销旧快捷键
  if (oldShortcut && globalShortcut.isRegistered(oldShortcut)) {
    globalShortcut.unregister(oldShortcut)
  }

  // 注册新快捷键
  const success = globalShortcut.register(newShortcut, () => {
    console.log(`🔥 Shortcut triggered: ${newShortcut} -> @system#main`)
    if (win) {
      win.webContents.send('navigate-to-page', '@system#main')
      if (!win.isVisible()) {
        win.show()
      }
      win.focus()
    }
  })

  if (success) {
    shortcutConfig['@system#main'] = newShortcut
    console.log(`✅ Updated shortcut to: ${newShortcut}`)
    return true
  } else {
    console.error(`❌ Failed to register new shortcut: ${newShortcut}`)
    // 尝试恢复旧快捷键
    globalShortcut.register(oldShortcut, () => {
      if (win) {
        win.webContents.send('navigate-to-page', '@system#main')
        if (!win.isVisible()) {
          win.show()
        }
        win.focus()
      }
    })
    return false
  }
})

// 获取应用路径相关信息(这个需要保留在主进程)
ipcMain.handle('get-app-paths', () => {
  return {
    userData: app.getPath('userData'),
    appData: app.getPath('appData'),
    temp: app.getPath('temp'),
    home: app.getPath('home'),
    appRoot: VITE_DEV_SERVER_URL ? process.env.APP_ROOT : undefined
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  // 初始化 electron-store 以供渲染进程使用
  Store.initRenderer()

  createWindow()
  registerShortcuts()

  console.log("user data:", app.getPath('userData'))
})

app.on('will-quit', () => {
  // 注销所有快捷键
  globalShortcut.unregisterAll()
})
