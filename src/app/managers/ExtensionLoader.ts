import { IExtension } from 'keyerext'
import { ExtensionMeta } from '@/shared/extension'
import * as path from 'path'
import * as fs from 'fs'
import Module from 'module'
import React from 'react'
import * as Keyerext from 'keyerext'
import Log from '../utils/log'
import { api } from '../api'
import { ExtensionPackageInfo } from '../../shared/ipc'
import { ExtensionStore } from './ExtensionStore'

export class ExtensionLoader {
  /**
   * 从主进程扫描并加载所有本地扩展
   * @returns 已加载的扩展列表
   */
  async loadLocalExtensions(): Promise<ExtensionMeta[]> {
    const extensions: ExtensionMeta[] = []

    try {
      // 1. 从主进程获取扩展元数据列表
      const packageInfoList = await api.extensions.scan()
      Log.log(`📦 Received ${packageInfoList.length} extension packages from main process`)

      // 2. 遍历每个扩展，加载实例
      for (const pkgInfo of packageInfoList) {
        try {
          const ext = await this.loadExtension(pkgInfo)
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
   * 加载单个扩展
   * @param pkgInfo 从主进程扫描得到的扩展包信息
   * @returns 扩展元数据，如果加载失败返回 null
   */
  private async loadExtension(
    pkgInfo: ExtensionPackageInfo
  ): Promise<ExtensionMeta | null> {
    try {
      // 1. 构建扩展文件的完整路径
      const mainPath = path.join(pkgInfo.dir, pkgInfo.main)

      if (!fs.existsSync(mainPath)) {
        Log.warn(`Main file not found: ${mainPath}`)
        return null
      }

      // 2. 读取并执行扩展代码
      const pluginCode = fs.readFileSync(mainPath, 'utf-8')
      const pluginModule = new Module(mainPath, module)

      // 设置路径以便插件能找到自己的 node_modules（如果有的话）
      pluginModule.paths = (Module as any)._nodeModulePaths(path.dirname(mainPath))
      pluginModule.filename = mainPath

      // 覆盖 require 方法来拦截特定模块
      pluginModule.require = function (id: string) {
        if (id === 'react') return React
        if (id === 'react/jsx-runtime') return (global as any).ReactJSXRuntime || require('react/jsx-runtime')
        if (id === 'keyerext') return Keyerext

        // 其他模块使用默认加载方式
        return (Module as any)._load(id, pluginModule, false)
      } as any

      // 编译并执行插件代码
      // @ts-ignore - _compile 是内部 API
      pluginModule._compile(pluginCode, mainPath)

      const ExtensionClass = pluginModule.exports.default
      const extension: IExtension = new ExtensionClass()
      Log.log('Extension instance created:', pkgInfo.name)

      // 创建并注入扩展存储
      const store = new ExtensionStore(pkgInfo.name)
      extension.store = store
      extension.dir = pkgInfo.dir

      // 3. 构造 ExtensionMeta
      const meta = new ExtensionMeta(pkgInfo, extension, 'local')

      return meta
    } catch (error) {
      Log.error(`❌ Failed to load extension module "${pkgInfo.name}":`, error instanceof Error ? error.stack || error.message : String(error))
      return null
    }
  }
}

export const extensionLoader = new ExtensionLoader()
