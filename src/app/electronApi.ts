// 统一管理 Electron 主进程通信 API（contextIsolation: false 时使用）
import { ipcRenderer } from 'electron'

export const electronApi = {
  onStackChange: (stackLength: number) => {
    ipcRenderer.send('stack-change', stackLength)
  },
  onNavigateToPage: (callback: (pageName: string) => void) => {
    ipcRenderer.on('navigate-to-page', (_event, pageName) => callback(pageName))
  },
  getDevDir: (): Promise<string> => {
    return ipcRenderer.invoke('get-dev-dir')
  },
  readDir: (path: string): Promise<string[]> => {
    return ipcRenderer.invoke('read-dir', path)
  },
  readFile: (path: string): Promise<string> => {
    return ipcRenderer.invoke('read-file', path)
  },
  pathJoin: (...paths: string[]): Promise<string> => {
    return ipcRenderer.invoke('path-join', paths)
  }
}