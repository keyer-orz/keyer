import { ReactElement } from 'react'
import { IExtension } from 'keyerext/dist'

export interface ExtensionConfig {
  name: string
  ext: new () => IExtension
}

class CommandManager {
  private extensions: Map<string, ExtensionConfig> = new Map()

  register(config: ExtensionConfig) {
    this.extensions.set(config.name, config)
  }

  unregister(name: string) {
    this.extensions.delete(name)
  }

  has(name: string): boolean {
    return this.extensions.has(name)
  }

  execute(name: string, input: string = ''): ReactElement | null {
    const config = this.extensions.get(name)
    if (!config) {
      console.warn(`Extension "${name}" not found`)
      return null
    }

    try {
      const ExtClass = config.ext
      const instance = new ExtClass()
      return instance.run(input)
    } catch (error) {
      console.error(`Error executing extension "${name}":`, error)
      return null
    }
  }

  getAllExtensions(): string[] {
    return Array.from(this.extensions.keys())
  }
}

export const commandManager = new CommandManager()
