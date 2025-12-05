import * as path from 'path'
import * as fs from 'fs'
import { app } from 'electron'
import { ExtensionPackageInfo, ExtensionCreateOptions } from '@/shared/ipc'
import { store } from './shared'
import { _IMainAPI } from '@/shared/main-api'

export const extensionsHandler: _IMainAPI['extensions'] = {
  scan: async () => {
    try {
      const exts = await extensionManager.scanExtensions(process.env.APP_ROOT)
      console.log(`📦 Scanned ${exts.length} extensions (built-in + user)`)
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
  },

  validateExtension: async (extPath) => {
    return extensionManager.validateExtension(extPath)
  },

  installUserExtension: async (extPath) => {
    return extensionManager.installUserExtension(extPath)
  },

  uninstallUserExtension: async (name) => {
    return extensionManager.uninstallUserExtension(name)
  },

  downloadAndInstall: async (url, name) => {
    return extensionManager.downloadAndInstall(url, name)
  },

  getInstalledExtensions: async () => {
    return extensionManager.getInstalledExtensions()
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

    // 如果是开发模式，添加 example 扩展
    if (devDir) {
      const exampleExt = this.readExtensionPackage(devDir, 'example')
      if (exampleExt) {
        extensions.push(exampleExt)
      }
    }

    // 扫描用户安装的扩展
    const userExtPaths = this.getUserExtensions()
    for (const extPath of userExtPaths) {
      try {
        const userExtInfo = this.scanPath(extPath)
        if (userExtInfo) {
          extensions.push(userExtInfo)
          console.log('✅ Loaded user extension:', userExtInfo.name)
        }
      } catch (error) {
        console.error(`❌ Failed to scan user extension at "${extPath}":`, error)
      }
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

  /**
   * 获取用户安装的插件路径列表
   */
  getUserExtensions(): string[] {
    try {
      return (store.get('userExts') as string[]) || []
    } catch (error) {
      console.error('❌ Failed to get user extensions:', error)
      return []
    }
  }

  /**
   * 扫描指定路径的插件
   */
  scanPath(extPath: string): ExtensionPackageInfo | null {
    try {
      const folderName = path.basename(extPath)
      const parentDir = path.dirname(extPath)
      return this.readExtensionPackage(parentDir, folderName)
    } catch (error) {
      console.error(`❌ Failed to scan path "${extPath}":`, error)
      return null
    }
  }

  /**
   * 验证插件目录的合法性
   */
  validateExtension(extPath: string): { valid: boolean; error?: string; info?: ExtensionPackageInfo } {
    try {
      if (!fs.existsSync(extPath)) {
        return { valid: false, error: '目录不存在' }
      }

      const stats = fs.statSync(extPath)
      if (!stats.isDirectory()) {
        return { valid: false, error: '不是有效的目录' }
      }

      const packagePath = path.join(extPath, 'package.json')
      if (!fs.existsSync(packagePath)) {
        return { valid: false, error: '缺少 package.json 文件' }
      }

      const packageContent = fs.readFileSync(packagePath, 'utf-8')
      const pkg = JSON.parse(packageContent)

      if (!pkg.name) {
        return { valid: false, error: 'package.json 缺少 name 字段' }
      }
      if (!pkg.main) {
        return { valid: false, error: 'package.json 缺少 main 字段' }
      }

      const mainPath = path.join(extPath, pkg.main)
      if (!fs.existsSync(mainPath)) {
        return { valid: false, error: `主文件不存在: ${pkg.main}` }
      }

      const info = this.scanPath(extPath)
      if (!info) {
        return { valid: false, error: '无法读取插件信息' }
      }

      return { valid: true, info }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 安装用户插件
   */
  installUserExtension(extPath: string): boolean {
    try {
      const validation = this.validateExtension(extPath)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      const userExts = (store.get('userExts') as string[]) || []

      if (userExts.includes(extPath)) {
        console.log(`⚠️  Extension already installed: ${extPath}`)
        return true
      }

      userExts.push(extPath)
      store.set('userExts', userExts)

      console.log(`✅ Extension installed: ${extPath}`)
      return true
    } catch (error) {
      console.error(`❌ Failed to install extension "${extPath}":`, error)
      return false
    }
  }

  /**
   * 卸载用户插件
   */
  uninstallUserExtension(name: string): boolean {
    try {
      const userDataDir = app.getPath('userData')
      const extDir = path.join(userDataDir, 'extensions', name)

      // 删除扩展目录
      if (fs.existsSync(extDir)) {
        fs.rmSync(extDir, { recursive: true, force: true })
        console.log(`✅ Extension directory deleted: ${extDir}`)
      }

      // 从 userExts 中移除（如果存在）
      const userExts = (store.get('userExts') as string[]) || []
      const filtered = userExts.filter((p: string) => !p.includes(name))
      store.set('userExts', filtered)

      console.log(`✅ Extension uninstalled: ${name}`)
      return true
    } catch (error) {
      console.error(`❌ Failed to uninstall extension "${name}":`, error)
      return false
    }
  }

  /**
   * 从 URL 下载并安装扩展
   */
  async downloadAndInstall(url: string, name: string): Promise<boolean> {
    const { net } = require('electron')
    const { createWriteStream } = require('fs')
    const tar = require('tar')

    try {
      const userDataDir = app.getPath('userData')
      const extensionsDir = path.join(userDataDir, 'extensions')
      const extDir = path.join(extensionsDir, name)
      const tarPath = path.join(extensionsDir, `${name}.tar.gz`)

      // 创建 extensions 目录
      if (!fs.existsSync(extensionsDir)) {
        fs.mkdirSync(extensionsDir, { recursive: true })
      }

      // 如果已存在，先删除
      if (fs.existsSync(extDir)) {
        fs.rmSync(extDir, { recursive: true, force: true })
      }

      console.log(`📥 Downloading extension from: ${url}`)

      // 使用 Electron net 模块下载（支持系统代理，更可靠）
      await new Promise<void>((resolve, reject) => {
        const request = net.request({
          url: url,
          method: 'GET',
          redirect: 'follow' // 自动跟随重定向
        })

        request.on('response', (response: any) => {
          console.log(`📊 Response status: ${response.statusCode}`)
          
          if (response.statusCode !== 200) {
            reject(new Error(`HTTP ${response.statusCode}`))
            return
          }

          const fileStream = createWriteStream(tarPath)
          let downloadedBytes = 0
          const totalBytes = parseInt(response.headers['content-length'] || '0', 10)

          response.on('data', (chunk: Buffer) => {
            downloadedBytes += chunk.length
            fileStream.write(chunk)
            if (totalBytes > 0) {
              const progress = ((downloadedBytes / totalBytes) * 100).toFixed(1)
              console.log(`⬇️  Downloading: ${progress}% (${downloadedBytes}/${totalBytes} bytes)`)
            }
          })

          response.on('end', () => {
            fileStream.end()
            console.log(`✅ Download complete: ${downloadedBytes} bytes`)
            resolve()
          })

          response.on('error', (err: Error) => {
            fileStream.close()
            if (fs.existsSync(tarPath)) {
              fs.unlinkSync(tarPath)
            }
            reject(err)
          })
        })

        request.on('error', (err: Error) => {
          console.error(`❌ Request error:`, err)
          reject(err)
        })

        request.end()
      })

      console.log(`📦 Extracting to: ${extensionsDir}`)

      // 解压文件到临时目录
      const tempDir = path.join(extensionsDir, `${name}_temp`)
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
      }
      fs.mkdirSync(tempDir, { recursive: true })

      await tar.extract({
        file: tarPath,
        cwd: tempDir
      })

      // 删除临时 tar 文件
      fs.unlinkSync(tarPath)

      // 检查解压后的目录结构
      const tempContents = fs.readdirSync(tempDir)
      console.log(`📂 Extracted contents:`, tempContents)

      let sourceDir = tempDir
      
      // 如果解压后只有一个目录，使用该目录
      if (tempContents.length === 1 && fs.statSync(path.join(tempDir, tempContents[0])).isDirectory()) {
        sourceDir = path.join(tempDir, tempContents[0])
        console.log(`📁 Using subdirectory: ${sourceDir}`)
      }

      // 移动到最终位置
      if (fs.existsSync(extDir)) {
        fs.rmSync(extDir, { recursive: true, force: true })
      }
      fs.renameSync(sourceDir, extDir)

      // 清理临时目录
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
      }

      // 验证安装
      const validation = this.validateExtension(extDir)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      console.log(`✅ Extension installed successfully: ${name}`)
      return true
    } catch (error) {
      console.error(`❌ Failed to download and install extension "${name}":`, error)
      return false
    }
  }

  /**
   * 获取已安装的扩展列表
   */
  getInstalledExtensions(): ExtensionPackageInfo[] {
    try {
      const userDataDir = app.getPath('userData')
      const extensionsDir = path.join(userDataDir, 'extensions')

      if (!fs.existsSync(extensionsDir)) {
        return []
      }

      const extensions: ExtensionPackageInfo[] = []
      const folders = fs.readdirSync(extensionsDir)
        .filter((dirent: string) => {
          try {
            return fs.statSync(path.join(extensionsDir, dirent)).isDirectory()
          } catch (err) {
            return false
          }
        })

      for (const folderName of folders) {
        try {
          const extInfo = this.readExtensionPackage(extensionsDir, folderName)
          if (extInfo) {
            extensions.push(extInfo)
          }
        } catch (error) {
          console.error(`❌ Failed to read extension "${folderName}":`, error)
        }
      }

      return extensions
    } catch (error) {
      console.error('❌ Failed to get installed extensions:', error)
      return []
    }
  }
}

export const extensionManager = new ExtensionManager()