/**
 * Keyer 核心能力实现
 *
 * 实现 keyerext 中声明的 IKeyer 接口
 * 提供剪贴板操作、应用控制等核心能力
 */

import { clipboard, nativeImage } from 'electron'
import type { IKeyer, ClipboardData, ExecOptions, ExecResult } from 'keyerext'
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
 * 应用控制实现
 */
const appImpl = {
  async hide(): Promise<void> {
    // 通过清空导航栈来隐藏应用
  },

  async show(): Promise<void> {
  },

  /**
   * 获取应用图标（返回 base64 PNG）
   * @param appPath 应用路径（.app）
   * @returns base64 PNG 字符串
   */
}

/**
 * Keyer 实例
 */
export const KeyerInstance: IKeyer = {
  /**
   * 执行命令
   * @param cmd 要执行的命令
   * @param mode 执行模式: terminal(系统终端) 或 window(新窗口)
   * @returns 执行结果的 Promise
   */
  async exec(cmd: string, opt?: ExecOptions): Promise<ExecResult> {
    if (opt?.mode === 'terminal') {
      return await api.exec.terminal(cmd, opt.cwd)
    } else {
      return await api.exec.window(cmd)
    }
  },

  clipboard: clipboardImpl,
  app: appImpl
}
