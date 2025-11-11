import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electron', {
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args)
})

contextBridge.exposeInMainWorld('extensionStore', {
  get: (extensionId: string, key: string, defaultValue?: any) =>
    ipcRenderer.invoke('extension-store-get', extensionId, key, defaultValue),
  set: (extensionId: string, key: string, value: any) =>
    ipcRenderer.invoke('extension-store-set', extensionId, key, value),
  delete: (extensionId: string, key: string) =>
    ipcRenderer.invoke('extension-store-delete', extensionId, key),
  keys: (extensionId: string) =>
    ipcRenderer.invoke('extension-store-keys', extensionId)
})

contextBridge.exposeInMainWorld('electronAPI', {
  search: (input: string) => ipcRenderer.invoke('search', input),
  execute: (action: any) => ipcRenderer.invoke('execute', action),
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  onFocusInput: (callback: () => void) => {
    ipcRenderer.on('focus-input', callback)
  },
  getExtensions: () => ipcRenderer.invoke('get-extensions'),
  getScripts: () => ipcRenderer.invoke('get-scripts'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  updateConfig: (updates: any) => ipcRenderer.invoke('update-config', updates),
  onThemeChanged: (callback: (theme: string) => void) => {
    ipcRenderer.on('theme-changed', (_, theme) => callback(theme))
  },
  onShowPanel: (callback: (config: any) => void) => {
    ipcRenderer.on('show-panel', (_, config) => callback(config))
  },
  onClosePanel: (callback: () => void) => {
    ipcRenderer.on('close-panel', callback)
  },
  onUpdatePanel: (callback: (items: any) => void) => {
    ipcRenderer.on('update-panel', (_, items) => callback(items))
  },
  loadUIExtensions: () => ipcRenderer.invoke('load-ui-extensions')
})
