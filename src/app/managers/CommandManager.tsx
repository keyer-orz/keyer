import { ReactElement } from 'react'
import { Command, Extension } from '@/shared/extension'
import { configManager } from '../utils/config'
import { CommandResult, ExtensionContextType, Keyer } from 'keyerext'
class CommandManager {
  private extensions: Map<string, Extension> = new Map()
  private commands: Command[] = []

  register(meta: Extension) {
    this.extensions.set(meta.name, meta)
  }

  registerCommand(cid: string, handler:() => CommandResult) {
    this.commands.push({
      id: cid,
      ctx: {
        dir: ''
      },
      handler,
      title: 'xxxxx',
      name: 'xxxxx'
    })
  }

  reloadCommands() {
    this.commands = this.commands.filter(c => c.handler)
    this.extensions.forEach(meta => {
      if (meta.config?.disabled) {
        return
      }
      const commands = meta.commands
      commands.forEach(cmd => this.commands.push(cmd))
      meta.config?.commands && Object.entries(meta.config.commands).forEach(([cmdId, cmdConfig]) => {
        if (!cmdConfig.disabled && (cmdConfig.shortcut?.length || 0) > 0) {
          Keyer.shortcuts.registerCommand(cmdId, cmdConfig.shortcut || '')
        }
      })
    })
  }

  getExtension(name: string): Extension | undefined {
    console.log(this.extensions)
    return this.extensions.get(name)
  }
  
  getAllExtensions(): Extension[] {
    return Array.from(this.extensions.values())
  }

  getAllCommands(): Command[] {
    return this.commands.filter(cmd => !configManager.getCmdConfig(cmd.id!).disabled)
  }

  preview(query: string): ReactElement[] {
    return (
      Array.from(this.extensions.values())
        .filter(e => e.ext && typeof e.ext.preview === 'function')
        .map(e => e.ext!.preview!(query))
        .filter(el => el !== null) as ReactElement[]
    )
  }

  search(query: string): Command[] {
    const filtered = this.commands.filter(cmd => !configManager.getCmdConfig(cmd.id!).disabled)
    if (!query || query.trim() === '') {
      return filtered.filter(cmd => cmd.id != "@system#main")
    }

    const lowerQuery = query.toLowerCase()
    return filtered.filter(cmd => {
      const titleMatch = cmd.title?.toLowerCase().includes(lowerQuery)
      const nameMatch = cmd.name?.toLowerCase().includes(lowerQuery)
      const descMatch = cmd.desc?.toLowerCase().includes(lowerQuery)
      const extTitleMatch = cmd.extTitle?.toLowerCase().includes(lowerQuery)

      return titleMatch || nameMatch || descMatch || extTitleMatch
    }).filter(cmd => cmd.id != "@system#main")
  }

  execute(commandName: string): { element: ReactElement; windowSize?: { width: number; height: number }; ctx: ExtensionContextType } | null {
    const [extId, cmdName] = commandName.split('#')
    const commandInfo = this.commands.find(it => it.id === commandName)
    if (!commandInfo) {
      console.warn(`Command "${commandName}" not found`)
      return null
    }

    if (commandInfo.handler) {
      commandInfo.handler()
      return null
    }

    try {
      const ext = this.extensions.get(extId)
      if (!ext?.ext) {
        console.warn(`Extension "${extId}" not loaded yet`)
        return null
      }
      const element = ext.ext.run(cmdName)
      if (!element) {
        return null
      }
      // 如果 element 是字典
      return {
        element,
        ctx: commandInfo.ctx,
      }
    } catch (error) {
      console.error(`Error executing command "${commandName}":`, error)
      return null
    }
  }
}

export const commandManager = new CommandManager()
