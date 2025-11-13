import { IAction } from '../../shared/types'

export interface SystemCommand {
  action: IAction
  handler: (navigateTo: (viewState: any) => void) => void | Promise<void>
}

// 系统命令注册表
export const SYSTEM_COMMANDS: Record<string, SystemCommand> = {
  'system:settings': {
    action: {
      id: 'system:settings',
      key: 'settings',
      name: 'Settings',
      desc: 'Open settings panel',
      typeLabel: 'System'
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
export function isSystemCommand(actionId: string): boolean {
  return actionId.startsWith('system:')
}

// 获取系统命令
export function getSystemCommand(actionId: string): SystemCommand | undefined {
  return SYSTEM_COMMANDS[actionId]
}

// 执行系统命令
export async function executeSystemCommand(
  actionId: string,
  navigateTo: (viewState: any) => void
): Promise<boolean> {
  const command = getSystemCommand(actionId)
  if (!command) return false

  await command.handler(navigateTo)
  return true
}

// 获取所有系统命令的 actions（用于显示在列表中）
export function getAllSystemActions(): IAction[] {
  return Object.values(SYSTEM_COMMANDS).map(cmd => cmd.action)
}
