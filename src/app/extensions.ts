import { commandManager } from './managers/CommandManager'
import SystemExts from './extesions'

// 注册所有扩展
export function registerExtensions() {
  commandManager.register(SystemExts)
}
