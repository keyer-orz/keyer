import { APIType } from '@/shared/ipc'
import { updateGlobalShortcut, updateCommandShortcut } from './shortcut-manager'

export const shortcutsHandler: APIType['shortcuts'] = {
  updateGlobal: async (shortcut: string) => {
    return updateGlobalShortcut(shortcut)
  },

  updateCommand: async (cmdId: string, shortcut: string | undefined) => {
    return updateCommandShortcut(cmdId, shortcut)
  }
}
