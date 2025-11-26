import { commandManager } from './managers/CommandManager'
import { extensionLoader } from './managers/ExtensionLoader'
import { electronApi } from './electronApi'
import SystemExts from './extesions'

/**
 * 注册所有扩展
 * 1. 先注册内置的系统扩展
 * 2. 扫描并加载本地扩展
 */
export async function registerExtensions() {
  console.log('🚀 Registering extensions...')

  // 1. 注册系统内置扩展（防止重复注册）
  if (!commandManager.getAllCommands().some(cmd => cmd.id!.startsWith('@system#'))) {
    commandManager.register(SystemExts)
    console.log('✅ Registered system extensions')
  } else {
    console.log('⚠️ System extensions already registered, skip.')
  }

  // 2. 加载本地扩展
  try {
    const paths = await electronApi.getAppPaths()
    const devDir = paths.appRoot || paths.userData
    console.log('📂 Dev directory:', devDir)

    const localExtensions = await extensionLoader.loadLocalExtensions(devDir)
    console.log(`📦 Found ${localExtensions.length} local extensions`)

    // 注册每个本地扩展，避免重复命令 key
    for (const ext of localExtensions) {
      commandManager.register(ext)
      console.log('✅ Registered extension:', ext.name)
    }
  } catch (error) {
    console.error('❌ Failed to load local extensions:', error)
  }

  console.log('✅ Extension registration complete')
}
