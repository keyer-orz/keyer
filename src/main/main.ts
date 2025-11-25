import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

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
  '@system#main': 'Shift+Space',
  '@system#setting': 'Shift+P',
}

function createWindow() {
  const isDev = !!VITE_DEV_SERVER_URL

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: isDev, // 开发模式下默认显示，生产模式隐藏
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())

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
  Object.entries(shortcutConfig).forEach(([pageName, shortcut]) => {
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
  createWindow()
  registerShortcuts()
})

app.on('will-quit', () => {
  // 注销所有快捷键
  globalShortcut.unregisterAll()
})
