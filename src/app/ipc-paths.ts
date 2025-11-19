/**
 * IPC 路径获取处理器
 */
import { ipcMain, app } from 'electron'
import * as path from 'path'

/**
 * 注册路径获取相关的 IPC 处理器
 */
export function setupPathsIPCHandlers() {
  // 获取沙箱目录路径
  ipcMain.handle('get-sandbox-dir', () => {
    return path.join(app.getPath('userData'), 'extensions')
  })

  // 获取开发环境目录路径
  ipcMain.handle('get-dev-paths', () => {
    const isDev = !!process.env.VITE_DEV_SERVER_URL
    if (!isDev) {
      return { extensionsDir: null, scriptsDir: null }
    }

    // 在开发模式下，返回项目根目录的 extensions 和 scripts 路径
    const projectRoot = path.join(__dirname, '..')
    return {
      extensionsDir: path.join(projectRoot, 'extensions'),
      scriptsDir: path.join(projectRoot, 'scripts')
    }
  })

  // 检查路径是否存在
  ipcMain.handle('check-paths-exist', (_, paths: string[]) => {
    const fs = require('fs')
    return paths.map(p => ({ path: p, exists: p ? fs.existsSync(p) : false }))
  })
}
