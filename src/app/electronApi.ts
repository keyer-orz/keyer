/**
 * 统一管理 Electron 主进程通信 API
 *
 * 注意: 由于 nodeIntegration: true, 大部分文件系统和应用信息功能
 * 已移至渲染进程直接调用,这里只保留必须在主进程的功能
 */
import { ipcRenderer } from 'electron'
import { api } from './api'

/**
 * 扩展包信息（从主进程扫描结果）
 * @deprecated 使用 shared/ipc.ts 中的 ExtensionPackageInfo
 */
export interface ExtensionPackageInfo {
  name: string
  title?: string
  desc?: string
  icon?: string
  version?: string
  main: string
  commands?: Array<{
    name: string
    title?: string
    desc?: string
    icon?: string
    type?: string
  }>
}

export const electronApi = {
  /**
   * 监听主进程发来的导航事件(全局快捷键触发)
   * 返回清理函数，用于移除监听器
   */
  onNavigateToPage: (callback: (pageName: string) => void) => {
    const handler = (_event: any, pageName: string) => callback(pageName)
    ipcRenderer.on('navigate-to-page', handler)

    // 返回清理函数
    return () => {
      ipcRenderer.removeListener('navigate-to-page', handler)
    }
  }

  // 其他功能请直接使用新的 API 系统
  // 例如: api.app.getVersion(), api.window.show(), api.file.read() 等
}