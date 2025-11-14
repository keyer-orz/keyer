/**
 * Keyer API 实现
 * 注入到 window.__keyer__，供插件使用
 */

const { ipcRenderer } = window.require('electron')

// Toast 管理
let toastCallback: ((message: string, duration: number) => void) | null = null

export function setToastCallback(callback: (message: string, duration: number) => void) {
  toastCallback = callback
}

export function initKeyerAPI() {
  ;(window as any).__keyer__ = {
    hideWindow: () => ipcRenderer.invoke('hide-window'),

    showWindow: () => ipcRenderer.invoke('show-window'),

    resizeWindow: (width: number, height: number, center = true) =>
      ipcRenderer.invoke('resize-window', width, height, center),

    restoreWindowSize: () => ipcRenderer.invoke('restore-window-size'),

    simulatePaste: () => ipcRenderer.invoke('simulate-paste'),

    copyAndPaste: (copyAction: () => void) => {
      copyAction()
      return ipcRenderer.invoke('copy-and-paste')
    },

    showToast: (message: string, duration = 2000) => {
      if (toastCallback) {
        toastCallback(message, duration)
      }
      return Promise.resolve()
    }
  }
}
