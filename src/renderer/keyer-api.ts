/**
 * Keyer API 实现
 * 注入到 window.__keyer__，供插件使用
 */

const { ipcRenderer } = window.require('electron')

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
    }
  }
}
