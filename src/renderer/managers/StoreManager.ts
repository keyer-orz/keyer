/**
 * Store Manager
 * 管理插件商店，包括获取、搜索和安装插件
 */
const { ipcRenderer } = window.require('electron')

// 插件商店数据类型
export interface StorePlugin {
  icon?: string
  name: string
  title: string
  desc?: string
  version?: string
  repo: string
}

export interface StoreData {
  [pluginName: string]: StorePlugin
}

export class StoreManager {
  private storeData: StoreData = {}
  private loading = false
  private error: string | null = null
  private storeUrl = 'https://keyer-orz.github.io/store/app.json'

  async initialize() {
    console.log('Initializing StoreManager...')
    await this.fetchStoreData()
  }

  // 获取商店数据
  async fetchStoreData(): Promise<void> {
    this.loading = true
    this.error = null

    try {
      const response = await fetch(this.storeUrl)

      if (!response.ok) {
        throw new Error(`Failed to fetch store data: ${response.statusText}`)
      }

      this.storeData = await response.json() as StoreData
      console.log(`Store loaded: ${Object.keys(this.storeData).length} plugins available`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.error = message
      console.error('Failed to load store data:', message)
    } finally {
      this.loading = false
    }
  }

  // 获取所有插件
  getAllPlugins(): StorePlugin[] {
    return Object.values(this.storeData)
  }

  // 搜索插件
  searchPlugins(query: string): StorePlugin[] {
    if (!query.trim()) {
      return this.getAllPlugins()
    }

    const lowerQuery = query.toLowerCase()
    return this.getAllPlugins().filter((plugin) => {
      return (
        plugin.name.toLowerCase().includes(lowerQuery) ||
        plugin.title.toLowerCase().includes(lowerQuery) ||
        plugin.desc?.toLowerCase().includes(lowerQuery)
      )
    })
  }

  // 获取单个插件
  getPlugin(name: string): StorePlugin | undefined {
    return this.storeData[name]
  }

  // 安装插件
  async installPlugin(plugin: StorePlugin): Promise<void> {
    try {
      await ipcRenderer.invoke('store:install-plugin', plugin)
      console.log(`Plugin ${plugin.name} installation started`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to install plugin: ${message}`)
    }
  }

  // 获取加载状态
  isLoading(): boolean {
    return this.loading
  }

  // 获取错误信息
  getError(): string | null {
    return this.error
  }

  // 刷新商店数据
  async refresh(): Promise<void> {
    await this.fetchStoreData()
  }
}
