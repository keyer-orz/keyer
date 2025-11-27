/**
 * 统一管理 Electron 主进程通信 API
 *
 * 注意: 由于 nodeIntegration: true, 大部分文件系统和应用信息功能
 * 已移至渲染进程直接调用,这里只保留必须在主进程的功能
 */
import { ipcRenderer } from 'electron'

/**
 * 扩展包信息（从主进程扫描结果）
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
   * 显示主窗口
   */
  showWindow: () => {
    ipcRenderer.send('window-show')
  },

  /**
   * 隐藏主窗口
   */
  hideWindow: () => {
    ipcRenderer.send('window-hide')
  },

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
  },

  /**
   * 更新全局快捷键(必须在主进程)
   */
  updateGlobalShortcut: (shortcut: string): Promise<boolean> => {
    return ipcRenderer.invoke('update-global-shortcut', shortcut)
  },

  /**
   * 获取应用路径信息(必须在主进程)
   */
  getAppPaths: (): Promise<{
    userData: string
    appData: string
    temp: string
    home: string
    appRoot?: string
  }> => {
    return ipcRenderer.invoke('get-app-paths')
  },

  /**
   * 在系统终端中执行命令
   */
  execTerminal: (cmd: string, cwd?: string): Promise<any> => {
    return ipcRenderer.invoke('exec-terminal', cmd, cwd)
  },

  /**
   * 在新窗口中执行命令
   */
  execWindow: (cmd: string): Promise<any> => {
    return ipcRenderer.invoke('exec-window', cmd)
  },

  /**
   * 更新命令快捷键
   */
  updateCmdShortcut: (cmdId: string, shortcut: string | undefined): Promise<boolean> => {
    return ipcRenderer.invoke('update-cmd-shortcut', cmdId, shortcut)
  },

  /**
   * 扫描并获取所有扩展的元数据
   */
  scanExtensions: (): Promise<ExtensionPackageInfo[]> => {
    return ipcRenderer.invoke('scan-extensions')
  },

  /**
   * 获取扩展文件的完整路径
   */
  getExtensionPath: (extensionMain: string): Promise<string> => {
    return ipcRenderer.invoke('get-extension-path', extensionMain)
  }
}