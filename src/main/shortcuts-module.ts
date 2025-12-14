import { globalShortcut } from 'electron'
import { sendToMainWindow } from './window-module'
import { _IMainAPI } from '@/shared/main-api'

export const shortcutsHandler: _IMainAPI['shortcuts'] = {
  registerApp: async (shortcut: string) => {
    return registerApp(shortcut)
  },

  registerCommand: async (cmdId: string, shortcut: string | undefined) => {
    return registerCommandShortcut(cmdId, shortcut!)
  },

  unregister: async (shortcut: string) => {
    return unregister(shortcut)
  },

  unregisterAll: async () => {
    unregisterAllShortcuts()
  }
}

////////////////////////////////////////////////////////////////////////////////

function unregister(shortcut: string): boolean {
  if (globalShortcut.isRegistered(shortcut)) {
    globalShortcut.unregister(shortcut)
    console.log(`✅ Unregistered shortcut: ${shortcut}`)
    return true
  } else {
    console.warn(`⚠️ Shortcut ${shortcut} is not registered`)
    return false
  }
}
/**
 * 注册主窗口快捷键
 */
function registerApp(shortcut: string): boolean {
  unregister(shortcut)
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
  unregister(shortcut)

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
 * 注销所有快捷键
 */
export function unregisterAllShortcuts(): void {
  globalShortcut.unregisterAll()
}
