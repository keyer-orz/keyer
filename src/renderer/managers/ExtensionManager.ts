import * as fs from 'fs'
import * as path from 'path'
import { ICommand, IExtension, ExtensionPackage, ExtensionResult } from '../types'
import { ExtensionStorage } from '../utils/ExtensionStorage'

// 扩展来源类型
type ExtensionSource = 'dev' | 'mine' | 'sandbox'

// 扩展信息（包含来源）
interface ExtensionInfo {
  package: ExtensionPackage
  instance: IExtension
  source: ExtensionSource
  path: string
}

export class ExtensionManager {
  private extensions: Map<string, ExtensionInfo> = new Map()  // key: ext.name
  private commands: Map<string, ICommand> = new Map()  // key: ucid
  private systemExtensions: Map<string, ExtensionInfo> = new Map()  // 系统扩展

  private devDir?: string  // 开发环境目录
  private mineDirs: string[] = []  // 本地路径目录列表
  private sandboxDir?: string  // 沙箱目录

  constructor(config: {
    devDir?: string
    mineDirs?: string[]
    sandboxDir?: string
  }) {
    this.devDir = config.devDir
    this.mineDirs = Array.isArray(config.mineDirs) ? config.mineDirs : []
    this.sandboxDir = config.sandboxDir
    console.log('ExtensionManager initialized:', { devDir: this.devDir, mineDirs: this.mineDirs, sandboxDir: this.sandboxDir })
  }

  /**
   * 注册系统扩展
   * 系统扩展具有最高优先级，不会被其他扩展覆盖
   */
  registerSystemExtension(name: string, instance: IExtension): void {
    const extInfo: ExtensionInfo = {
      package: {
        name,
        title: name,
        main: '' // 系统扩展不需要 main 路径
      },
      instance,
      source: 'dev', // 系统扩展标记为 dev
      path: ''
    }

    this.systemExtensions.set(name, extInfo)
    console.log(`System extension registered: ${name}`)
  }

  // 扫描并加载所有 extension
  // 按照优先级：开发环境 > 本地路径 > 沙箱
  async loadExtensions(): Promise<void> {
    // 先收集所有扩展（按优先级从低到高）
    const extensionMap = new Map<string, { path: string; source: ExtensionSource }>()

    // 1. 沙箱（最低优先级）
    if (this.sandboxDir && fs.existsSync(this.sandboxDir)) {
      const sandboxExts = await this.scanDirectory(this.sandboxDir)
      for (const ext of sandboxExts) {
        extensionMap.set(ext.name, { path: ext.path, source: 'sandbox' })
      }
    }

    // 2. 本地路径（中等优先级）
    for (const mineDir of this.mineDirs) {
      if (fs.existsSync(mineDir)) {
        const mineExts = await this.scanDirectory(mineDir)
        for (const ext of mineExts) {
          extensionMap.set(ext.name, { path: ext.path, source: 'mine' })
        }
      }
    }

    // 3. 开发环境（最高优先级）
    if (this.devDir && fs.existsSync(this.devDir)) {
      const devExts = await this.scanDirectory(this.devDir)
      for (const ext of devExts) {
        extensionMap.set(ext.name, { path: ext.path, source: 'dev' })
      }
    }

    // 加载所有扩展
    for (const [, info] of extensionMap) {
      await this.loadExtension(info.path, info.source)
    }

    // 加载系统扩展的命令
    await this.loadSystemExtensionCommands()

    console.log(`Loaded ${this.extensions.size} extensions + ${this.systemExtensions.size} system extensions`)
  }

  /**
   * 加载系统扩展的命令
   */
  private async loadSystemExtensionCommands(): Promise<void> {
    for (const [name, extInfo] of this.systemExtensions) {
      const { instance } = extInfo

      // 调用 onPrepare 获取命令
      const commandDefs = await instance.onPrepare()
      if (commandDefs && Array.isArray(commandDefs)) {
        for (const def of commandDefs) {
          // 系统扩展的 UCID 使用 @system# 前缀
          const ucid = `@system#${def.name}`
          console.log(`Register system command: ${ucid}`)

          const command: ICommand = {
            ucid,
            name: def.name!,
            title: def.title!,
            desc: def.desc!,
            icon: def.icon,
            type: def.type || 'System',
            source: 'dev',
            windowSize: def.windowSize
          }

          this.commands.set(ucid, command)
        }
      }
    }
  }

