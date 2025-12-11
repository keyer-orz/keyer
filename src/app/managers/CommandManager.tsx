import { ReactElement } from 'react'
import { CommandResult, ExtensionContextType, Keyer } from 'keyerext'
import { Extension, Command, Preview } from '@/app/managers/Extension'
class CommandManager {
  private extensions: Map<string, Extension> = new Map()
  private previews: Preview[] = []
  private appCommands: Command[] = []

  register(ext: Extension) {
    this.extensions.set(ext.name, ext)
    ext.active()
  }

  registerPreview(cid: string, hander: (input: string) => React.ReactElement | null) {
    this.previews.push({
      id: cid,
      handler: hander
    })
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
      cmd.ctx = cmd.ctx || { dir: '.' }
      this.appCommands.push(cmd)
      return
    }
    const ext = this.extensions.get(extName)
    if (!ext) { return }

    cmd.handler = handler
    cmd.id = cmd.id || cmd.name
    cmd.ctx = cmd.ctx || { dir: '.' }
    ext.addCommand(cmd)
  }

  get commands(): Command[] {
    const ext_commands = Array.from(this.extensions.values())
      .flatMap(ext => ext.commands)
      .filter(cmd => cmd.disabled != undefined || cmd.disabled != true)
    return [...this.appCommands, ...ext_commands]
  }

  reloadCommands() {
    this.extensions.forEach(ext => {
      if (ext.config?.disabled) {
        return
      }
      const commands = ext.commands
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
        .map(e => e.handler(query))
        .filter(el => el !== null) as ReactElement[]
    )
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

    if (command.handler === undefined) {
      console.warn(`Command "${cmdId}" has no handler`)
      return null
    }

    const res = command.handler()
    if (res === null) {
      return null
    }
   
    if (res && typeof res === 'object' && 'size' in res) {
      return {
        element: (res as any).component,
        windowSize: (res as any).windowSize,
        ctx: command.ctx,
      }
    }
    return {
      element: res as JSX.Element,
      ctx: command.ctx,
    }
  }
}

export const commandManager = new CommandManager()
