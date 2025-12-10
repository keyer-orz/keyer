/**
 * 命令注册实现
 */

import { CommandResult, IRenderAPI } from 'keyerext'
import { commandManager } from '../managers/CommandManager'

// 存储已注册的命令处理器
const commandHandlers = new Map<string, () => void>()

export const commandImpl: IRenderAPI['command'] = {
  async register(cmd: string, handler: () => CommandResult): Promise<void> {
    commandManager.registerCommand(cmd, handler)
  }
}

/**
 * 执行已注册的命令
 */
export function executeCommand(cmd: string): void {
  const handler = commandHandlers.get(cmd)
  if (handler) {
    handler()
  } else {
    console.warn(`Command not found: ${cmd}`)
  }
}

/**
 * 获取所有已注册的命令
 */
export function getAllCommands(): string[] {
  return Array.from(commandHandlers.keys())
}
