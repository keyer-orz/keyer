import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import AdmZip from 'adm-zip'

interface ExtensionPackage {
  id: string
  name: string
  version: string
  description?: string
  main: string
}

export class ExtensionManager {
  private extensionsDir: string

  constructor() {
    // 使用 Application Support 目录
    const appDataDir = app.getPath('userData')
    this.extensionsDir = path.join(appDataDir, 'extensions')
    this.ensureExtensionsDir()
  }

  private ensureExtensionsDir() {
    if (!fs.existsSync(this.extensionsDir)) {
      fs.mkdirSync(this.extensionsDir, { recursive: true })
    }
  }

  /**
   * 获取 extensions 目录路径
   */
  getExtensionsDir(): string {
    return this.extensionsDir
  }

  /**
   * 验证 zip 包是否是有效的插件
   */
  private validateExtensionZip(zipPath: string): { valid: boolean; error?: string; pkg?: ExtensionPackage } {
    try {
      const zip = new AdmZip(zipPath)
      const entries = zip.getEntries()

      // 查找 package.json
      const pkgEntry = entries.find(entry => {
        const parts = entry.entryName.split('/')
        // 支持两种结构：
        // 1. package.json 在根目录
        // 2. package.json 在一级子目录（如 extension-name/package.json）
        return (parts.length === 1 && parts[0] === 'package.json') ||
               (parts.length === 2 && parts[1] === 'package.json')
      })

      if (!pkgEntry) {
        return { valid: false, error: 'Missing package.json in zip' }
      }

      // 读取 package.json
      const pkgContent = zip.readAsText(pkgEntry)
      const pkg = JSON.parse(pkgContent) as ExtensionPackage

      // 验证必要字段
      if (!pkg.id || !pkg.name || !pkg.main) {
        return { valid: false, error: 'Invalid package.json: missing id, name, or main field' }
      }

      return { valid: true, pkg }
    } catch (error) {
      return { valid: false, error: `Failed to validate zip: ${error}` }
    }
  }

  /**
   * 安装本地 zip 插件
   */
  async installFromZip(zipPath: string): Promise<{ success: boolean; error?: string; extensionName?: string }> {
    // 1. 验证 zip
    const validation = this.validateExtensionZip(zipPath)
    if (!validation.valid || !validation.pkg) {
      return { success: false, error: validation.error }
    }

    const pkg = validation.pkg
    const extensionName = pkg.name
    const targetDir = path.join(this.extensionsDir, extensionName)

    try {
      // 2. 检查是否已安装
      if (fs.existsSync(targetDir)) {
        // 读取现有版本
        const existingPkgPath = path.join(targetDir, 'package.json')
        if (fs.existsSync(existingPkgPath)) {
          const existingPkg = JSON.parse(fs.readFileSync(existingPkgPath, 'utf-8'))
          if (existingPkg.version === pkg.version) {
            return { success: false, error: `Extension ${extensionName} v${pkg.version} is already installed` }
          }
        }

        // 删除旧版本
        fs.rmSync(targetDir, { recursive: true, force: true })
      }

      // 3. 解压到目标目录
      const zip = new AdmZip(zipPath)
      const entries = zip.getEntries()

      // 检测是否有顶层文件夹
      const hasTopLevelFolder = entries.every(entry => {
        const parts = entry.entryName.split('/')
        return parts.length > 1 && parts[0] === entries[0].entryName.split('/')[0]
      })

      // 创建目标目录
      fs.mkdirSync(targetDir, { recursive: true })

      // 解压文件
      for (const entry of entries) {
        if (entry.isDirectory) continue

        let relativePath = entry.entryName

        // 如果有顶层文件夹，去掉它
        if (hasTopLevelFolder) {
          const parts = relativePath.split('/')
          parts.shift() // 移除顶层文件夹
          relativePath = parts.join('/')
        }

        if (!relativePath) continue

        const targetPath = path.join(targetDir, relativePath)
        const targetDirPath = path.dirname(targetPath)

        // 确保目标目录存在
        if (!fs.existsSync(targetDirPath)) {
          fs.mkdirSync(targetDirPath, { recursive: true })
        }

        // 写入文件
        fs.writeFileSync(targetPath, entry.getData())
      }

      return { success: true, extensionName }
    } catch (error) {
      return { success: false, error: `Failed to install extension: ${error}` }
    }
  }

  /**
   * 卸载插件
   */
  async uninstallExtension(extensionName: string): Promise<{ success: boolean; error?: string }> {
    const targetDir = path.join(this.extensionsDir, extensionName)

    if (!fs.existsSync(targetDir)) {
      return { success: false, error: `Extension ${extensionName} is not installed` }
    }

    try {
      fs.rmSync(targetDir, { recursive: true, force: true })
      return { success: true }
    } catch (error) {
      return { success: false, error: `Failed to uninstall extension: ${error}` }
    }
  }

  /**
   * 获取已安装的插件列表
   */
  getInstalledExtensions(): Array<{ name: string; pkg: ExtensionPackage }> {
    const extensions: Array<{ name: string; pkg: ExtensionPackage }> = []

    if (!fs.existsSync(this.extensionsDir)) {
      return extensions
    }

    const dirs = fs.readdirSync(this.extensionsDir)

    for (const dir of dirs) {
      const extensionDir = path.join(this.extensionsDir, dir)
      const pkgPath = path.join(extensionDir, 'package.json')

      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
          extensions.push({ name: dir, pkg })
        } catch (error) {
          console.error(`Failed to read package.json for ${dir}:`, error)
        }
      }
    }

    return extensions
  }
}
