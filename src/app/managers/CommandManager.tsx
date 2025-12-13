import { ReactElement } from 'react'
import { CommandMode, CommandResult, ExtensionContextType } from 'keyerext'
import { Extension, Command } from '@/app/managers/Extension'
import { runCommand } from './ExtensionLoader'
import path from 'node:path'
import { Keyer } from '../keyer'
import { loadModule } from '@/shared/loader'

class CommandManager {
  private extensions: Map<string, Extension> = new Map()
  private appCommands: Command[] = []

  register(ext: Extension) {
    this.extensions.set(ext.name, ext)
  }

  registerCommand(cmd: Command, handler: () => CommandResult) {
    const cmdId = cmd.id
    console.log('Register command:', cmdId)
    if (cmdId == undefined) { return }
    if (cmdId.indexOf('#') === -1) { return }

    const [extName, __] = cmdId.split('#')
    if (extName.startsWith("@system")) {
      console.log('Register command for extension:', extName)
      cmd.handler = handler
      cmd.id = cmd.id || cmd.name
      cmd.ext = cmd.ext || { dir: '.' }
      this.appCommands.push(cmd)
      return
    }
    const ext = this.extensions.get(extName)
    if (!ext) { return }

    cmd.handler = handler
    cmd.id = cmd.id || cmd.name
    cmd.ext = cmd.ext || { dir: '.' }
    ext.addCommand(cmd)
  }

  get commands(): Command[] {
    const ext_commands = Array.from(this.extensions.values())
      .flatMap(ext => ext.allCommands)
      .filter(cmd => cmd.disabled != undefined || cmd.disabled != true)
    return [...this.appCommands, ...ext_commands]
      .filter(e => e.mode !== 'inline')
  }

  get previews(): Command[] {
    const ext_commands = Array.from(this.extensions.values())
      .flatMap(ext => ext.allCommands)
      .filter(cmd => cmd.mode === 'inline' && (cmd.disabled == undefined || cmd.disabled != true))
    return [...ext_commands]
  }

  reloadCommands() {
    this.extensions.forEach(ext => {
      if (ext.config?.disabled) {
        return
      }
      const commands = ext.allCommands
      commands.forEach(cmd => this.commands.push(cmd))
      ext.config?.commands && Object.entries(ext.config.commands).forEach(([cmdId, cmdConfig]) => {
        if (!cmdConfig.disabled && (cmdConfig.shortcut?.length || 0) > 0) {
          Keyer.shortcuts.registerCommand(cmdId, cmdConfig.shortcut || '')
        }
      })
    })
  }

  getExtension(name: string): Extension | undefined {
    return this.extensions.get(name)
  }

  getAllExtensions(): Extension[] {
    return Array.from(this.extensions.values())
  }

  preview(query: string): ReactElement[] {
    return (
      this.previews
        .map(e => this.runPreview(e, query))
        .filter(el => el !== null) as ReactElement[]
    )
  }

  runPreview(cmd: Command, input: string): ReactElement | null {
    if (cmd.code == undefined) {
      cmd.code = loadModule(path.join(cmd.ext.dir, 'dist', cmd.name + '.js'))
    }
    const handler = cmd.code.exports.default as (input: string) => ReactElement | null
    return handler?.(input)
  }

  search(query: string): Command[] {
    const filtered = this.commands
    if (!query || query.trim() === '') {
      return filtered.filter(cmd => cmd.id != "@system#main")
    }

    const lowerQuery = query.toLowerCase()
    return filtered.filter(cmd => {
      const titleMatch = cmd.title?.toLowerCase().includes(lowerQuery)
      const nameMatch = cmd.name?.toLowerCase().includes(lowerQuery)
      const descMatch = cmd.desc?.toLowerCase().includes(lowerQuery)
      return titleMatch || nameMatch || descMatch
    }).filter(cmd => cmd.id != "@system#main")
  }

  execute(cmdId: string): { element: JSX.Element; windowSize?: { width: number; height: number }; ctx: ExtensionContextType } | null {
    const command = this.commands.find(it => it.id === cmdId)
    if (!command) {
      console.warn(`Command "${cmdId}" not found`)
      return null
    }
    var res;
    if (command.mode === CommandMode.Window) {
      Keyer.window.create(command)
      return null
    }
    if (command.handler === undefined) {
      res = runCommand(command)
    } else {
      res = command.handler()
    }
    console.log('Command result:', res)

    if (res === null) {
      return null
    }

    if (res && typeof res === 'object' && 'size' in res) {
      return {
        element: (res as any).component,
        windowSize: (res as any).windowSize,
        ctx: command.ext,
      }
    }
    return {
      element: res as JSX.Element,
      ctx: command.ext,
    }
  }
}

export const commandManager = new CommandManager()
