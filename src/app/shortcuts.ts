/**
 * 快捷键管理模块
 */
import { globalShortcut } from 'electron'
import { ConfigManager } from '../shared/Config'
import { getMainWindow } from './window'

const commandShortcuts: Map<string, string> = new Map() // commandId -> shortcut

/**
 * 转换快捷键格式：从显示格式转为 Electron 格式
 */
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
      let mainKey = ''
      while (i < shortcut.length && !symbols[shortcut[i]]) {
        mainKey += shortcut[i]
        i++
      }
      result += mainKey
    }
  }

  if (result.endsWith('+')) {
    result = result.slice(0, -1)
  }

  return result
}

/**
 * 注册全局快捷键 Shift+Space
 */
export function registerGlobalShortcut() {
  const ret = globalShortcut.register('Shift+Space', () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.center()
        // 对齐插件快捷键呼出方式：发送 execute-command 事件执行 @system#main
        mainWindow.webContents.send('execute-command', '@system#main')
      }
    }
  })

  if (!ret) {
    console.log('Failed to register global shortcut')
  }
}

/**
 * 注册命令快捷键
 */
export function registerCommandShortcuts() {
  // 先注销所有命令快捷键
  commandShortcuts.forEach((shortcut, _) => {
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
        const mainWindow = getMainWindow()
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

/**
 * 注销所有快捷键
 */
export function unregisterAllShortcuts() {
  globalShortcut.unregisterAll()
}
