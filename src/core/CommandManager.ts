import { ICommand, IAction } from '../types'
import { ScriptManager } from './ScriptManager'
import { ExtensionManager } from './ExtensionManager'

export class CommandManager {
  private scriptManager: ScriptManager
  private extensionManager: ExtensionManager

  constructor(scriptsDir: string, extensionsDir: string) {
    this.scriptManager = new ScriptManager(scriptsDir)
    this.extensionManager = new ExtensionManager(extensionsDir)
  }

  // 初始化：扫描所有脚本和扩展
  async initialize(): Promise<void> {
    await this.scriptManager.scanScripts()
    await this.extensionManager.loadExtensions()
  }

  // 获取所有可用的命令
  getAllCommands(): ICommand[] {
    return [
      ...this.scriptManager.getCommands(),
      ...this.extensionManager.getCommands(),
    ]
  }

  // 搜索命令和扩展结果
  async search(input: string): Promise<IAction[]> {
    const results: IAction[] = []

    // 如果输入为空，返回所有命令
    if (!input || input.trim() === '') {
      const allCommands = this.getAllCommands()
      return allCommands.map(cmd => ({
        ...cmd,
        typeLabel: 'Command',
        ext: { type: 'command' }
      }))
    }

    const lowerInput = input.toLowerCase()

    // 1. 从已注册的命令中匹配
    const allCommands = this.getAllCommands()
    const matchedCommands = allCommands.filter(cmd =>
      cmd.name.toLowerCase().includes(lowerInput) ||
      cmd.desc.toLowerCase().includes(lowerInput)
    )

    results.push(...matchedCommands.map(cmd => ({
      ...cmd,
      typeLabel: 'Command',
      ext: { type: 'command' }
    })))

    // 2. 从扩展的 onSearch 中获取结果
    const extensionResults = await this.extensionManager.search(input)
    results.push(...extensionResults)

    return results
  }

  // 执行命令
  async execute(action: IAction): Promise<void> {
    // 判断是 script 还是 extension
    const scriptCommand = this.scriptManager.getCommand(action.id)

    if (scriptCommand) {
      // 执行 script
      await this.scriptManager.executeScript(action.id)
    } else {
      // 执行 extension
      await this.extensionManager.executeAction(action)
    }
  }

  // 获取扩展列表
  getExtensions() {
    return this.extensionManager.getAllExtensions()
  }

  // 获取脚本列表
  getScripts() {
    return this.scriptManager.getCommands()
  }
}
