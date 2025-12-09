import { IExtension } from 'keyerext'
import { Extension } from '@/shared/extension'
import * as path from 'path'
import * as fs from 'fs'
import Module from 'module'
import React from 'react'
import Log from '../utils/log'
import { Keyer } from '@/app/keyer'
import { ExtensionPackageInfo } from '@/shared/render-api'
import { ExtensionStore } from './ExtensionStore'
import { commandManager } from './CommandManager'
import SystemExts from '@/app/extensions'
import { configManager } from '../utils/config'

/**
 * 注册所有扩展
 * 1. 先注册内置的系统扩展
 * 2. 从主进程扫描并加载本地扩展
 */
export async function registerExtensions() {
  console.log('🚀 Registering extensions...')

  //1. 注册App内插件
  commandManager.register(SystemExts)

  // 2. 加载本地扩展
  try {
    const localExtensions = await loadLocalExtensions()
    
    // 注册每个本地扩展
    for (const ext of localExtensions) {
      commandManager.register(ext)
      console.log('✅ Registered extension:', ext.name)
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

/**
 * 加载单个扩展（CommonJS 格式）
 * keyerext 是 ESM，使用动态 import() 加载
 * @param pkgInfo 从主进程扫描得到的扩展包信息
 * @returns 扩展元数据，如果加载失败返回 null
 */
async function loadExtension(pkgInfo: ExtensionPackageInfo): Promise<Extension | null> {
  try {
    const extConfig = configManager.getExtesionConfig(pkgInfo.name)
    if (extConfig.disabled) {
      return new Extension(pkgInfo, undefined)
    }

    // 构建扩展文件的完整路径
    const mainPath = path.join(pkgInfo.dir, pkgInfo.main)

    if (!fs.existsSync(mainPath)) {
      Log.warn(`Main file not found: ${mainPath}`)
      return null
    }

    // 动态导入 keyerext（ESM）
    const Keyerext = await import('keyerext')

    // 全局拦截 Module._load，确保扩展的所有文件都能正确加载依赖
    const originalLoad = (Module as any)._load
    const extensionDir = pkgInfo.dir

      ; (Module as any)._load = function (request: string, parent: any) {
        // 只拦截来自当前扩展目录的模块加载
        if (parent?.filename?.startsWith(extensionDir)) {
          if (request === 'react') return React
          if (request === 'react/jsx-runtime') return require('react/jsx-runtime')
          if (request === 'keyerext') return Keyerext
        }
        return originalLoad.apply(this, arguments)
      }

    try {
      // 读取并执行扩展代码（CommonJS）
      const pluginCode = fs.readFileSync(mainPath, 'utf-8')
      const pluginModule = new Module(mainPath, module)

      // 设置路径以便插件能找到自己的 node_modules
      pluginModule.paths = (Module as any)._nodeModulePaths(path.dirname(mainPath))
      pluginModule.filename = mainPath

      // 覆盖 require 方法，注入共享依赖
      pluginModule.require = function (id: string) {
        // 使用全局 _load，它会处理拦截
        return (Module as any)._load(id, pluginModule, false)
      } as any

      // 编译并执行插件代码
      // @ts-ignore - _compile 是内部 API
      pluginModule._compile(pluginCode, mainPath)

      const ExtensionClass = pluginModule.exports.default

      const extension: IExtension = new ExtensionClass()
      const store = new ExtensionStore(pkgInfo.name)
      extension.store = store
      
      const ext = new Extension(pkgInfo, extension)
      ext.config = extConfig
      return ext
    } finally {
      // 恢复原始的 _load 方法
      ; (Module as any)._load = originalLoad
    }
  } catch (error) {
    Log.error(`❌ Failed to load extension module "${pkgInfo.name}":`, error instanceof Error ? error.stack || error.message : String(error))
    return null
  }
}
