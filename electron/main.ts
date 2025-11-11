import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import * as path from 'path'
import { CommandManager } from '../src/core/CommandManager'

let mainWindow: BrowserWindow | null = null
let commandManager: CommandManager | null = null

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 500,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
    },
  })

  // 开发模式下加载 vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
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
}

// 初始化命令管理器
async function initializeCommandManager() {
  // 在开发模式下使用项目内的 scripts 目录，在生产模式下也使用打包后的 scripts 目录
  console.log('Current __dirname:', __dirname)
  console.log('Is dev mode:', !!process.env.VITE_DEV_SERVER_URL)

  const scriptsDir = process.env.VITE_DEV_SERVER_URL
    ? path.join(__dirname, '../scripts')  // 开发模式：dist-electron -> 项目根目录/scripts
    : path.join(process.resourcesPath, 'scripts')  // 生产模式：app.asar -> resources/scripts

  const extensionsDir = path.join(__dirname, '../extensions')

  console.log('Scripts directory:', scriptsDir)
  console.log('Extensions directory:', extensionsDir)

  commandManager = new CommandManager(scriptsDir, extensionsDir)
  await commandManager.initialize()
}

// 注册全局快捷键
function registerGlobalShortcut() {
  // 注册 Command+Space 快捷键
  const ret = globalShortcut.register('Shift+Space', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.center()
        mainWindow.webContents.send('focus-input')
      }
    }
  })

  if (!ret) {
    console.log('Failed to register global shortcut')
  }
}

// IPC 事件处理
function setupIPC() {
  // 搜索命令
  ipcMain.handle('search', async (_, input: string) => {
    if (!commandManager) {
      return []
    }
    return await commandManager.search(input)
  })

  // 执行命令
  ipcMain.handle('execute', async (_, action) => {
    if (!commandManager) {
      throw new Error('Command manager not initialized')
    }

    await commandManager.execute(action)

    // 执行后隐藏窗口
    if (mainWindow) {
      mainWindow.hide()
    }
  })

  // 隐藏窗口
  ipcMain.handle('hide-window', () => {
    if (mainWindow) {
      mainWindow.hide()
    }
  })

  // 获取扩展列表
  ipcMain.handle('get-extensions', () => {
    if (!commandManager) {
      console.log('CommandManager not initialized')
      return []
    }
    const extensions = commandManager.getExtensions()
    console.log('Returning extensions:', extensions)
    return extensions
  })

  // 获取脚本列表
  ipcMain.handle('get-scripts', () => {
    if (!commandManager) {
      console.log('CommandManager not initialized')
      return []
    }
    const scripts = commandManager.getScripts()
    console.log('Returning scripts:', scripts)
    return scripts
  })
}

// 应用就绪
app.whenReady().then(async () => {
  await initializeCommandManager()
  createWindow()
  registerGlobalShortcut()
  setupIPC()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 退出前注销快捷键
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// 所有窗口关闭时退出（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
