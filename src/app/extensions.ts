import { commandManager } from './managers/CommandManager'
import mainExt from '@/app/extesions/main'
import settingExt from '@/app/extesions/setting'
import uiExt from '@/app/extesions/ui'

// 注册所有扩展
export function registerExtensions() {
  commandManager.register(mainExt)
  commandManager.register(settingExt)
  commandManager.register(uiExt)
}
