import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

interface AppConfig {
  theme: 'dark' | 'light'
  globalShortcut: string
  extensions: {
    [key: string]: {
      enabled: boolean
      shortcuts: {
        [commandId: string]: string
      }
    }
  }
  scripts: {
    [key: string]: {
      enabled: boolean
      shortcut: string
    }
  }
}

const defaultConfig: AppConfig = {
  theme: 'dark',
  globalShortcut: 'Shift+Space',
  extensions: {},
  scripts: {}
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
  getGlobalShortcut(): string {
    return this.config.globalShortcut
  }

  // 设置全局快捷键
  setGlobalShortcut(shortcut: string): void {
    this.config.globalShortcut = shortcut
    this.saveConfig()
  }

  // 获取扩展配置
  getExtensionConfig(extensionId: string) {
    return this.config.extensions[extensionId] || { enabled: true, shortcuts: {} }
  }

  // 设置扩展是否启用
  setExtensionEnabled(extensionId: string, enabled: boolean): void {
    if (!this.config.extensions[extensionId]) {
      this.config.extensions[extensionId] = { enabled, shortcuts: {} }
    } else {
      this.config.extensions[extensionId].enabled = enabled
    }
    this.saveConfig()
  }

  // 设置扩展命令快捷键
  setExtensionShortcut(extensionId: string, commandId: string, shortcut: string): void {
    if (!this.config.extensions[extensionId]) {
      this.config.extensions[extensionId] = { enabled: true, shortcuts: {} }
    }
    this.config.extensions[extensionId].shortcuts[commandId] = shortcut
    this.saveConfig()
  }

  // 获取脚本配置
  getScriptConfig(scriptId: string) {
    return this.config.scripts[scriptId] || { enabled: true, shortcut: '' }
  }

  // 设置脚本是否启用
  setScriptEnabled(scriptId: string, enabled: boolean): void {
    if (!this.config.scripts[scriptId]) {
      this.config.scripts[scriptId] = { enabled, shortcut: '' }
    } else {
      this.config.scripts[scriptId].enabled = enabled
    }
    this.saveConfig()
  }

  // 设置脚本快捷键
  setScriptShortcut(scriptId: string, shortcut: string): void {
    if (!this.config.scripts[scriptId]) {
      this.config.scripts[scriptId] = { enabled: true, shortcut }
    } else {
      this.config.scripts[scriptId].shortcut = shortcut
    }
    this.saveConfig()
  }
}
