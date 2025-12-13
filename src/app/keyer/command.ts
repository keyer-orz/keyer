/**
 * 命令注册实现
 */
import { CommandResult, IRenderAPI, ICommand } from 'keyerext';
import { commandManager } from '../managers/CommandManager'
import { Command } from '@/app/managers/Extension';
import { ExtensionPackageInfo } from '@/shared/render-api';
import { title } from 'process';

export interface _ICommandAPI {
  _register(cmd: Command, handler: () => CommandResult): Promise<void>
  registerApp(cmd: ICommand, handler: () => CommandResult): Promise<void>
}

export const commandImpl: IRenderAPI['command'] & _ICommandAPI = {
  async register(cmd: ICommand, _: () => CommandResult): Promise<void> {
    console.error(`Use _register or registerApp instead of register directly. Command: ${cmd.name}`)
  },

  async _register(cmd: Command, handler: () => CommandResult): Promise<void> {
    commandManager.registerCommand(cmd, handler)
  },

  async registerApp(cmd: ICommand, handler: () => CommandResult): Promise<void> {
    const _cmd: Command = {
      ...cmd,
      id: `@system#${cmd.name}`,
      ext: {
        dir: '.',
        name: "keyer",
        title: "Keyer"
      }
    }
    console.log(_cmd)
    commandManager.registerCommand(_cmd, handler)
  },
}

type ICommandAPI = IRenderAPI['command'];

export class ExtensionCommand implements ICommandAPI {
  extPkg: ExtensionPackageInfo;
  constructor(extPkg: ExtensionPackageInfo) {
    this.extPkg = extPkg;

  }
  async register(cmd: ICommand, handler: () => CommandResult): Promise<void> {
    const _cmd: Command = {
      ...cmd,
      id: `${this.extPkg.name}#${cmd.name}`,
      ext: {
        dir: this.extPkg.dir,
        title: this.extPkg.title || "",
        name: this.extPkg.name,
      }
    }
    return commandImpl._register(_cmd, handler)
  }
}