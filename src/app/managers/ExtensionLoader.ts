import { ExtensionMeta, IExtension } from 'keyerext'
import * as path from 'path'
import * as fs from 'fs'
import { electronApi } from '../electronApi'
import Module from 'module'
import React from 'react'
import * as Keyerext from 'keyerext'

export interface ExtensionPackageJson {
  name: string
  version?: string
  title?: string
  description?: string
  icon?: string
  main: string
  commands?: Array<{
    name: string
    title: string
    desc?: string
    icon?: string
    type?: string
  }>
}

export class ExtensionLoader {
  /**
   * 扫描并加载所有本地扩展
   * @param devDir 项目根目录
   * @returns 已加载的扩展列表
   */
  async loadLocalExtensions(devDir: string): Promise<ExtensionMeta[]> {
    const extensions: ExtensionMeta[] = []

    try {
      // 1. 获取 extensions 目录路径
      const extensionsDir = await electronApi.pathJoin(devDir, 'extensions')
      console.log('📂 Scanning extensions directory:', extensionsDir)

      // 2. 读取所有子文件夹
      const folders = await electronApi.readDir(extensionsDir)
      console.log('📁 Found extension folders:', folders)

      // 3. 遍历每个文件夹，加载扩展
      for (const folderName of folders) {
        try {
          const ext = await this.loadExtension(devDir, folderName)
          if (ext) {
            extensions.push(ext)
            console.log('✅ Loaded extension:', ext.name)
          }
        } catch (error) {
          console.error(`❌ Failed to load extension "${folderName}":`, error)
        }
      }
    } catch (error) {
      console.error('❌ Failed to scan extensions directory:', error)
    }

    return extensions
  }

  /**
   * 加载单个扩展
   * @param devDir 项目根目录
   * @param folderName 扩展文件夹名称
   * @returns 扩展元数据，如果加载失败返回 null
   */
  private async loadExtension(
    devDir: string,
    folderName: string
  ): Promise<ExtensionMeta | null> {
    // 1. 读取 package.json
    const extDir = path.join(devDir, 'extensions', folderName)
    const packagePath = path.join(extDir, 'package.json')

    const packageContent = fs.readFileSync(packagePath, 'utf-8')
    const pkg: ExtensionPackageJson = JSON.parse(packageContent)

    // 2. 验证必需字段
    if (!pkg.name || !pkg.main) {
      console.warn(`⚠️  Extension "${folderName}" missing required fields (name or main)`)
      return null
    }

    const mainPath = path.join(extDir, pkg.main)

    if (!fs.existsSync(mainPath)) {
      console.warn(`Main file not found: ${mainPath}`)
      return null
    }

    try {
      // 创建一个新的 Module 实例
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
      let extension: IExtension = new ExtensionClass()
      console.log('Extension instance created:', pkg.commands)
      // 4. 构造 ExtensionMeta
      const meta: ExtensionMeta = {
        name: pkg.name,
        title: pkg.title || pkg.name,
        desc: pkg.description,
        icon: pkg.icon,
        version: pkg.version,
        type: 'local',
        main: pkg.main,
        ext: extension,
        commands: pkg.commands?.map(cmd => ({
          id: '', // 将由 CommandManager 填充
          name: cmd.name,
          title: cmd.title,
          desc: cmd.desc || '',
          icon: cmd.icon || '📦',
          extTitle: pkg.title || pkg.name,
          type: cmd.type || 'command'
        }))
      }

      return meta
    } catch (error) {
      console.error(`❌ Failed to load extension module "${pkg.name}":`, error)
      return null
    }
  }
}

export const extensionLoader = new ExtensionLoader()
