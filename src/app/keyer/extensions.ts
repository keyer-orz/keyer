/**
 * 渲染进程扩展管理模块
 */

import { _IRenderAPI } from '@/shared/render-api'

export const extensionsImpl: _IRenderAPI['extensions'] = {
  scan: async () => {
    return scan()
  },
  create: async (options) => {
    return createExtension(options)
  },
  validateExtension: async (extPath) => {
    return validateExtension(extPath)
  },
  installUserExtension: async (extPath) => {
    return installUserExtension(extPath)
  },
  uninstallUserExtension: async (name) => {
    return uninstallUserExtension(name)
  },
  downloadAndInstall: async (url, name, options = {}) => {
    return downloadAndInstall(url, name, options)
  },
}

////////////////////////////////////////////////////////////////////////////////

import type { 
  ExtensionPackageInfo, 
  ExtensionCreateOptions, 
  ExtensionValidateResult,
} from '@/shared/render-api'
import { DownloadOptions } from 'keyerext'
import { Keyer } from '@/app/keyer'
import path from 'path'
import * as fs from 'fs';
import { store } from '@/main/shared'

let electron: any
try {
  electron = window.require('electron')
} catch (e) {
  console.warn('net module is only available in renderer process')
}

const net = electron ? (electron.net || electron.remote?.net) : null

/**
 * 扫描所有扩展
 */
async function scan(): Promise<ExtensionPackageInfo[]> {
  const extensions: ExtensionPackageInfo[] = []
  
  // 扫描 userData/extensions
  {
    const exts = await scanExtensions(Keyer.path.userData('extensions'))
    exts.map(e=> e.type = 'store')
    extensions.push(...exts)
  }
  
  // 扫描开发目录 extensions
  {
    const appRoot = process.env.APP_ROOT || ""
    if (appRoot) {
      const exts = await scanExtensions(path.join(appRoot, 'extensions'))
      exts.map(e=> e.type = 'dev')
      extensions.push(...exts)
    }
  }
  
  // 扫描用户自定义路径
  {
    const userExts = (store.get('userExts') as string[]) || []
    for (const extPath of userExts) {
      try {
        const userExtInfo = readExtensionPackage(extPath)
        if (userExtInfo) {
          userExtInfo.type = 'local'
          extensions.push(userExtInfo)
        }
      } catch (error) {
        console.error(`❌ Failed to load user extension "${extPath}":`, error)
      }
    }
  }
  
  // 示例扩展
  {
    const appRoot = process.env.APP_ROOT || ""
    const exampleExt = readExtensionPackage(path.join(appRoot, 'example'))
    if (exampleExt) {
      exampleExt.type = 'dev'
      extensions.push(exampleExt)
    }
  }
  
  return extensions
}

/**
 * 扫描指定目录下的扩展
 */
