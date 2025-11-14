import Store from 'electron-store'

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

// 为 electron-store 定义 schema
const schema: Record<keyof AppConfig, any> = {
  theme: {
    type: 'string',
    enum: ['dark', 'light'],
    default: 'dark'
  },
  hotkey: {
    type: 'string',
    default: 'Shift+Space'
  },
  scripts: {
    type: 'array',
    items: { type: 'string' },
    default: []
  },
  extensions: {
    type: 'array',
    items: { type: 'string' },
    default: []
  },
  disabled: {
    type: 'array',
    items: { type: 'string' },
    default: []
  },
  hotkeys: {
    type: 'object',
    additionalProperties: { type: 'string' },
    default: {}
  }
}

export class ConfigManager {
  private static instance: ConfigManager | null = null
  private store: Store<AppConfig>

  private constructor() {
    this.store = new Store<AppConfig>({
      name: 'config',
      defaults: defaultConfig,
      schema: schema as any,
      clearInvalidConfig: true,
    })

    console.log('Config loaded from:', this.store.path)
  }

  // 获取单例实例
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  // 检查是否已初始化
  static isReady(): boolean {
    return ConfigManager.instance !== null
  }

  // 获取完整配置
  getConfig(): AppConfig {
    return this.store.store
  }

  // 更新配置
  updateConfig(updates: Partial<AppConfig>): void {
    // 使用 electron-store 的批量更新
    Object.entries(updates).forEach(([key, value]) => {
      this.store.set(key as keyof AppConfig, value)
    })
  }

  // 获取主题
  getTheme(): 'dark' | 'light' {
    return this.store.get('theme')
  }

  // 设置主题
  setTheme(theme: 'dark' | 'light'): void {
    this.store.set('theme', theme)
  }

  // 获取全局快捷键
  getGlobalHotkey(): string {
    return this.store.get('hotkey')
  }

  // 设置全局快捷键
  setGlobalHotkey(hotkey: string): void {
    this.store.set('hotkey', hotkey)
  }

  // 获取脚本路径列表
  getScriptPaths(): string[] {
    return this.store.get('scripts', [])
  }

  // 添加脚本路径
  addScriptPath(path: string): void {
    const scripts = this.getScriptPaths()
    if (!scripts.includes(path)) {
      scripts.push(path)
      this.store.set('scripts', scripts)
    }
  }

  // 移除脚本路径
  removeScriptPath(path: string): void {
    const scripts = this.getScriptPaths()
    this.store.set('scripts', scripts.filter(p => p !== path))
  }

  // 获取扩展路径列表
  getExtensionPaths(): string[] {
    return this.store.get('extensions', [])
  }

  // 添加扩展路径
  addExtensionPath(path: string): void {
    const extensions = this.getExtensionPaths()
    if (!extensions.includes(path)) {
      extensions.push(path)
      this.store.set('extensions', extensions)
    }
  }

  // 移除扩展路径
  removeExtensionPath(path: string): void {
    const extensions = this.getExtensionPaths()
    this.store.set('extensions', extensions.filter(p => p !== path))
  }

  // 检查是否禁用
  isDisabled(ucid: string): boolean {
    const disabled = this.store.get('disabled', [])
    return disabled.includes(ucid) ||
           disabled.some(d => ucid.startsWith(d + '#'))
  }

  // 添加到禁用列表
  addToDisabled(ucid: string): void {
    const disabled = this.store.get('disabled', [])
    if (!disabled.includes(ucid)) {
      disabled.push(ucid)
      this.store.set('disabled', disabled)
    }
  }

  // 从禁用列表移除
  removeFromDisabled(ucid: string): void {
    const disabled = this.store.get('disabled', [])
    this.store.set('disabled', disabled.filter(d => d !== ucid))
  }

  // 获取命令的快捷键
  getHotkey(ucid: string): string | undefined {
    const hotkeys = this.store.get('hotkeys', {})
    return hotkeys[ucid]
  }

  // 设置命令的快捷键
  setHotkey(ucid: string, hotkey: string): void {
    const hotkeys = this.store.get('hotkeys', {})
    hotkeys[ucid] = hotkey
    this.store.set('hotkeys', hotkeys)
  }

  // 移除命令的快捷键
  removeHotkey(ucid: string): void {
    const hotkeys = this.store.get('hotkeys', {})
    delete hotkeys[ucid]
    this.store.set('hotkeys', hotkeys)
  }

  // 获取所有快捷键
  getAllHotkeys(): { [ucid: string]: string } {
    return { ...this.store.get('hotkeys', {}) }
  }

  // 监听配置变化（仅限 hotkeys 字段）
  onHotkeysChange(callback: (hotkeys: { [ucid: string]: string }) => void): () => void {
    const listener = (newValue: any, oldValue: any) => {
      if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
        callback(newValue || {})
      }
    }

    // electron-store 支持监听特定字段的变化
    this.store.onDidChange('hotkeys', listener)

    // 返回取消监听的函数
    return () => {
      // electron-store 没有直接的 off 方法，需要通过其他方式处理
      // 这里我们返回一个空函数，因为主进程通常不需要取消监听
    }
  }
}
