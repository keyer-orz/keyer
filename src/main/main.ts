import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import * as path from 'path'
import { ConfigManager } from '../shared/Config'

let mainWindow: BrowserWindow | null = null
let commandShortcuts: Map<string, string> = new Map() // commandId -> shortcut

// 创建主窗口
function createWindow() {
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
      // 在开发模式下禁用 sandbox 以避免权限问题
      sandbox: false,
    },
  })

  // 保存原始窗口大小
  const originalSize = windowSize

  // 开发模式下加载 vite dev server
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

  // 存储原始大小供后续使用
  ;(mainWindow as any).originalSize = originalSize
}

// 注册全局快捷键
function registerGlobalShortcut() {
  // 注册主快捷键 Shift+Space
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

// 转换快捷键格式：从显示格式转为 Electron 格式
function convertShortcutToElectron(shortcut: string): string {
  if (!shortcut) return ''

  const symbols: Record<string, string> = {
    '⌘': 'Command',
    '⌃': 'Control',
    '⌥': 'Alt',
    '⇧': 'Shift'
  }

  let result = ''
  let i = 0
  while (i < shortcut.length) {
    const char = shortcut[i]
    if (symbols[char]) {
      result += symbols[char] + '+'
      i++
    } else {
      // 收集连续的非符号字符作为主键
      let mainKey = ''
      while (i < shortcut.length && !symbols[shortcut[i]]) {
        mainKey += shortcut[i]
        i++
      }
      result += mainKey
    }
  }

  // 移除末尾可能的 +
  if (result.endsWith('+')) {
    result = result.slice(0, -1)
  }

  return result
}

// 注册命令快捷键
function registerCommandShortcuts() {
  // 先注销所有命令快捷键
  commandShortcuts.forEach((shortcut, commandId) => {
    const electronShortcut = convertShortcutToElectron(shortcut)
    if (electronShortcut) {
      globalShortcut.unregister(electronShortcut)
    }
  })
  commandShortcuts.clear()

  // 从单例获取配置
  const configManager = ConfigManager.getInstance()
  const shortcuts = configManager.getAllHotkeys()

  // 注册新的快捷键
  Object.entries(shortcuts).forEach(([commandId, shortcut]) => {
    if (!shortcut) return

    const electronShortcut = convertShortcutToElectron(shortcut)
    if (!electronShortcut) return

    try {
      const success = globalShortcut.register(electronShortcut, () => {
        console.log(`Shortcut triggered for command: ${commandId}`)
        // 显示窗口并执行命令
        if (mainWindow) {
          mainWindow.show()
          mainWindow.center()
          mainWindow.webContents.send('execute-command', commandId)
        }
      })

      if (success) {
        commandShortcuts.set(commandId, shortcut)
        console.log(`Registered shortcut ${electronShortcut} for command ${commandId}`)
      } else {
        console.warn(`Failed to register shortcut ${electronShortcut} for command ${commandId}`)
      }
    } catch (error) {
      console.error(`Error registering shortcut ${electronShortcut}:`, error)
    }
  })
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
      mainWindow.setSize(width, height, false)
      if (center) {
        mainWindow.center()
      }
    }
  })

  // 恢复窗口原始大小
  ipcMain.handle('restore-window-size', () => {
    if (mainWindow) {
      const originalSize = (mainWindow as any).originalSize || { width: 800, height: 500 }
      mainWindow.setSize(originalSize.width, originalSize.height, false)
      mainWindow.center()
    }
  })

  // 获取沙箱目录路径
  ipcMain.handle('get-sandbox-dir', () => {
    return app.getPath('userData')
  })

  // 获取开发环境目录路径
  ipcMain.handle('get-dev-paths', () => {
    const isDev = !!process.env.VITE_DEV_SERVER_URL
    if (!isDev) {
      return { extensionsDir: null, scriptsDir: null }
    }

    // 在开发模式下，返回项目根目录的 extensions 和 scripts 路径
    // __dirname 在开发模式下指向 dist-electron，所以需要上一级到达项目根目录
    const projectRoot = path.join(__dirname, '..')
    return {
      extensionsDir: path.join(projectRoot, 'extensions'),
      scriptsDir: path.join(projectRoot, 'scripts')
    }
  })

}

// 禁用 GPU 和 Sandbox 以避免在某些系统上的崩溃
app.commandLine.appendSwitch('disable-gpu-sandbox')
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-software-rasterizer')

// 应用就绪
app.whenReady().then(async () => {
  // 初始化单例 ConfigManager
  const configManager = ConfigManager.getInstance()

  createWindow()
  registerGlobalShortcut()
  registerCommandShortcuts()  // 注册命令快捷键
  setupIPC()

  // 监听配置变化，自动重新注册快捷键
  configManager.onHotkeysChange((hotkeys) => {
    console.log('Hotkeys configuration changed, re-registering shortcuts...')
    registerCommandShortcuts()
  })

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
