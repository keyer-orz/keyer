import { clipboard, nativeImage } from "electron"
import { IRenderAPI, ClipboardData } from "keyerext"

/**
 * 剪贴板操作实现
 */
export const clipboardImpl: IRenderAPI["clipboard"] = {
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