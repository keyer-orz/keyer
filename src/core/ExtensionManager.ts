import * as fs from 'fs'
import * as path from 'path'
import { ICommand, IAction, IExtension, ExtensionPackage, IPanelController } from '../types'
import { ExtensionStore } from './ExtensionStore'

export class ExtensionManager {
  private extensions: Map<string, IExtension> = new Map()
  private commands: Map<string, ICommand> = new Map()
  private extensionActions: Map<string, IAction[]> = new Map() // 存储扩展返回的 actions
  private stores: Map<string, ExtensionStore> = new Map()
  private extensionPackages: Map<string, ExtensionPackage> = new Map() // 存储包配置
  private extensionsDir: string
  private panelController: any | null = null  // 使用 any 来包含 setCurrentExtension

  constructor(extensionsDir: string, panelController?: any) {
    this.extensionsDir = extensionsDir
    this.panelController = panelController || null
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

      // 动态加载扩展模块
      const extensionModule = require(mainPath)
      const extension: IExtension = extensionModule.default || extensionModule

      // 为扩展创建 Store
      const store = new ExtensionStore(pkg.id)
      this.stores.set(pkg.id, store)

      // 注入 Store 到扩展实例
      extension.store = store

      // 注入 PanelController 到扩展实例
      if (this.panelController) {
        extension.panel = this.panelController
      }

      // 保存包配置
      this.extensionPackages.set(pkg.id, pkg)

      // 注册扩展
      this.extensions.set(pkg.id, extension)

      // 注册命令
      for (const command of pkg.commands) {
        this.commands.set(command.id, command)
      }

      // 调用准备阶段，获取扩展返回的 actions
      const actions = await extension.onPrepare()
      if (actions && Array.isArray(actions)) {
        this.extensionActions.set(pkg.id, actions)
        console.log(`Extension ${pkg.id} returned ${actions.length} actions`)
      }

      console.log(`Loaded extension: ${pkg.id} - ${pkg.name} (with store)`)
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

  // 获取所有扩展返回的 actions
  getExtensionActions(): IAction[] {
    const results: IAction[] = []

    for (const [_, actions] of this.extensionActions) {
      results.push(...actions)
    }

    return results
  }

  // 执行命令
  // 返回 true: 保持主面板打开
  // 返回 false: 自动关闭主面板
  async executeAction(action: IAction): Promise<boolean> {
    console.log('Executing action:', action)

    // 根据 action.ext.type 查找对应的扩展
    if (!action.ext || !action.ext.type) {
      throw new Error(`Action ${action.id} missing ext.type field`)
    }

    const extType = action.ext.type
    let extension = this.extensions.get(extType)
    let extensionId = extType

    // 如果找不到，尝试用完整 ID 格式查找（com.keyer.{type}）
    if (!extension) {
      const fullExtId = `com.keyer.${extType}`
      extension = this.extensions.get(fullExtId)
      extensionId = fullExtId
    }

    if (!extension) {
      throw new Error(`Extension ${extType} not found for action: ${action.id}`)
    }

    // 设置当前扩展 ID 到 PanelController
    if (this.panelController && this.panelController.setCurrentExtension) {
      this.panelController.setCurrentExtension(extensionId)
    }

    const keepOpen = await extension.doAction(action)
    console.log(`Action ${action.id} executed successfully, keepOpen: ${keepOpen}`)
    return keepOpen
  }

  // 获取有 UI 入口的扩展列表
  getUIExtensions(): Array<{ id: string, uiPath: string }> {
    const result: Array<{ id: string, uiPath: string }> = []

    for (const [id, pkg] of this.extensionPackages) {
      if (pkg.ui) {
        const uiPath = path.join(this.extensionsDir, path.dirname(pkg.main), pkg.ui)
        result.push({ id, uiPath })
      }
    }

    return result
  }
}
