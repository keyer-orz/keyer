/**
 * Keyer API 实现
 * 注入到 window.__keyer__，供插件使用
 */

import type { ClipboardImage } from 'keyerext'

const { ipcRenderer, clipboard, nativeImage } = window.require('electron')

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
    },

    // ============ 剪切板 API ============
    clipboardReadText: async (): Promise<string> => {
      return clipboard.readText()
    },

    clipboardWriteText: async (text: string): Promise<void> => {
      clipboard.writeText(text)
    },

    clipboardReadImage: async (): Promise<ClipboardImage | null> => {
      const image = clipboard.readImage()
      if (image.isEmpty()) {
        return null
      }
      const size = image.getSize()
      return {
        dataURL: image.toDataURL(),
        width: size.width,
        height: size.height
      }
    },

    clipboardWriteImage: async (dataURL: string): Promise<void> => {
      const image = nativeImage.createFromDataURL(dataURL)
      clipboard.writeImage(image)
    }
  }
}
