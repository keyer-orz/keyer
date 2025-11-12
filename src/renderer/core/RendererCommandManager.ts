// 渲染进程中的 CommandManager 单例
import { CommandManager } from '../../shared/CommandManager'
import { ipcRenderer } from 'electron'

let commandManagerInstance: CommandManager | null = null

export async function initializeCommandManager() {
  if (commandManagerInstance) {
    return commandManagerInstance
  }

  // 从主进程获取路径信息
  const paths = await ipcRenderer.invoke('get-paths') as {
    scriptsDir: string
    extensionsDir: string
    isDev: boolean
  }

  console.log('Initializing CommandManager in renderer process')
  console.log('Scripts directory:', paths.scriptsDir)
  console.log('Extensions directory:', paths.extensionsDir)

  commandManagerInstance = new CommandManager(
    paths.scriptsDir,
    paths.extensionsDir
  )

  await commandManagerInstance.initialize()

  return commandManagerInstance
}

export function getCommandManager(): CommandManager {
  if (!commandManagerInstance) {
    throw new Error('CommandManager not initialized. Call initializeCommandManager first.')
  }
  return commandManagerInstance
}
