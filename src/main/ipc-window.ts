/**
 * IPC 窗口控制处理器
 */
import { ipcMain } from 'electron'
import { getMainWindow } from './window'

/**
 * 注册窗口控制相关的 IPC 处理器
 */
export function setupWindowIPCHandlers() {
  // 隐藏窗口
  ipcMain.handle('hide-window', () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      mainWindow.hide()
    }
  })

  // 显示窗口
  ipcMain.handle('show-window', () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      mainWindow.show()
      mainWindow.center()
    }
  })

  // 调整窗口大小
  ipcMain.handle('resize-window', (_, width: number, height: number, center: boolean = true) => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      mainWindow.setSize(width, height, false)
      if (center) {
        mainWindow.center()
      }
    }
  })

  // 恢复窗口原始大小
  ipcMain.handle('restore-window-size', () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      const originalSize = (mainWindow as any).originalSize || { width: 800, height: 500 }
      mainWindow.setSize(originalSize.width, originalSize.height, false)
      mainWindow.center()
    }
  })
}
