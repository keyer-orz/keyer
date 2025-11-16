import React from 'react'
import { ICommand } from '../types'
import { WindowSize } from './NavigationContext'
import Settings from '../settings/Settings'
import Store from '../components/Store'

export interface SystemCommand {
  command: ICommand
  component: React.ComponentType<any>
  windowSize: WindowSize
}

// 系统命令注册表
export const SYSTEM_COMMANDS: SystemCommand[] = [
  {
    command: {
      ucid: '@system#settings',
      name: 'settings',
      title: 'Settings',
      desc: 'Open settings panel',
      type: 'System'
    },
    component: Settings,
    windowSize: 'large'
  },
  {
    command: {
      ucid: '@system#store',
      icon: '🏪',
      name: 'store',
      title: 'Plugin Store',
      desc: 'Browse and install plugins',
      type: 'System'
    },
    component: Store,
    windowSize: 'large'
  }
]

// 检查是否是系统命令
export function isSystemCommand(commandId: string): boolean {
  return commandId.startsWith('@system#')
}

// 获取系统命令
export function getSystemCommand(commandId: string): SystemCommand | undefined {
  return SYSTEM_COMMANDS.find(cmd => cmd.command.ucid === commandId)
}

// 执行系统命令 - 返回组件和窗口大小
export function executeSystemCommand(commandId: string): { component: React.ComponentType; windowSize: WindowSize } | null {
  const command = getSystemCommand(commandId)
  return command ? { component: command.component, windowSize: command.windowSize } : null
}

// 获取所有系统命令的 commands（用于显示在列表中）
export function getAllSystemCommands(): ICommand[] {
  return Object.values(SYSTEM_COMMANDS).map(cmd => cmd.command)
}
