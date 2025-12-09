import Store from 'electron-store'

// 命令配置
export interface CmdConfig {
  disabled?: boolean  // 是否禁用，默认 false（开启）
  shortcut?: string   // 快捷键
}

export interface ExtensionConfig {
  disabled?: boolean  // 是否禁用，默认 false（开启）
  commands?: Record<string, CmdConfig>  // 命令配置，key 是 cmd.id
}

// 配置类型定义
export interface AppConfig {
  theme: string // 主题
  globalShortcut: string // app快捷键
  extensions?: Record<string, ExtensionConfig> // 扩展配置 
  userExts?: string[]  // 本地插件（用户手动安装，非 store 安装）
}

// 默认配置
const defaultConfig: AppConfig = {
  theme: 'light',
  globalShortcut: 'Shift+Space',
  extensions: {},
  userExts: []
}

// 创建配置存储实例
const store = new Store<AppConfig>({
  name: 'config',
  defaults: defaultConfig,
})

/**
 * 配置管理器
 */
export class ConfigManager {
  private store: Store<AppConfig>

  constructor() {
    this.store = store
  }

  /**
   * 获取配置项
   */
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.store.get(key)
  }

  /**
   * 设置配置项
   */
  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.store.set(key, value)
  }

  /**
   * 获取所有配置
   */
  getAll(): AppConfig {
    return this.store.store
  }

  /**
   * 设置多个配置项
   */
  setAll(config: Partial<AppConfig>): void {
    Object.entries(config).forEach(([key, value]) => {
      this.store.set(key as keyof AppConfig, value)
    })
  }

  /**
   * 删除配置项
   */
  delete(key: keyof AppConfig): void {
    this.store.delete(key)
  }

  /**
   * 重置为默认配置
   */
  reset(): void {
    this.store.clear()
  }

  /**
   * 检查配置项是否存在
   */
  has(key: keyof AppConfig): boolean {
    return this.store.has(key)
  }

  /**
   * 获取存储路径
   */
  getPath(): string {
    return this.store.path
  }

  /**
   * 获取命令配置
   */
  getCmdConfig(cmdId: string): CmdConfig {
    const [extName, cmdName] = cmdId.split('#')
    return this.store.get(`extensions.${extName}.commands.${cmdName}`) || {}
  }

  /**
   * 设置命令配置
   */
  setCmdConfig(cmdId: string, config: CmdConfig): void {
    const [extName, cmdName] = cmdId.split('#')
    this.store.set(`extensions.${extName}.commands.${cmdName}`, config)
  }

  /**
   * 获取所有命令配置
   */
  getAllCmdConfigs(): Record<string, CmdConfig> {
    return this.store.get('cmds') || {}
  }

  /**
   * 删除命令配置
   */
  deleteCmdConfig(cmdId: string): void {
    const [extName, cmdName] = cmdId.split('#')
    this.store.delete(`extensions.${extName}.commands.${cmdName}`)
  }

  getExtesionConfig(extName: string): ExtensionConfig {
    return this.store.get(`extensions.${extName}`) || {}
  }
}

// 导出单例实例
export const configManager = new ConfigManager()
