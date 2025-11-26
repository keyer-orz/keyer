import Store from 'electron-store'

// 配置类型定义
export interface AppConfig {
  theme: string
  globalShortcut: string
}

// 默认配置
const defaultConfig: AppConfig = {
  theme: 'light',
  globalShortcut: 'Shift+Space',
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
}

// 导出单例实例
export const configManager = new ConfigManager()
