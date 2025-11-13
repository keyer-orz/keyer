import * as fs from 'fs'
import * as path from 'path'
import { ICommand, IAction, IExtension, ExtensionPackage } from './types'
import { ExtensionStore } from './ExtensionStore'

export class ExtensionManager {
  private extensions: Map<string, IExtension> = new Map()
  private commands: Map<string, ICommand> = new Map()
  private stores: Map<string, ExtensionStore> = new Map()
  private extensionPackages: Map<string, ExtensionPackage> = new Map() // 存储包配置
  private extensionsDir: string

  constructor(extensionsDir: string) {
    this.extensionsDir = extensionsDir
  }

  // 扫描并加载所有 extension
  async loadExtensions(): Promise<void> {
    if (!fs.existsSync(this.extensionsDir)) {
      console.log('Extensions directory not found, creating:', this.extensionsDir)
      fs.mkdirSync(this.extensionsDir, { recursive: true })
      return
    }

    const dirs = fs.readdirSync(this.extensionsDir)

    for (const dir of dirs) {
      const extDir = path.join(this.extensionsDir, dir)
      const stat = fs.statSync(extDir)

      if (stat.isDirectory()) {
        await this.loadExtension(extDir)
      }
    }

    console.log(`Loaded ${this.extensions.size} extensions`)
  }

  // 加载单个 extension
  private async loadExtension(extDir: string): Promise<void> {
    const packagePath = path.join(extDir, 'package.json')

    if (!fs.existsSync(packagePath)) {
      console.warn(`No package.json found in ${extDir}`)
      return
    }

    try {
      const packageContent = fs.readFileSync(packagePath, 'utf-8')
      const pkg: ExtensionPackage = JSON.parse(packageContent)

      // 加载扩展的主文件
      const mainPath = path.join(extDir, pkg.main || 'index.js')

      if (!fs.existsSync(mainPath)) {
        console.warn(`Main file not found: ${mainPath}`)
        return
      }

      // 使用 require 加载模块（在 Electron 渲染进程中更可靠）
      // 清除 require 缓存以确保获取最新版本
      delete require.cache[require.resolve(mainPath)]
      const extensionModule = require(mainPath)
      const extension: IExtension = extensionModule.default || extensionModule

      // 为扩展创建 Store
      const store = new ExtensionStore(pkg.id)
      this.stores.set(pkg.id, store)

      // 注入 Store 到扩展实例
      extension.store = store

      console.log("load extension:", pkg.id)
      // 保存包配置
      this.extensionPackages.set(pkg.id, pkg)

      // 注册扩展
      this.extensions.set(pkg.id, extension)

      // 注册命令（来自 package.json）
      for (const command of pkg.commands) {
        console.log(`load extension pkg cmd: ${command.key}`)
        this.commands.set(`${pkg.id}#${command.key}`, {
          ...command,
          id: `${pkg.id}#${command.key}`,
        })
      }

      // 调用准备阶段，获取扩展返回的 actions
      const actionDefs = await extension.onPrepare()
      if (actionDefs && Array.isArray(actionDefs)) {

        // 为每个 action 生成 id 并存储到 commands（格式：extensionId#key）
        for (const def of actionDefs) {
          console.log(`load extension action: ${def.key}`)
          const action: IAction = {
            id: `${pkg.id}#${def.key}`,
            key: def.key,
            name: def.name,
            desc: def.desc,
            typeLabel: def.typeLabel || 'Extension'
          }

          this.commands.set(action.id, action)
        }

        console.log(`Extension ${pkg.id} registered ${actionDefs.length} actions from onPrepare`)
      }

      console.log(`Loaded extension: ${pkg.id} - ${pkg.title} (with store)`)
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
    for (const [extId, _] of this.extensions) {
      const extCommands = Array.from(this.commands.values()).filter(cmd => cmd.id.startsWith(extId))
      result.push({
        id: extId,
        commands: extCommands
      })
    }
    return result
  }

  // 执行命令
  // 返回扩展的执行结果
  async executeAction(action: IAction): Promise<null | React.ComponentType<any>> {
    console.log('Executing action:', action.id)

    // 从 action.id 解析 extensionId 和 key（格式：extensionId#key）
    const parts = action.id.split('#')

    if (parts.length !== 2) {
      throw new Error(`Invalid action id format: ${action.id}. Expected format: extensionId#key`)
    }

    const [extensionId, key] = parts
    const extension = this.extensions.get(extensionId)

    if (!extension) {
      throw new Error(`Extension ${extensionId} not found for action: ${action.id}`)
    }

    const result = await extension.doAction(key)
    console.log(`Action ${action.id} executed successfully, result:`, result)
    return result
  }

  // 获取有 UI 入口的扩展列表（现在不再使用，保留以防需要）
  getUIExtensions(): Array<{ id: string, uiPath: string }> {
    return []
  }

  // 获取预览元素
  async getPreviewComponents(input: string): Promise<Array<React.ReactElement>> {
    const previewElements: Array<React.ReactElement> = []

    // 遍历所有开启了 enabledPreview 的扩展
    for (const [extensionId, extension] of this.extensions) {
      if (extension.enabledPreview && extension.onPreview) {
        try {
          const element = await extension.onPreview(input)
          if (element) {
            previewElements.push(element)
          }
        } catch (error) {
          console.error(`Preview error in extension ${extensionId}:`, error)
        }
      }
    }

    return previewElements
  }

  // Store 操作方法
  getStoreValue(extensionId: string, key: string, defaultValue?: any) {
    const store = this.stores.get(extensionId)
    if (!store) {
      return defaultValue
    }
    return store.get(key, defaultValue)
  }

  setStoreValue(extensionId: string, key: string, value: any): boolean {
    const store = this.stores.get(extensionId)
    if (!store) {
      return false
    }
    store.set(key, value)
    return true
  }

  deleteStoreValue(extensionId: string, key: string): boolean {
    const store = this.stores.get(extensionId)
    if (!store) {
      return false
    }
    store.delete(key)
    return true
  }

  getStoreKeys(extensionId: string): string[] {
    const store = this.stores.get(extensionId)
    if (!store) {
      return []
    }
    return store.keys()
  }
}