  // 扫描目录，返回扩展列表
  private async scanDirectory(dir: string): Promise<Array<{ name: string; path: string }>> {
    const result: Array<{ name: string; path: string }> = []

    if (!fs.existsSync(dir)) {
      return result
    }

    const entries = fs.readdirSync(dir)

    for (const entry of entries) {
      const entryPath = path.join(dir, entry)

      // 跳过无效的符号链接或无法访问的文件
      let stat
      try {
        stat = fs.statSync(entryPath)
      } catch (err) {
        // 忽略无法访问的文件（如损坏的符号链接）
        continue
      }

      if (stat.isDirectory()) {
        const pkgPath = path.join(entryPath, 'package.json')
        if (fs.existsSync(pkgPath)) {
          try {
            const pkgContent = fs.readFileSync(pkgPath, 'utf-8')
            const pkg: ExtensionPackage = JSON.parse(pkgContent)
            if (pkg.name) {
              result.push({ name: pkg.name, path: entryPath })
            }
          } catch (error) {
            console.warn(`Failed to parse package.json in ${entryPath}:`, error)
          }
        }
      }
    }

    return result
  }

  // 加载单个 extension
  private async loadExtension(extDir: string, source: ExtensionSource): Promise<void> {
    const packagePath = path.join(extDir, 'package.json')

    if (!fs.existsSync(packagePath)) {
      console.warn(`No package.json found in ${extDir}`)
      return
    }

    try {
      const packageContent = fs.readFileSync(packagePath, 'utf-8')
      const pkg: ExtensionPackage = JSON.parse(packageContent)

      if (!pkg.name || !pkg.main) {
        console.warn(`Invalid package.json in ${extDir}: missing name or main`)
        return
      }

      // 加载扩展的主文件
      const mainPath = path.join(extDir, pkg.main)

      if (!fs.existsSync(mainPath)) {
        console.warn(`Main file not found: ${mainPath}`)
        return
      }

      // 清除 require 缓存
      delete require.cache[require.resolve(mainPath)]
      const extensionModule = require(mainPath)
      const extension: IExtension = extensionModule.default || extensionModule

      // 为扩展创建并注入 Store（使用 name 作为标识）
      extension.store = new ExtensionStorage(pkg.name)

      console.log(`Loading extension (${source}): ${pkg.name} - ${pkg.title}`)

      // 保存扩展信息
      this.extensions.set(pkg.name, {
        package: pkg,
        instance: extension,
        source,
        path: extDir
      })

      // 注册静态命令（来自 package.json）
      if (pkg.commands && Array.isArray(pkg.commands)) {
        for (const command of pkg.commands) {
          // 验证必需字段
          if (!command.name || !command.title || !command.desc) {
            console.warn(`Static command in ${pkg.name} missing required fields:`, command)
            continue
          }

          // 生成 UCID: ext.name#cmd.name
          const ucid = `${pkg.name}#${command.name}`
          console.log(`Register static command: ${ucid}`)

          this.commands.set(ucid, {
            ucid,
            name: command.name,
            title: command.title,
            desc: command.desc,
            icon: command.icon || pkg.icon,  // 命令图标 >> 扩展图标
            type: command.type || 'Command',  // 默认为 Command
            source
          })
        }
      }

      // 调用准备阶段，获取动态 commands
      const commandDefs = await extension.onPrepare()
      if (commandDefs && Array.isArray(commandDefs)) {
        for (const def of commandDefs) {
          // 生成 UCID: ext.name#cmd.name
          const ucid = `${pkg.name}#${def.name}`
          console.log(`Register dynamic command: ${ucid}`)

          const command: ICommand = {
            ucid,
            name: def.name!,
            title: def.title!,
            desc: def.desc!,
            icon: def.icon || pkg.icon,  // 命令图标 >> 扩展图标
            type: def.type || 'Command',
            source
          }

          this.commands.set(ucid, command)
        }

        console.log(`Extension ${pkg.name} registered ${commandDefs.length} dynamic commands`)
      }

      console.log(`Loaded extension: ${pkg.name} (${source})`)
    } catch (error) {
      console.error(`Failed to load extension from ${extDir}:`, error)
    }
  }