async function scanExtensions(dir: string): Promise<ExtensionPackageInfo[]> {
  const extensions: ExtensionPackageInfo[] = []
  
  try {
    if (!fs.existsSync(dir)) {
      return []
    }

    const folders = fs.readdirSync(dir)
      .filter((dirent: string) => {
        try {
          return fs.statSync(path.join(dir, dirent)).isDirectory()
        } catch (err) {
          return false
        }
      })

    for (const folderName of folders) {
      try {
        const extInfo = readExtensionPackage(path.join(dir, folderName))
        if (extInfo) {
          extensions.push(extInfo)
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
 * 读取扩展的 package.json
 */
function readExtensionPackage(extDir: string): ExtensionPackageInfo | null {
  const packagePath = path.join(extDir, 'package.json')

  if (!fs.existsSync(packagePath)) {
    return null
  }

  try {
    const packageContent = fs.readFileSync(packagePath, 'utf-8')
    const pkg = JSON.parse(packageContent)

    if (!pkg.name || !pkg.main) {
      return null
    }

    const mainPath = path.join(extDir, pkg.main)
    if (!fs.existsSync(mainPath)) {
      return null
    }

    return {
      name: pkg.name,
      title: pkg.title || pkg.name,
      desc: pkg.desc,
      icon: pkg.icon,
      version: pkg.version,
      main: pkg.main,
      dir: extDir,
      commands: pkg.commands
    }
  } catch (error) {
    console.error(`❌ Failed to read package.json:`, error)
    return null
  }
}

/**
 * 创建新扩展
 */
async function createExtension(options: ExtensionCreateOptions): Promise<void> {
  const { name, title, desc, targetDir } = options

  const extDir = path.join(targetDir, name)
  if (fs.existsSync(extDir)) {
    throw new Error(`Extension directory already exists: ${extDir}`)
  }

  const appRoot = process.env.APP_ROOT || Keyer.path.appPath()
  const templateDir = process.env.APP_ROOT
    ? path.join(appRoot, 'templates', 'extension')
    : path.join(Keyer.path.appPath(), '..', 'templates', 'extension')

  if (!fs.existsSync(templateDir)) {
    throw new Error(`Template directory not found: ${templateDir}`)
  }

  fs.mkdirSync(extDir, { recursive: true })

  copyTemplateFiles(templateDir, extDir, { name, title, desc })

  console.log(`✨ Extension "${name}" created successfully at ${extDir}`)
}

/**
 * 复制模板文件
 */
function copyTemplateFiles(sourceDir: string, targetDir: string, replacements: Record<string, string>) {
  const files = fs.readdirSync(sourceDir, { withFileTypes: true })

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file.name)
    const targetPath = path.join(targetDir, file.name)

    if (file.isDirectory()) {
      fs.mkdirSync(targetPath, { recursive: true })
      copyTemplateFiles(sourcePath, targetPath, replacements)
    } else {
      let content = fs.readFileSync(sourcePath, 'utf-8')

      for (const [key, value] of Object.entries(replacements)) {
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g')
        content = content.replace(regex, value)
      }

      fs.writeFileSync(targetPath, content)
    }
  }
}

/**
 * 验证扩展
 */
function validateExtension(extPath: string): ExtensionValidateResult {
  if (!fs || !path) {
    return { valid: false, error: 'Extension module is only available in renderer process' }
  }

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

    const info = readExtensionPackage(extPath)
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
 * 安装用户扩展
 */
function installUserExtension(extPath: string): boolean {
  try {
    const validation = validateExtension(extPath)
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
 * 卸载用户扩展
 */
function uninstallUserExtension(name: string): boolean {
  try {
    const userDataDir = Keyer.path.userData()
    const extDir = path.join(userDataDir, 'extensions', name)

    if (fs.existsSync(extDir)) {
      fs.rmSync(extDir, { recursive: true, force: true })
      console.log(`✅ Extension directory deleted: ${extDir}`)
    }

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
async function downloadAndInstall(
  url: string,
  name: string,
  options: DownloadOptions = {}
): Promise<boolean> {
  const { onProgress } = options

  try {
    const userDataDir = Keyer.path.userData()
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

    // 使用 Electron net 模块下载
    await new Promise<void>((resolve, reject) => {
      const request = net.request({
        url: url,
        method: 'GET',
        redirect: 'follow'
      })

      request.on('response', (response: any) => {
        console.log(`📊 Response status: ${response.statusCode}`)

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`))
          return
        }

        const fileStream = fs.createWriteStream(tarPath)
        let downloadedBytes = 0
        const totalBytes = parseInt(response.headers['content-length'] || '0', 10)

        response.on('data', (chunk: Buffer) => {
          downloadedBytes += chunk.length
          fileStream.write(chunk)

          if (totalBytes > 0) {
            const progress = (downloadedBytes / totalBytes) * 100
            console.log(`⬇️  Downloading: ${progress.toFixed(1)}% (${downloadedBytes}/${totalBytes} bytes)`)

            // 触发进度回调
            if (onProgress) {
              onProgress(downloadedBytes, totalBytes, Math.round(progress * 100) / 100)
            }
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

    // await tar.extract({
    //   file: tarPath,
    //   cwd: tempDir
    // })

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

    // 验证安装 - 检查 package.json
    const packagePath = path.join(extDir, 'package.json')
    if (!fs.existsSync(packagePath)) {
      throw new Error('Invalid extension: missing package.json')
    }

    const packageContent = fs.readFileSync(packagePath, 'utf-8')
    const pkg = JSON.parse(packageContent)

    if (!pkg.name || !pkg.main) {
      throw new Error('Invalid extension: missing required fields (name or main)')
    }

    const mainPath = path.join(extDir, pkg.main)
    if (!fs.existsSync(mainPath)) {
      throw new Error(`Invalid extension: main file not found (${pkg.main})`)
    }

    console.log(`✅ Extension installed successfully: ${name}`)
    return true
  } catch (error) {
    console.error(`❌ Failed to download and install extension "${name}":`, error)
    throw error
  }
}
