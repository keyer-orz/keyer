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
      // extension 配置的 actions
      ...this.extensionManager.getCommands().map(cmd => ({
        ...cmd,
        typeLabel: 'Command',
      })),
      // script 配置的 actions
      ...this.scriptManager.getCommands().map(cmd => ({
        ...cmd,
        typeLabel: 'Script',
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
  // 返回 true: 保持主面板打开
  // 返回 false: 自动关闭主面板
  async execute(action: IAction): Promise<boolean> {
    // 判断是 script 还是 extension
    const scriptCommand = this.scriptManager.getCommand(action.id)

    if (scriptCommand) {
      // 执行 script（脚本执行后默认关闭主面板）
      await this.scriptManager.executeScript(action.id)
      return false
    } else {
      // 执行 extension（由扩展决定是否关闭）
      return await this.extensionManager.executeAction(action)
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

  // 获取 UI 扩展列表
  getUIExtensions() {
    return this.extensionManager.getUIExtensions()
  }

  // Extension Store 操作
  getExtensionStoreValue(extensionId: string, key: string, defaultValue?: any) {
    return this.extensionManager.getStoreValue(extensionId, key, defaultValue)
  }

  setExtensionStoreValue(extensionId: string, key: string, value: any) {
    return this.extensionManager.setStoreValue(extensionId, key, value)
  }

  deleteExtensionStoreValue(extensionId: string, key: string) {
    return this.extensionManager.deleteStoreValue(extensionId, key)
  }

  getExtensionStoreKeys(extensionId: string) {
    return this.extensionManager.getStoreKeys(extensionId)
  }
}
