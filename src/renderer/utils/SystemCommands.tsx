import { ICommand } from '../../shared/types'

export interface SystemCommand {
  command: ICommand
  handler: (navigateTo: (viewState: any) => void) => void | Promise<void>
}

// 系统命令注册表
export const SYSTEM_COMMANDS: Record<string, SystemCommand> = {
  'system:settings': {
    command: {
      ucid: 'system:settings',
      name: 'settings',
      title: 'Settings',
      desc: 'Open settings panel',
      type: 'System'
    },
    handler: (navigateTo) => {
      navigateTo({ type: 'settings' })
    }
  }
  // 未来可以轻松添加更多系统命令
  // 'system:quit': { ... },
  // 'system:reload': { ... },
  // 'system:about': { ... },
}

// 检查是否是系统命令
export function isSystemCommand(commandId: string): boolean {
  return commandId.startsWith('system:')
}

// 获取系统命令
export function getSystemCommand(commandId: string): SystemCommand | undefined {
  return SYSTEM_COMMANDS[commandId]
}

// 执行系统命令
export async function executeSystemCommand(
  commandId: string,
  navigateTo: (viewState: any) => void
): Promise<boolean> {
  const command = getSystemCommand(commandId)
  if (!command) return false

  await command.handler(navigateTo)
  return true
}

// 获取所有系统命令的 commands（用于显示在列表中）
export function getAllSystemCommands(): ICommand[] {
  return Object.values(SYSTEM_COMMANDS).map(cmd => cmd.command)
}
