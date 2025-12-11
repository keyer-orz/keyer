/**
 * 命令注册实现
 */

import { CommandResult, IRenderAPI, ICommand } from 'keyerext';
import { commandManager } from '../managers/CommandManager'
import { Command } from '@/app/managers/Extension';

export interface _ICommandAPI {
  _register(cmd: Command, handler: () => CommandResult): Promise<void>
  registerApp(cmd: ICommand, handler: () => CommandResult): Promise<void>
}

export const commandImpl: IRenderAPI['command'] & _ICommandAPI = {
  async register(cmd: ICommand, _: () => CommandResult): Promise<void> {
    console.error(`Use _register or registerApp instead of register directly. Command: ${cmd.name}`)
  },

  async preview(cmd: string, handler: (input: string) => React.ReactElement | null): Promise<void> {
    commandManager.registerPreview(cmd, handler)
  },

  async _register(cmd: Command, handler: () => CommandResult): Promise<void> {
    commandManager.registerCommand(cmd, handler)
  },

  async registerApp(cmd: ICommand, handler: () => CommandResult): Promise<void> {
    console.log("111", cmd)
    const _cmd: Command = {
      ...cmd,
      id: `@system#${cmd.name}`,
      extTitle: 'Keyer',
      ctx: { dir: '.' }
    }
    console.log(_cmd)
    commandManager.registerCommand(_cmd, handler)
  },
}