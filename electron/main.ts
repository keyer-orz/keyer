import { app, BrowserWindow, ipcMain, globalShortcut, dialog } from 'electron'
import * as path from 'path'
import { ConfigManager } from '../src/main/Config'
import { Store } from './Store'
import { ExtensionManager } from '../src/main/ExtensionManager'

let mainWindow: BrowserWindow | null = null
let configManager: ConfigManager | null = null
let store: Store | null = null
let extensionManager: ExtensionManager | null = null

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
      nodeIntegration: true,
      contextIsolation: false,
      // 在开发模式下禁用 sandbox 以避免权限问题
      sandbox: false,
    },
  })

  // 保存原始窗口大小
  const originalSize = { width: 800, height: 500 }

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

  // 存储原始大小供后续使用
  ;(mainWindow as any).originalSize = originalSize
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
  // 隐藏窗口
  ipcMain.handle('hide-window', () => {
    if (mainWindow) {
      mainWindow.hide()
    }
  })

  // 显示窗口
  ipcMain.handle('show-window', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.center()
    }
  })

  // 调整窗口大小
  ipcMain.handle('resize-window', (_, width: number, height: number, center: boolean = true) => {
    if (mainWindow) {
      mainWindow.setSize(width, height, true)
      if (center) {
        mainWindow.center()
      }
    }
  })

  // 恢复窗口原始大小
  ipcMain.handle('restore-window-size', () => {
    if (mainWindow) {
      const originalSize = (mainWindow as any).originalSize || { width: 800, height: 500 }
      mainWindow.setSize(originalSize.width, originalSize.height, true)
      mainWindow.center()
    }
  })

  // 获取路径信息（供渲染进程使用）
  ipcMain.handle('get-paths', () => {
    const isDev = !!process.env.VITE_DEV_SERVER_URL
    const userExtensionsDir = extensionManager ? extensionManager.getExtensionsDir() : null

    // 开发模式：加载 extensions 目录 + Application Support 目录
    // 生产模式：只加载 Application Support 目录
    const extensionsDirs = isDev
      ? [path.join(__dirname, '../extensions'), userExtensionsDir].filter(Boolean) as string[]
      : userExtensionsDir ? [userExtensionsDir] : []

    return {
      scriptsDir: isDev
        ? path.join(__dirname, '../scripts')
        : path.join(process.resourcesPath, 'scripts'),
      extensionsDirs,
      isDev
    }
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

  // Extension Store 操作 (异步)
  ipcMain.handle('extension-store-get', (_, extensionId: string, key: string, defaultValue?: any) => {
    if (!store) {
      console.log('Store not initialized')
      return defaultValue
    }
    return store.get(extensionId, key, defaultValue)
  })

  ipcMain.handle('extension-store-set', (_, extensionId: string, key: string, value: any) => {
    if (!store) {
      console.log('Store not initialized')
      return false
    }
    return store.set(extensionId, key, value)
  })

  ipcMain.handle('extension-store-delete', (_, extensionId: string, key: string) => {
    if (!store) {
      console.log('Store not initialized')
      return false
    }
    return store.delete(extensionId, key)
  })

  ipcMain.handle('extension-store-keys', (_, extensionId: string) => {
    if (!store) {
      console.log('Store not initialized')
      return []
    }
    return store.keys(extensionId)
  })

  // Extension Store 操作 (同步)
  ipcMain.on('extension-store-get-sync', (event, extensionId: string, key: string, defaultValue?: any) => {
    if (!store) {
      console.log('Store not initialized')
      event.returnValue = defaultValue
      return
    }
    event.returnValue = store.get(extensionId, key, defaultValue)
  })

  ipcMain.on('extension-store-set-sync', (event, extensionId: string, key: string, value: any) => {
    if (!store) {
      console.log('Store not initialized')
      event.returnValue = false
      return
    }
    event.returnValue = store.set(extensionId, key, value)
  })

  ipcMain.on('extension-store-delete-sync', (event, extensionId: string, key: string) => {
    if (!store) {
      console.log('Store not initialized')
      event.returnValue = false
      return
    }
    event.returnValue = store.delete(extensionId, key)
  })

  ipcMain.on('extension-store-keys-sync', (event, extensionId: string) => {
    if (!store) {
      console.log('Store not initialized')
      event.returnValue = []
      return
    }
    event.returnValue = store.keys(extensionId)
  })

  // Extension installation handlers
  ipcMain.handle('install-extension', async (_, zipPath: string) => {
    if (!extensionManager) {
      console.log('ExtensionManager not initialized')
      return { success: false, error: 'ExtensionManager not initialized' }
    }
    return await extensionManager.installFromZip(zipPath)
  })

  ipcMain.handle('uninstall-extension', async (_, extensionName: string) => {
    if (!extensionManager) {
      console.log('ExtensionManager not initialized')
      return { success: false, error: 'ExtensionManager not initialized' }
    }
    return await extensionManager.uninstallExtension(extensionName)
  })

  ipcMain.handle('list-installed-extensions', async () => {
    if (!extensionManager) {
      console.log('ExtensionManager not initialized')
      return []
    }
    return extensionManager.getInstalledExtensions()
  })

  ipcMain.handle('get-extensions-dir', async () => {
    if (!extensionManager) {
      console.log('ExtensionManager not initialized')
      return null
    }
    return extensionManager.getExtensionsDir()
  })

  // Show file picker for extension installation
  ipcMain.handle('select-extension-file', async () => {
    if (!mainWindow) {
      return null
    }
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Extension Package',
      filters: [
        { name: 'Extension Package', extensions: ['zip'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  })

  // Shortcuts management
  ipcMain.handle('get-shortcuts', () => {
    if (!configManager) {
      console.log('ConfigManager not initialized')
      return {}
    }
    const config = configManager.getConfig()
    return config.shortcuts || {}
  })

  ipcMain.handle('save-shortcuts', (_, shortcuts: Record<string, string>) => {
    if (!configManager) {
      console.log('ConfigManager not initialized')
      return false
    }
    configManager.updateConfig({ shortcuts })
    return true
  })

  // Enabled commands management
  ipcMain.handle('get-enabled-commands', () => {
    if (!configManager) {
      console.log('ConfigManager not initialized')
      return {}
    }
    const config = configManager.getConfig()
    return config.enabledCommands || {}
  })

  ipcMain.handle('save-enabled-commands', (_, enabledCommands: Record<string, boolean>) => {
    if (!configManager) {
      console.log('ConfigManager not initialized')
      return false
    }
    configManager.updateConfig({ enabledCommands })
    return true
  })
}

// 禁用 GPU 和 Sandbox 以避免在某些系统上的崩溃
app.commandLine.appendSwitch('disable-gpu-sandbox')
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-software-rasterizer')

// 应用就绪
app.whenReady().then(async () => {
  configManager = new ConfigManager()
  store = new Store()
  extensionManager = new ExtensionManager()
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
