import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  onMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('main-process-message', (_event, message) => callback(message))
  },
  onStackChange: (stackLength: number) => {
    ipcRenderer.send('stack-change', stackLength)
  }
})

export type ElectronAPI = {
  onMessage: (callback: (message: string) => void) => void
  onStackChange: (stackLength: number) => void
}
