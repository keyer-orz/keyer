import { globalShortcut } from 'electron'
import Store from 'electron-store'
import { sendToMainWindow, showMainWindow } from './window-manager'

/**
 * 快捷键配置
 */
const shortcutConfig: Record<string, string> = {
  '@system#main': 'Shift+Space', // 默认值，会被用户配置覆盖
  '@system#setting': 'Shift+P',
}

/**
 * 注册所有全局快捷键
 */
export function registerShortcuts(): void {
  const store = new Store()

  // 1. 注册主窗口快捷键
  const mainShortcut = store.get('globalShortcut') as string
  if (mainShortcut) {
    registerMainShortcut(mainShortcut)
  }

  // 2. 注册命令快捷键
  const cmds = store.get('cmds') as Record<string, { disabled?: boolean; shortcut?: string }> || {}
  Object.entries(cmds).forEach(([cmdId, config]) => {
    if (config.shortcut && !config.disabled) {
      registerCommandShortcut(cmdId, config.shortcut)
    }
  })
}

/**
 * 注册主窗口快捷键
 */
function registerMainShortcut(shortcut: string): boolean {
  if (globalShortcut.isRegistered(shortcut)) {
    globalShortcut.unregister(shortcut)
  }

  const success = globalShortcut.register(shortcut, () => {
    sendToMainWindow('navigate-to-page', '@system#main')
  })

  if (!success) {
    console.error(`❌ Failed to register shortcut: ${shortcut}`)
  } else {
    console.log(`✅ Registered shortcut: ${shortcut} -> main`)
  }

  return success
}

/**
 * 注册命令快捷键
 */
function registerCommandShortcut(cmdId: string, shortcut: string): boolean {
  if (globalShortcut.isRegistered(shortcut)) {
    console.warn(`⚠️  Shortcut ${shortcut} already registered, skipping ${cmdId}`)
    return false
  }

  const success = globalShortcut.register(shortcut, () => {
    console.log(`🔥 Shortcut triggered: ${shortcut} -> ${cmdId}`)
    sendToMainWindow('navigate-to-page', cmdId)
  })

  if (!success) {
    console.error(`❌ Failed to register shortcut: ${shortcut} -> ${cmdId}`)
  } else {
    console.log(`✅ Registered shortcut: ${shortcut} -> ${cmdId}`)
  }

  return success
}

/**
 * 更新全局快捷键（主窗口）
 */
export function updateGlobalShortcut(newShortcut: string): boolean {
  const oldShortcut = shortcutConfig['@system#main']

  // 如果新旧快捷键相同，直接返回成功
  if (oldShortcut === newShortcut) return true

  // 注销旧快捷键
  if (oldShortcut && globalShortcut.isRegistered(oldShortcut)) {
    globalShortcut.unregister(oldShortcut)
  }

  // 注册新快捷键
  const success = registerMainShortcut(newShortcut)

  if (success) {
    shortcutConfig['@system#main'] = newShortcut
    console.log(`✅ Updated shortcut to: ${newShortcut}`)
    return true
  } else {
    console.error(`❌ Failed to register new shortcut: ${newShortcut}`)
    // 尝试恢复旧快捷键
    if (oldShortcut) {
      registerMainShortcut(oldShortcut)
    }
    return false
  }
}

/**
 * 更新命令快捷键
 */
export function updateCommandShortcut(cmdId: string, newShortcut: string | undefined): boolean {
  const store = new Store()
  const cmds = store.get('cmds') as Record<string, { disabled?: boolean; shortcut?: string }> || {}
  const oldShortcut = cmds[cmdId]?.shortcut

  // 如果新旧快捷键相同，直接返回成功
  if (oldShortcut === newShortcut) return true

  // 注销旧快捷键
  if (oldShortcut && globalShortcut.isRegistered(oldShortcut)) {
    globalShortcut.unregister(oldShortcut)
  }

  // 如果新快捷键为空，只是删除
  if (!newShortcut) {
    console.log(`✅ Removed shortcut for: ${cmdId}`)
    return true
  }

  // 检查快捷键是否已被占用
  if (globalShortcut.isRegistered(newShortcut)) {
    console.error(`❌ Shortcut ${newShortcut} already registered`)
    return false
  }

  // 注册新快捷键
  const success = registerCommandShortcut(cmdId, newShortcut)

  if (success) {
    console.log(`✅ Updated shortcut: ${newShortcut} -> ${cmdId}`)
    return true
  } else {
    console.error(`❌ Failed to register shortcut: ${newShortcut} -> ${cmdId}`)
    // 尝试恢复旧快捷键
    if (oldShortcut) {
      registerCommandShortcut(cmdId, oldShortcut)
    }
    return false
  }
}

/**
 * 注销所有快捷键
 */
export function unregisterAllShortcuts(): void {
  globalShortcut.unregisterAll()
}
