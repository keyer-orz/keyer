import { ReactElement } from 'react'
import { ICommand } from 'keyerext'
import { ExtensionMeta } from '@/shared/extension'
import { configManager } from '../utils/config'
class CommandManager {
  private extensions: Map<string, ExtensionMeta> = new Map()
  private commands: ICommand[] = []

  register(meta: ExtensionMeta) {
    this.extensions.set(meta.name, meta)
  }

  reloadCommands() {
    this.commands = []
    this.extensions.forEach(meta => {
      const commands = meta.allCommands()
      commands.forEach(cmd => this.commands.push(cmd))
    })
  }

  getAllExtensions(): ExtensionMeta[] {
    return Array.from(this.extensions.values())
  }

  getAllCommands(): ICommand[] {
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

  search(query: string): ICommand[] {
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

  execute(commandName: string): { element: ReactElement; windowSize?: { width: number; height: number } } | null {
    const [extId, cmdName] = commandName.split('#')
    const commandInfo = this.commands.find(it => it.id === commandName)
    console.log('Command info:', commandInfo)
    if (!commandInfo) {
      console.warn(`Command "${commandName}" not found`)
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
      return {
        element,
        windowSize: commandInfo.windowSize
      }
    } catch (error) {
      console.error(`Error executing command "${commandName}":`, error)
      return null
    }
  }
}

export const commandManager = new CommandManager()
