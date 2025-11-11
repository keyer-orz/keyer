import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  search: (input: string) => ipcRenderer.invoke('search', input),
  execute: (action: any) => ipcRenderer.invoke('execute', action),
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  onFocusInput: (callback: () => void) => {
    ipcRenderer.on('focus-input', callback)
  }
})
