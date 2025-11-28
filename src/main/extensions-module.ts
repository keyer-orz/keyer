import { APIType } from '@/shared/ipc'
import * as path from 'path'
import * as fs from 'fs'
import { app } from 'electron'
import { ExtensionPackageInfo } from '@/shared/ipc'
import { VITE_DEV_SERVER_URL } from './shared'

export const extensionsHandler: APIType['extensions'] = {
  scan: async () => {
    try {
      const devDir = VITE_DEV_SERVER_URL ? process.env.APP_ROOT : undefined
      const extensions = await extensionManager.scanExtensions(devDir)
      console.log(`📦 Scanned ${extensions.length} extensions`)
      return extensions
    } catch (error) {
      console.error('❌ Failed to scan extensions:', error)
      return []
    }
  }
}

////////////////////////////////////////////////////////////////////////////////


/**
 * 主进程扩展管理器
 * 负责扫描扩展目录，读取扩展元数据
 */
export class ExtensionManager {
  private extensionsCache: ExtensionPackageInfo[] | null = null

  /**
   * 扫描并获取所有扩展的元数据
   * @param devDir 开发目录（可选），如果未提供则使用 userData
   * @returns 扩展包信息列表
   */
  async scanExtensions(devDir?: string): Promise<ExtensionPackageInfo[]> {
    // 如果已经扫描过，直接返回缓存
    if (this.extensionsCache) {
      console.log('📦 Using cached extensions')
      return this.extensionsCache
    }

    const extensions: ExtensionPackageInfo[] = []
    const baseDir = devDir || app.getPath('userData')
    const extensionsDir = path.join(baseDir, 'extensions')

    console.log('📂 Scanning extensions directory:', extensionsDir)

    try {
      // 检查目录是否存在
      if (!fs.existsSync(extensionsDir)) {
        console.warn('⚠️  Extensions directory not found:', extensionsDir)
        return []
      }

      // 读取所有子文件夹
      const folders = fs.readdirSync(extensionsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)

      console.log('📁 Found extension folders:', folders)

      // 遍历每个文件夹，读取 package.json
      for (const folderName of folders) {
        try {
          const extInfo = this.readExtensionPackage(extensionsDir, folderName)
          if (extInfo) {
            extensions.push(extInfo)
            console.log('✅ Loaded extension metadata:', extInfo.name)
          }
        } catch (error) {
          console.error(`❌ Failed to load extension "${folderName}":`, error)
        }
      }

      // 缓存结果
      this.extensionsCache = extensions
    } catch (error) {
      console.error('❌ Failed to scan extensions directory:', error)
    }

    return extensions
  }

  /**
   * 读取单个扩展的 package.json
   * @param extensionsDir 扩展目录
   * @param folderName 扩展文件夹名称
   * @returns 扩展包信息，失败返回 null
   */
  private readExtensionPackage(
    extensionsDir: string,
    folderName: string
  ): ExtensionPackageInfo | null {
    const extDir = path.join(extensionsDir, folderName)
    const packagePath = path.join(extDir, 'package.json')

    // 检查 package.json 是否存在
    if (!fs.existsSync(packagePath)) {
      console.warn(`⚠️  package.json not found in "${folderName}"`)
      return null
    }

    // 读取并解析 package.json
    const packageContent = fs.readFileSync(packagePath, 'utf-8')
    const pkg = JSON.parse(packageContent)

    // 验证必需字段
    if (!pkg.name || !pkg.main) {
      console.warn(`⚠️  Extension "${folderName}" missing required fields (name or main)`)
      return null
    }

    // 检查 main 文件是否存在
    const mainPath = path.join(extDir, pkg.main)
    if (!fs.existsSync(mainPath)) {
      console.warn(`⚠️  Main file not found: ${mainPath}`)
      return null
    }

    // 返回扩展信息（包含完整目录路径和相对main文件路径）
    return {
      name: pkg.name,
      title: pkg.title || pkg.name,
      desc: pkg.desc,
      icon: pkg.icon,
      version: pkg.version,
      main: pkg.main, // 相对于扩展目录的路径：main.js
      dir: extDir, // 扩展的完整目录路径
      commands: pkg.commands
    }
  }

  /**
   * 清除缓存，强制重新扫描
   */
  clearCache(): void {
    this.extensionsCache = null
    console.log('🗑️  Extension cache cleared')
  }
}

export const extensionManager = new ExtensionManager()