import * as fs from 'fs'
import * as path from 'path'
import { ICommand, IAction, IExtension, ExtensionPackage, IPanelController } from '../types'
import { ExtensionStore } from './ExtensionStore'

export class ExtensionManager {
  private extensions: Map<string, IExtension> = new Map()
  private commands: Map<string, ICommand> = new Map()
  private stores: Map<string, ExtensionStore> = new Map()
  private extensionsDir: string
  private panelController: IPanelController | null = null

  constructor(extensionsDir: string, panelController?: IPanelController) {
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

      // 注册扩展
      this.extensions.set(pkg.id, extension)

      // 注册命令
      for (const command of pkg.commands) {
        this.commands.set(command.id, command)
      }

      // 调用准备阶段
      await extension.onPrepare()

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

  // 根据输入搜索所有扩展
  async search(input: string): Promise<IAction[]> {
    const results: IAction[] = []

    for (const [_, extension] of this.extensions) {
      try {
        const actions = await extension.onSearch(input)
        results.push(...actions)
      } catch (error) {
        console.error('Extension search error:', error)
      }
    }

    return results
  }

  // 执行命令
  async executeAction(action: IAction): Promise<void> {
    console.log('Executing action:', action)

    // 遍历所有扩展，让它们尝试处理这个 action
    for (const [extId, extension] of this.extensions) {
      try {
        await extension.doAction(action)
        console.log(`Action ${action.id} executed by extension ${extId}`)
        return
      } catch (error) {
        // 继续尝试下一个扩展
        console.log(`Extension ${extId} cannot handle action:`, error instanceof Error ? error.message : error)
      }
    }

    throw new Error(`No extension can handle action: ${action.id}`)
  }
}
