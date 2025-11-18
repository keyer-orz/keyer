/**
 * 统一的命令执行工具
 * 处理系统命令、扩展命令、脚本命令的执行
 */
import React from 'react'
import { CommandManager } from '@/managers/CommandManager'
import { UsageManager } from '@/managers/UsageManager'
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
  command: string,
  options: CommandExecutorOptions
): Promise<void> {
  try {
    const commandManager = CommandManager.getInstance()

    // 执行命令
    const result = await commandManager.execute(command)

    // 记录命令使用（排除系统的 main 命令）
    if (command !== '@system#main') {
      const usageManager = UsageManager.getInstance()
      usageManager.recordUsage(command)
    }

    // 处理返回值 (ExtensionResult = null | React.ReactElement | boolean)
    if (result === null || result === false) {
      // null/false: 关闭主面板
      const { ipcRenderer } = window.require('electron')
      await ipcRenderer.invoke('hide-window')
    } else if (result === true) {
      // true: 保持窗口打开，不做任何操作
      return
    } else if (React.isValidElement(result)) {
      // React.ReactElement: 导航到命令视图
      options.navigateTo({
        commandId: command,
        element: result,
        windowSize: 'normal'
      })
    }
  } catch (error) {
    console.error('Execute error:', error)
  }
}
