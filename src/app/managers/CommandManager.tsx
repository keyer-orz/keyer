import { ReactElement } from 'react'
import { ExtensionMeta, ICommand } from 'keyerext'

class CommandManager {
  private extensions: Map<string, ExtensionMeta> = new Map()
  private commands: ICommand[] = []

  register(meta: ExtensionMeta) {
    this.extensions.set(meta.name, meta)

    // 1. 静态命令
    if (meta.commands) {
      meta.commands.map(item => {
        item.id = `${meta.name}#${item.name}`
        return item
      })
        .forEach(item => this.commands.push(item))
    }

    // 2. 动态命令（load）
    if (meta.ext && typeof meta.ext.load === 'function') {
      try {
        const loaded = meta.ext.load()
        if (Array.isArray(loaded)) {
          loaded.map(item => {
            item.id = `${meta.name}#${item.name}`
            return item
          }).forEach(item => this.commands.push(item))
        }
      } catch (e) {
        // 可选：日志输出
      }
    }
  }

  getAllCommands(): ICommand[] {
    return this.commands
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
    if (!query || query.trim() === '') {
      return this.commands.filter(cmd => cmd.id != "@system#main")
    }

    const lowerQuery = query.toLowerCase()
    return this.commands.filter(cmd => {
      const titleMatch = cmd.title?.toLowerCase().includes(lowerQuery)
      const nameMatch = cmd.name?.toLowerCase().includes(lowerQuery)
      const descMatch = cmd.desc?.toLowerCase().includes(lowerQuery)
      const extTitleMatch = cmd.extTitle?.toLowerCase().includes(lowerQuery)

      return titleMatch || nameMatch || descMatch || extTitleMatch
    }).filter(cmd => cmd.id != "@system#main")
  }

  execute(commandName: string): ReactElement | null {
    const [extId, cmdName] = commandName.split('#')
    const commandInfo = this.commands.find(it => it.id === commandName)
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
      return ext.ext.run(cmdName) || null
    } catch (error) {
      console.error(`Error executing command "${commandName}":`, error)
      return null
    }
  }
}

export const commandManager = new CommandManager()
