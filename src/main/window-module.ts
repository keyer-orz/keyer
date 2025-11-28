import { APIType } from '@/shared/ipc'
import { getMainWindow } from './window-manager'

export const windowHandler: APIType['window'] = {
  show: async () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      mainWindow.show()
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()
    }
  },

  hide: async () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      mainWindow.hide()
    }
  },

  resize: async (size: { width: number; height: number }) => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      mainWindow.setSize(size.width, size.height)
      mainWindow.center()
    }
  }
}
