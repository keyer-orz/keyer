/**
 * Keyer 核心能力实现
 *
 * 实现 keyerext 中声明的 IKeyer 接口
 * 提供剪贴板操作、应用控制等核心能力
 */

import { clipboard, nativeImage } from 'electron'
import type { IKeyer, ClipboardData } from 'keyerext'
import { api } from '../api'

/**
 * 剪贴板操作实现
 */
const clipboardImpl = {
  async read(): Promise<ClipboardData> {
    const data: ClipboardData = {}

    // 读取文本
    const text = clipboard.readText()
    if (text) {
      data.text = text
    }

    // 读取 HTML
    const html = clipboard.readHTML()
    if (html) {
      data.html = html
    }

    // 读取图片
    const image = clipboard.readImage()
    if (!image.isEmpty()) {
      data.image = image.toDataURL()
    }

    return data
  },

  async readText(): Promise<string> {
    return clipboard.readText()
  },

  async readImage(): Promise<string | null> {
    const image = clipboard.readImage()
    if (image.isEmpty()) {
      return null
    }
    return image.toDataURL()
  },

  async writeText(text: string): Promise<void> {
    clipboard.writeText(text)
  },

  async writeImage(image: string | Buffer): Promise<void> {
    let nImage: Electron.NativeImage

    if (typeof image === 'string') {
      // Base64 或 Data URL
      if (image.startsWith('data:')) {
        nImage = nativeImage.createFromDataURL(image)
      } else {
        nImage = nativeImage.createFromBuffer(Buffer.from(image, 'base64'))
      }
    } else {
      // Buffer
      nImage = nativeImage.createFromBuffer(image)
    }

    clipboard.writeImage(nImage)
  },

  async writeHtml(html: string): Promise<void> {
    clipboard.writeHTML(html)
  },

  async clear(): Promise<void> {
    clipboard.clear()
  }
}

/**
 * 创建主进程 API 代理
 * 所有调用都会通过 IPC 转发到主进程
 */
const mainAPI = {
  window: {
    show: () => api.window.show(),
    hide: () => api.window.hide(),
    resize: (size: { width: number; height: number }) => api.window.resize(size)
  },
  file: {
    read: (path: string) => api.file.read(path),
    write: (path: string, content: string) => api.file.write(path, content),
    selectDirectory: () => api.file.selectDirectory()
  },
  shortcuts: {
    updateGlobal: (shortcut: string) => api.shortcuts.updateGlobal(shortcut),
    updateCommand: (cmdId: string, shortcut: string | undefined) => api.shortcuts.updateCommand(cmdId, shortcut)
  },
  exec: {
    terminal: (cmd: string, cwd?: string) => api.exec.terminal(cmd, cwd),
    window: (cmd: string, cwd?: string) => api.exec.window(cmd, cwd)
  }
}

/**
 * Keyer 实例
 * 组合主进程 API 和渲染进程 API
 */
export const KeyerInstance: IKeyer = {
  ...mainAPI,
  clipboard: clipboardImpl
}
