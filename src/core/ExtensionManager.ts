import * as fs from 'fs'
import * as path from 'path'
import { ICommand, IAction, IExtension, ExtensionPackage } from '../types'

export class ExtensionManager {
  private extensions: Map<string, IExtension> = new Map()
  private commands: Map<string, ICommand> = new Map()
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

      // 动态加载扩展模块
      const extensionModule = require(mainPath)
      const extension: IExtension = extensionModule.default || extensionModule

      // 注册扩展
      this.extensions.set(pkg.id, extension)

      // 注册命令
      for (const command of pkg.commands) {
        this.commands.set(command.id, command)
      }

      // 调用准备阶段
      await extension.onPrepare()

      console.log(`Loaded extension: ${pkg.id} - ${pkg.name}`)
    } catch (error) {
      console.error(`Failed to load extension from ${extDir}:`, error)
    }
  }

  // 获取所有命令
  getCommands(): ICommand[] {
    return Array.from(this.commands.values())
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
    // 找到对应的扩展
    console.log('Executing action:', action)
    try {
      let extension = this.extensions.get(action.id || '')
      if (extension) {
        await extension.doAction(action)
        console.log(`Action ${action.id} executed by extension ${action.id}`)
        return
      }
    } catch (error) {
      // 继续尝试下一个扩展
      console.log(`Extension ${action.id} cannot handle action:`, error instanceof Error ? error.message : error)
    }

    throw new Error(`No extension can handle action: ${action.id}`)
  }
}
