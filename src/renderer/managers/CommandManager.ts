import { ICommand, ExtensionResult } from '../types'
import { ScriptManager } from './ScriptManager'
import { ExtensionManager } from './ExtensionManager'
import { MainExtensionInstance } from '@/main'
import { SettingsExtensionInstance } from '@/setting'
import { StoreExtensionInstance } from '@/store'

interface CommandManagerConfig {
  devExtensionsDir?: string  // 开发环境的 extensions 目录
  devScriptsDir?: string     // 开发环境的 scripts 目录
  configExtensions?: string[]
  configScripts?: string[]
  sandboxDir?: string
}

export class CommandManager {
  private static instance: CommandManager | null = null

  private scriptManager: ScriptManager
  private extensionManager: ExtensionManager

  constructor(config: CommandManagerConfig) {
    console.log('CommandManager config:', config)

    // 初始化 ExtensionManager
    this.extensionManager = new ExtensionManager({
      devDir: config.devExtensionsDir,
      mineDirs: config.configExtensions || [],
      sandboxDir: config.sandboxDir
    })

    // 初始化 ScriptManager
    this.scriptManager = new ScriptManager({
      devDir: config.devScriptsDir,
      mineDirs: config.configScripts || [],
      sandboxDir: config.sandboxDir
    })
  }

  // 检查是否已初始化
  static isReady(): boolean {
    return CommandManager.instance !== null
  }

  // 获取单例实例
  static getInstance(): CommandManager {
    if (!CommandManager.instance) {
      throw new Error('CommandManager not initialized. Call CommandManager.createInstance first.')
    }
    return CommandManager.instance
  }

  // 安全获取单例实例（返回 null 而不是抛出错误）
  static getInstanceSafe(): CommandManager | null {
    return CommandManager.instance
  }

  // 初始化单例（异步工厂方法）
  static async createInstance(config: CommandManagerConfig): Promise<CommandManager> {
    if (CommandManager.instance) {
      return CommandManager.instance
    }

    console.log('Initializing CommandManager')
    console.log('Dev extensions dir:', config.devExtensionsDir)
    console.log('Dev scripts dir:', config.devScriptsDir)
    console.log('Config extensions:', config.configExtensions)
    console.log('Config scripts:', config.configScripts)

    CommandManager.instance = new CommandManager(config)
    await CommandManager.instance.initialize()

    return CommandManager.instance
  }

  // 重置单例（用于测试）
  static resetInstance(): void {
    CommandManager.instance = null
  }

  /**
   * 从渲染进程初始化 CommandManager
   * 自动从 IPC 获取配置并创建实例
   */
  static async initializeFromRenderer(): Promise<CommandManager> {
    if (CommandManager.instance) {
      return CommandManager.instance
    }

    try {
      const { ipcRenderer } = window.require('electron')

      // 动态导入 ConfigManager 避免循环依赖
      const { ConfigManager } = await import('../../shared/Config')
      const configManager = ConfigManager.getInstance()
      const config = configManager.getConfig()

      // 从主进程获取路径配置
      const [sandboxDir, devPaths] = await Promise.all([
        ipcRenderer.invoke('get-sandbox-dir'),
        ipcRenderer.invoke('get-dev-paths')
      ])

      console.log('Initializing CommandManager from renderer')
      console.log('Config:', config)
      console.log('Sandbox dir:', sandboxDir)
      console.log('Dev paths:', devPaths)

      // 创建实例
      return await CommandManager.createInstance({
        devExtensionsDir: devPaths?.extensionsDir || undefined,
        devScriptsDir: devPaths?.scriptsDir || undefined,
        configExtensions: config?.extensions || [],
        configScripts: config?.scripts || [],
        sandboxDir: sandboxDir
      })
    } catch (error) {
      console.error('Failed to initialize CommandManager from renderer:', error)
      throw error
    }
  }

  // 初始化：扫描所有脚本和扩展
  async initialize(): Promise<void> {
    // 注册系统扩展
    this.registerSystemExtensions()

    await this.scriptManager.scanScripts()
    await this.extensionManager.loadExtensions()
  }

  // 注册系统扩展
  private registerSystemExtensions(): void {
    this.extensionManager.registerSystemExtension('main', MainExtensionInstance)
    this.extensionManager.registerSystemExtension('settings', SettingsExtensionInstance)
    this.extensionManager.registerSystemExtension('store', StoreExtensionInstance)

    console.log('System extensions registered')
  }

  // 获取所有可用的命令
  getAllCommands(): ICommand[] {
    return [
      ...this.scriptManager.getCommands(),
      ...this.extensionManager.getCommands(),
    ]
  }

  // 搜索命令和扩展结果
  async search(input: string): Promise<ICommand[]> {
    // 获取所有可搜索的 commands
    const allCommands: ICommand[] = [
      ...this.extensionManager.getCommands(),
      ...this.scriptManager.getCommands()
    ]

    // 如果输入为空，返回所有 commands
    if (!input || input.trim() === '') {
      return allCommands
    }

    const lowerInput = input.toLowerCase()

    // 进行搜索：在所有 commands 中匹配
    const results = allCommands.filter(command =>
      command.title.toLowerCase().includes(lowerInput) ||
      command.desc.toLowerCase().includes(lowerInput) ||
      command.name.toLowerCase().includes(lowerInput)
    )

    return results
  }

  // 执行命令
  async execute(command: ICommand): Promise<ExtensionResult> {
    // 判断是 script 还是 extension (通过 ucid 判断)
    if (command.ucid.startsWith('@script#')) {
      // 执行 script（脚本执行后默认关闭主面板）
      await this.scriptManager.executeScript(command.ucid)
      return null
    } else {
      // 执行 extension
      return await this.extensionManager.executeAction(command)
    }
  }

  // 获取扩展列表
  getExtensions() {
    return this.extensionManager.getAllExtensions()
  }

  // 获取脚本列表
  getScripts() {
    return this.scriptManager.getAllScripts()
  }

  // 获取预览元素
  async getPreview(input: string): Promise<Array<ExtensionResult>> {
    return await this.extensionManager.getPreviewComponents(input)
  }

  /**
   * 调用扩展的 doBack() 方法
   * @param commandId 命令ID
   * @returns true 表示应该执行默认返回行为，false 表示扩展自己处理了返回
   */
  callDoBack(commandId: string): boolean {
    const extension = this.extensionManager.getExtensionByCommand(commandId)

    if (!extension) {
      // 未找到扩展，执行默认行为
      return true
    }

    // 调用扩展的 doBack 方法（如果存在）
    if (typeof extension.doBack === 'function') {
      return extension.doBack()
    }

    // 扩展未实现 doBack，默认返回 true
    return true
  }
}
