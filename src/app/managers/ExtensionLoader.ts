import { Command, Extension } from '@/app/managers/Extension'
import * as path from 'path'
import * as fs from 'fs'
import Log from '../utils/log'
import { Keyer } from '@/app/keyer'
import { ExtensionPackageInfo } from '@/shared/render-api'
import { commandManager } from './CommandManager'
import active from '@/app/extensions'
import { ExtensionConfig, extensionMap, loadModule, setupGlobalModuleInterceptor } from '@/shared/loader'

/**
 * 注册所有扩展
 * 1. 先注册内置的系统扩展
 * 2. 从主进程扫描并加载本地扩展
 */
export async function registerExtensions() {
  console.log('🚀 Registering extensions...')

  //1. 注册App内插件
  active()

  // 2. 加载本地扩展
  try {
    const localExtensions = await loadLocalExtensions()

    // 注册并激活每个本地扩展
    for (const ext of localExtensions) {
      commandManager.register(ext)
      // 激活扩展（加载并执行扩展代码）
      ext.active()
      console.log('✅ Registered and activated extension:', ext.name)
    }
  } catch (error) {
    console.error('❌ Failed to load local extensions:', error)
  }

  // 3. 重新加载所有命令
  commandManager.reloadCommands()
  console.log('✅ Extension registration complete')
}


/**
 * 从主进程扫描并加载所有本地扩展
 * @returns 已加载的扩展列表
 */
async function loadLocalExtensions(): Promise<Extension[]> {
  const extensions: Extension[] = []

  // 在加载扩展前设置全局拦截器
  setupGlobalModuleInterceptor()

  try {
    // 从主进程获取所有扩展元数据列表（包括内置和用户安装的）
    const packageInfoList = await Keyer.extensions.scan()
    Log.log(`📦 Received ${packageInfoList.length} extension packages from main process`)

    // 遍历每个扩展，加载实例
    for (const pkgInfo of packageInfoList) {
      try {
        const ext = await loadExtension(pkgInfo)
        if (ext) {
          extensions.push(ext)
          Log.log('✅ Loaded extension:', ext.name)
        }
      } catch (error) {
        Log.error(`❌ Failed to load extension "${pkgInfo.name}":`, error instanceof Error ? error.stack || error.message : String(error))
      }
    }
  } catch (error) {
    Log.error('❌ Failed to load extensions:', error instanceof Error ? error.stack || error.message : String(error))
  }

  return extensions
}

async function loadExtension(pkgInfo: ExtensionPackageInfo): Promise<Extension | null> {
  try {
    extensionMap.set(pkgInfo.dir, new ExtensionConfig(pkgInfo))

    // 创建扩展实例（不立即加载代码，延迟到 active() 时）
    return new Extension(pkgInfo)
  } catch (error) {
    Log.error(`❌ Failed to load extension module "${pkgInfo.name}":`, error instanceof Error ? error.stack || error.message : String(error))
    return null
  }
}

export function activeExtension(extension: Extension) {
  try {
    const mainPath = path.join(extension.dir, 'dist', 'index.js')
    if (!fs.existsSync(mainPath)) {
      return
    }

    const pluginModule = loadModule(mainPath)
    pluginModule?.exports.active?.()
    Log.log(`✅ Activated extension: ${extension.name}`)
  } catch (error) {
    Log.error(`❌ Failed to activate extension "${extension.name}":`, error instanceof Error ? error.stack || error.message : String(error))
  }
}


export function runCommand(cmd: Command) {
  try {
    const mainPath = path.join(cmd.ext.dir, 'dist', `${cmd.name}.js`)
    const pluginModule = loadModule(mainPath)
    return pluginModule?.exports.default?.()
  } catch (error) {
    Log.error(`❌ Failed to run command "${cmd.name}":`, error instanceof Error ? error.stack || error.message : String(error))
    return null
  }
}