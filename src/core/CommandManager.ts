import { ICommand, IAction, IPanelController } from '../types'
import { ScriptManager } from './ScriptManager'
import { ExtensionManager } from './ExtensionManager'

export class CommandManager {
  private scriptManager: ScriptManager
  private extensionManager: ExtensionManager

  constructor(scriptsDir: string, extensionsDir: string, panelController?: IPanelController) {
    this.scriptManager = new ScriptManager(scriptsDir)
    this.extensionManager = new ExtensionManager(extensionsDir, panelController)
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
    // 获取所有可搜索的 actions：
    // 1. extension 返回的 actions (来自 onPrepare)
    // 2. extension 配置的 actions (来自 package.json commands)
    // 3. script 配置的 actions
    const allActions: IAction[] = [
      // extension 返回的 actions
      ...this.extensionManager.getExtensionActions(),
      // extension 配置的 actions (commands)
      ...this.extensionManager.getCommands().map(cmd => ({
        ...cmd,
        typeLabel: 'Command',
        ext: { type: 'command' }
      })),
      // script 配置的 actions
      ...this.scriptManager.getCommands().map(cmd => ({
        ...cmd,
        typeLabel: 'Script',
        ext: { type: 'script' }
      }))
    ]

    // 如果输入为空，返回所有 actions
    if (!input || input.trim() === '') {
      return allActions
    }

    const lowerInput = input.toLowerCase()

    // 进行一级搜索：在所有 actions 中匹配
    const results = allActions.filter(action =>
      action.name.toLowerCase().includes(lowerInput) ||
      action.desc.toLowerCase().includes(lowerInput)
    )

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
