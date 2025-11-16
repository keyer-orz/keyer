/**
 * 统一的命令执行工具
 * 处理系统命令、扩展命令、脚本命令的执行
 */
import { ICommand, ExtensionResult } from '../types'
import { CommandManager } from '../managers/CommandManager'
import { executeSystemCommand } from './SystemCommands'
import { NavigationContextType } from './NavigationContext'

export interface CommandExecutorOptions {
  navigateTo: NavigationContextType['navigateTo']
}

/**
 * 执行命令（统一入口）
 * @param command 要执行的命令
 * @param options 执行选项
 */
export async function executeCommand(
  command: ICommand,
  options: CommandExecutorOptions
): Promise<void> {
  try {
    // 1. 检查是否是系统命令
    const systemCommand = executeSystemCommand(command.ucid)
    if (systemCommand) {
      // 系统命令：直接导航到绑定的组件
      options.navigateTo({
        type: 'system',
        extensionComponent: systemCommand.component,
        windowSize: systemCommand.windowSize
      })
      return
    }

    // 2. 执行扩展/脚本命令
    const commandManager = CommandManager.getInstance()
    const result = await commandManager.execute(command)

    // 3. 处理返回值 (ExtensionResult = null | React.ReactElement | boolean)
    if (result === null || result === false) {
      // null/false: 关闭主面板
      const { ipcRenderer } = window.require('electron')
      await ipcRenderer.invoke('hide-window')
    } else if (result === true) {
      // true: 保持窗口打开，不做任何操作
      return
    } else if (React.isValidElement(result)) {
      // React.ReactElement: 切换至扩展的二级面板
      options.navigateTo({
        type: 'extension',
        extensionElement: result,
        windowSize: 'normal'
      })
    }
  } catch (error) {
    console.error('Execute error:', error)
  }
}
