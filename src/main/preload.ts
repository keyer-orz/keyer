import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  onStackChange: (stackLength: number) => {
    ipcRenderer.send('stack-change', stackLength)
  },
  onNavigateToPage: (callback: (pageName: string) => void) => {
    ipcRenderer.on('navigate-to-page', (_event, pageName) => callback(pageName))
  }
})

export type ElectronAPI = {
  onStackChange: (stackLength: number) => void
  onNavigateToPage: (callback: (pageName: string) => void) => void
}
