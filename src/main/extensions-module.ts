import { APIType } from '@/shared/ipc'
import * as path from 'path'
import * as fs from 'fs'
import { app } from 'electron'
import { ExtensionPackageInfo, ExtensionCreateOptions } from '@/shared/ipc'

export const extensionsHandler: APIType['extensions'] = {
  scan: async () => {
    try {
      const exts:ExtensionPackageInfo[] = []
      exts.push(...await extensionManager.scanExtensions(process.env.APP_ROOT))
      exts.push(extensionManager.readExtensionPackage(process.env.APP_ROOT || '', 'example')!)
      console.log(`📦 Scanned ${exts.length} extensions`)
      return exts
    } catch (error) {
      console.error('❌ Failed to scan extensions:', error)
      return []
    }
  },

  create: async (options) => {
    try {
      await extensionManager.createExtension(options)
      console.log(`✨ Created extension: ${options.name}`)
    } catch (error) {
      console.error('❌ Failed to create extension:', error)
      throw error
    }
  }
}

////////////////////////////////////////////////////////////////////////////////


/**
 * 主进程扩展管理器
 * 负责扫描扩展目录，读取扩展元数据
 */
export class ExtensionManager {
  /**
   * 扫描并获取所有扩展的元数据
   * @param devDir 开发目录（可选），如果未提供则使用 userData
   * @returns 扩展包信息列表
   */
  async scanExtensions(devDir?: string): Promise<ExtensionPackageInfo[]> {

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
      const folders = fs.readdirSync(extensionsDir)
        .filter(dirent => {
          try {
          return fs.statSync(path.join(extensionsDir, dirent)).isDirectory()
      } catch (err) {
        return false
      }
        })
        .map(dirent => dirent)

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
  readExtensionPackage(
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
    console.log('🗑️  Extension cache cleared')
  }

  /**
   * 创建新扩展
   * @param options 扩展创建选项
   */
  async createExtension(options: ExtensionCreateOptions): Promise<void> {
    const { name, title, desc, targetDir } = options

    // 创建扩展目录
    const extDir = path.join(targetDir, name)
    if (fs.existsSync(extDir)) {
      throw new Error(`Extension directory already exists: ${extDir}`)
    }

    // 获取模板路径
    const appRoot = process.env.APP_ROOT || app.getAppPath()
    const templateDir = process.env.APP_ROOT 
      ? path.join(appRoot, 'templates', 'extension')  // 开发模式
      : path.join(app.getAppPath(), '..', 'templates', 'extension')  // 打包模式

    if (!fs.existsSync(templateDir)) {
      throw new Error(`Template directory not found: ${templateDir}`)
    }

    // 创建目标目录
    fs.mkdirSync(extDir, { recursive: true })

    // 递归复制模板文件并替换占位符
    this.copyTemplateFiles(templateDir, extDir, {
      name,
      title,
      desc,
    })

    console.log(`✨ Extension "${name}" created successfully at ${extDir}`)
  }

  /**
   * 复制模板文件并替换占位符
   */
  private copyTemplateFiles(sourceDir: string, targetDir: string, replacements: Record<string, string>) {
    const files = fs.readdirSync(sourceDir, { withFileTypes: true })

    for (const file of files) {
      const sourcePath = path.join(sourceDir, file.name)
      const targetPath = path.join(targetDir, file.name)

      if (file.isDirectory()) {
        // 创建目录并递归处理
        fs.mkdirSync(targetPath, { recursive: true })
        this.copyTemplateFiles(sourcePath, targetPath, replacements)
      } else {
        // 复制文件并替换占位符
        let content = fs.readFileSync(sourcePath, 'utf-8')
        
        // 替换所有占位符
        for (const [key, value] of Object.entries(replacements)) {
          const regex = new RegExp(`\\$\\{${key}\\}`, 'g')
          content = content.replace(regex, value)
        }
        
        fs.writeFileSync(targetPath, content)
      }
    }
  }
}

export const extensionManager = new ExtensionManager()