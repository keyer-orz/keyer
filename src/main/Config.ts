import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

// 文档规范的配置结构
interface AppConfig {
  theme: 'dark' | 'light'
  hotkey: string  // 全局快捷键（文档中为 hotkey）
  scripts: string[]  // 脚本路径列表
  extensions: string[]  // 扩展路径列表
  disabled: string[]  // 禁用列表（ucid 格式）
  hotkeys: {
    [ucid: string]: string  // 各个命令的快捷键
  }
}

const defaultConfig: AppConfig = {
  theme: 'dark',
  hotkey: 'Shift+Space',
  scripts: [],
  extensions: [],
  disabled: [],
  hotkeys: {}
}

export class ConfigManager {
  private configPath: string
  private config: AppConfig

  constructor() {
    // 配置文件存储在用户数据目录
    const userDataPath = app.getPath('userData')
    this.configPath = path.join(userDataPath, 'config.json')
    this.config = this.loadConfig()
  }

  // 加载配置
  private loadConfig(): AppConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8')
        const config = JSON.parse(data)
        console.log('Loaded config from:', this.configPath)
        return { ...defaultConfig, ...config }
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    }
    console.log('Using default config')
    return defaultConfig
  }

  // 保存配置
  private saveConfig(): void {
    try {
      const dir = path.dirname(this.configPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2))
      console.log('Config saved to:', this.configPath)
    } catch (error) {
      console.error('Failed to save config:', error)
    }
  }

  // 获取完整配置
  getConfig(): AppConfig {
    return this.config
  }

  // 更新配置
  updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates }
    this.saveConfig()
  }

  // 获取主题
  getTheme(): 'dark' | 'light' {
    return this.config.theme
  }

  // 设置主题
  setTheme(theme: 'dark' | 'light'): void {
    this.config.theme = theme
    this.saveConfig()
  }

  // 获取全局快捷键
  getGlobalHotkey(): string {
    return this.config.hotkey
  }

  // 设置全局快捷键
  setGlobalHotkey(hotkey: string): void {
    this.config.hotkey = hotkey
    this.saveConfig()
  }

  // 获取脚本路径列表
  getScriptPaths(): string[] {
    return this.config.scripts || []
  }

  // 添加脚本路径
  addScriptPath(path: string): void {
    if (!this.config.scripts.includes(path)) {
      this.config.scripts.push(path)
      this.saveConfig()
    }
  }

  // 移除脚本路径
  removeScriptPath(path: string): void {
    this.config.scripts = this.config.scripts.filter(p => p !== path)
    this.saveConfig()
  }

  // 获取扩展路径列表
  getExtensionPaths(): string[] {
    return this.config.extensions || []
  }

  // 添加扩展路径
  addExtensionPath(path: string): void {
    if (!this.config.extensions.includes(path)) {
      this.config.extensions.push(path)
      this.saveConfig()
    }
  }

  // 移除扩展路径
  removeExtensionPath(path: string): void {
    this.config.extensions = this.config.extensions.filter(p => p !== path)
    this.saveConfig()
  }

  // 检查是否禁用
  isDisabled(ucid: string): boolean {
    return this.config.disabled.includes(ucid) ||
           this.config.disabled.some(d => ucid.startsWith(d + '#'))
  }

  // 添加到禁用列表
  addToDisabled(ucid: string): void {
    if (!this.config.disabled.includes(ucid)) {
      this.config.disabled.push(ucid)
      this.saveConfig()
    }
  }

  // 从禁用列表移除
  removeFromDisabled(ucid: string): void {
    this.config.disabled = this.config.disabled.filter(d => d !== ucid)
    this.saveConfig()
  }

  // 获取命令的快捷键
  getHotkey(ucid: string): string | undefined {
    return this.config.hotkeys[ucid]
  }

  // 设置命令的快捷键
  setHotkey(ucid: string, hotkey: string): void {
    this.config.hotkeys[ucid] = hotkey
    this.saveConfig()
  }

  // 移除命令的快捷键
  removeHotkey(ucid: string): void {
    delete this.config.hotkeys[ucid]
    this.saveConfig()
  }

  // 获取所有快捷键
  getAllHotkeys(): { [ucid: string]: string } {
    return { ...this.config.hotkeys }
  }
}
