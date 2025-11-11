import { app, BrowserWindow, ipcMain, globalShortcut, protocol } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { CommandManager } from '../src/core/CommandManager'
import { ConfigManager } from '../src/core/ConfigManager'
import { PanelController } from '../src/core/PanelController'

let mainWindow: BrowserWindow | null = null
let commandManager: CommandManager | null = null
let configManager: ConfigManager | null = null

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

  // 创建 PanelController
  const panelController = mainWindow ? new PanelController(mainWindow) : undefined

  commandManager = new CommandManager(scriptsDir, extensionsDir, panelController)
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
      throw new Error('Command manager not initialized1')
    }

    const keepOpen = await commandManager.execute(action)

    // 根据返回值决定是否隐藏窗口
    // true: 保持窗口打开
    // false: 自动关闭窗口
    if (!keepOpen && mainWindow) {
      mainWindow.hide()
    }

    return keepOpen
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

  // 加载 UI 扩展列表
  ipcMain.handle('load-ui-extensions', () => {
    if (!commandManager) {
      console.log('CommandManager not initialized')
      return []
    }
    const uiExtensions = commandManager.getUIExtensions()
    console.log('Returning UI extensions:', uiExtensions)
    return uiExtensions
  })

  // Extension Store 操作
  ipcMain.handle('extension-store-get', (_, extensionId: string, key: string, defaultValue?: any) => {
    if (!commandManager) {
      return defaultValue
    }
    return commandManager.getExtensionStoreValue(extensionId, key, defaultValue)
  })

  ipcMain.handle('extension-store-set', (_, extensionId: string, key: string, value: any) => {
    if (!commandManager) {
      return false
    }
    return commandManager.setExtensionStoreValue(extensionId, key, value)
  })

  ipcMain.handle('extension-store-delete', (_, extensionId: string, key: string) => {
    if (!commandManager) {
      return false
    }
    return commandManager.deleteExtensionStoreValue(extensionId, key)
  })

  ipcMain.handle('extension-store-keys', (_, extensionId: string) => {
    if (!commandManager) {
      return []
    }
    return commandManager.getExtensionStoreKeys(extensionId)
  })

  // 获取配置
  ipcMain.handle('get-config', () => {
    if (!configManager) {
      console.log('ConfigManager not initialized')
      return null
    }
    return configManager.getConfig()
  })

  // 更新配置
  ipcMain.handle('update-config', (_, updates) => {
    if (!configManager) {
      console.log('ConfigManager not initialized')
      return false
    }
    configManager.updateConfig(updates)

    // 如果更新了主题，通知渲染进程
    if (updates.theme && mainWindow) {
      mainWindow.webContents.send('theme-changed', updates.theme)
    }

    return true
  })
}

// 注册自定义协议用于加载扩展文件（生产环境）
function registerExtensionProtocol() {
  protocol.registerFileProtocol('ext-file', (request, callback) => {
    try {
      const url = request.url.substring('ext-file://'.length)
      let filePath = decodeURIComponent(url)

      // 如果是相对路径，转换为绝对路径
      if (!path.isAbsolute(filePath)) {
        // 相对于应用根目录
        filePath = path.join(__dirname, '..', filePath)
      }

      console.log(`Loading extension file: ${filePath}`)
      callback({ path: filePath })
    } catch (error) {
      console.error('Error loading extension file:', error)
      callback({ error: -2 }) // 文件未找到
    }
  })
}

// 应用就绪
app.whenReady().then(async () => {
  // 注册扩展文件协议（用于生产环境）
  registerExtensionProtocol()

  configManager = new ConfigManager()
  createWindow()
  await initializeCommandManager()
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
