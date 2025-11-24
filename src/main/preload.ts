import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  onMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('main-process-message', (_event, message) => callback(message))
  },
  onStackChange: (stackLength: number) => {
    ipcRenderer.send('stack-change', stackLength)
  },
  onNavigateToPage: (callback: (pageName: string) => void) => {
    ipcRenderer.on('navigate-to-page', (_event, pageName) => callback(pageName))
  }
})

export type ElectronAPI = {
  onMessage: (callback: (message: string) => void) => void
  onStackChange: (stackLength: number) => void
  onNavigateToPage: (callback: (pageName: string) => void) => void
}