  // 获取所有命令
  getCommands(): ICommand[] {
    return Array.from(this.commands.values())
  }

  // 获取所有扩展信息
  getAllExtensions() {
    const result: any[] = []
    for (const [extName, info] of this.extensions) {
      const extCommands = Array.from(this.commands.values()).filter(cmd => cmd.ucid.startsWith(extName + '#'))
      result.push({
        name: info.package.name,
        title: info.package.title,
        desc: info.package.desc,
        icon: info.package.icon,
        version: info.package.version,
        source: info.source,
        path: info.path,
        commands: extCommands
      })
    }
    return result
  }

  // 执行命令
  async executeAction(command: ICommand): Promise<ExtensionResult> {
    console.log('Executing command:', command.ucid)

    // 从 ucid 解析 extName 和 commandName（格式：ext.name#cmd.name 或 @system#cmd.name）
    const parts = command.ucid.split('#')

    if (parts.length !== 2) {
      throw new Error(`Invalid UCID format: ${command.ucid}. Expected format: ext.name#cmd.name`)
    }

    const [extName, commandName] = parts

    // 优先查找系统扩展
    if (extName === '@system') {
      const systemExtInfo = Array.from(this.systemExtensions.values()).find(ext =>
        ext.instance // 找到提供该命令的系统扩展
      )

      if (systemExtInfo) {
        const result = await systemExtInfo.instance.doAction(commandName)
        console.log(`System command ${command.ucid} executed successfully`)
        return result
      }

      throw new Error(`System extension not found for command: ${command.ucid}`)
    }

    // 查找普通扩展
    const extInfo = this.extensions.get(extName)

    if (!extInfo) {
      throw new Error(`Extension ${extName} not found for command: ${command.ucid}`)
    }

    const result = await extInfo.instance.doAction(commandName)
    console.log(`Command ${command.ucid} executed successfully, result:`, result)
    return result
  }

  // 获取预览元素
  async getPreviewComponents(input: string): Promise<Array<ExtensionResult>> {
    const previewElements: Array<ExtensionResult> = []

    // 遍历所有开启了 enabledPreview 的扩展
    for (const [extName, extInfo] of this.extensions) {
      if (extInfo.instance.enabledPreview && extInfo.instance.onPreview) {
        try {
          const element = await extInfo.instance.onPreview(input)
          if (element) {
            previewElements.push(element)
          }
        } catch (error) {
          console.error(`Preview error in extension ${extName}:`, error)
        }
      }
    }

    return previewElements
  }

  /**
   * 获取系统扩展实例（根据 commandId）
   * @param commandId 命令ID，格式：@system#commandName
   * @returns 扩展实例和命令名称，如果不是系统命令则返回 null
   */
  getSystemExtension(commandId: string): { instance: IExtension; commandName: string } | null {
    if (!commandId.startsWith('@system#')) {
      return null
    }

    const parts = commandId.split('#')
    if (parts.length !== 2) {
      return null
    }

    const [, commandName] = parts

    // 查找提供该命令的系统扩展
    for (const [, extInfo] of this.systemExtensions) {
      // 简单返回第一个系统扩展（因为命令名称是唯一的）
      // 实际上可以通过检查 onPrepare 返回的命令来确定
      return {
        instance: extInfo.instance,
        commandName
      }
    }

    return null
  }

  /**
   * 根据 commandId 获取扩展实例
   * @param commandId 命令ID，格式：extName#commandName 或 @system#commandName
   * @returns 扩展实例，如果未找到则返回 null
   */
  getExtensionByCommand(commandId: string): IExtension | null {
    const parts = commandId.split('#')
    if (parts.length !== 2) {
      return null
    }

    const [extName] = parts

    // 1. 检查是否是系统扩展
    if (extName === '@system') {
      // 返回第一个系统扩展实例（系统扩展都共享相同的 doBack 行为）
      for (const [, extInfo] of this.systemExtensions) {
        return extInfo.instance
      }
      return null
    }

    // 2. 查找普通扩展
    const extInfo = this.extensions.get(extName)
    return extInfo ? extInfo.instance : null
  }
}
