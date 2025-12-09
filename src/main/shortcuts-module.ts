import { globalShortcut } from 'electron'
import { sendToMainWindow } from './window-module'
import { store } from './shared'
import { _IMainAPI } from '@/shared/main-api'


export const shortcutsHandler: _IMainAPI['shortcuts'] = {
  updateGlobal: async (shortcut: string) => {
    return updateGlobalShortcut(shortcut)
  },

  updateCommand: async (cmdId: string, shortcut: string | undefined) => {
    return updateCommandShortcut(cmdId, shortcut)
  },

  registerGlobal: async (shortcut: string) => {
    return registerMainShortcut(shortcut)
  },

  registerCommand: async (cmdId: string, shortcut: string | undefined) => {
    return registerCommandShortcut(cmdId, shortcut!)
  },
}

////////////////////////////////////////////////////////////////////////////////
/**
 * 注册主窗口快捷键
 */
function registerMainShortcut(shortcut: string): boolean {
  let oldShortcut = store.get('globalShortcut') as string | undefined
  if (oldShortcut != undefined && globalShortcut.isRegistered(oldShortcut)) {
    globalShortcut.unregister(oldShortcut)
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
  registerMainShortcut(newShortcut)
  return true
}

/**
 * 更新命令快捷键
 */
export function updateCommandShortcut(cmdId: string, newShortcut: string | undefined): boolean {
  
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
