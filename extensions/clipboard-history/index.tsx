// 使用主 App 的 React 实例，避免多实例冲突
import type * as ReactType from 'react'
const React: typeof ReactType = (window as any).React

import electron from 'electron'
import { IExtension, IActionDef, IStore, ExtensionUIResult } from 'keyerext'
import { ClipboardHistoryPanel, ClipboardEntry } from './ui'

const { clipboard } = electron

// ============ Extension Instance (单例) ============
let extensionInstance: ClipboardHistoryExtension | null = null

// ============ Extension Class ============

class ClipboardHistoryExtension implements IExtension {
  store?: IStore
  private history: ClipboardEntry[] = []
  private lastClipboardText: string = ''
  private lastClipboardImage: string = ''
  private checkInterval: NodeJS.Timeout | null = null
  private readonly MAX_HISTORY = 100
  private readonly CHECK_INTERVAL_MS = 1000
  private readonly STORAGE_KEY = 'history_v2'  // 新的存储键名，清除旧数据

  async onPrepare(): Promise<IActionDef[]> {
    // 保存实例引用
    extensionInstance = this
    // 从 store 加载历史记录
    this.loadHistory()
    // 开始监听剪贴板
    this.startClipboardMonitoring()
    console.log(`Clipboard History: Loaded ${this.history.length} entries`)
    return []
  }

  doAction(key: string): ExtensionUIResult {
    console.log('[Clipboard History] doAction called with key:', key)
    // 检查是否是打开面板命令
    if (key === 'show-panel') {
      console.log('[Clipboard History] Opening panel with history length:', this.history.length)
      // 直接返回 React 元素
      try {
        const panel = <ClipboardHistoryPanel
          history={this.getHistory()}
          onCopy={this.copyToClipboard.bind(this)}
        />
        console.log('[Clipboard History] Panel element created successfully')
        return panel
      } catch (error) {
        console.error('[Clipboard History] Error creating panel:', error)
        return null
      }
    }
    console.log('[Clipboard History] Unknown key:', key)
    return null
  }

  // 供组件调用的公共方法
  getHistory(): ClipboardEntry[] {
    return this.history
  }

  // 复制到剪贴板
  copyToClipboard(entry: ClipboardEntry) {
    if (entry.type === 'text') {
      clipboard.writeText(entry.content)
      console.log('Copied text to clipboard:', this.getPreview(entry.content))
    } else if (entry.type === 'image') {
      // 从 base64 data URL 恢复图片
      const image = electron.nativeImage.createFromDataURL(entry.content)
      clipboard.writeImage(image)
      console.log('Copied image to clipboard:', entry.width, 'x', entry.height)
    }
  }

  private startClipboardMonitoring() {
    // 获取初始剪贴板内容
    this.lastClipboardText = clipboard.readText()
    const initialImage = clipboard.readImage()
    if (!initialImage.isEmpty()) {
      this.lastClipboardImage = initialImage.toDataURL()
    }

    // 定期检查剪贴板变化
    this.checkInterval = setInterval(() => {
      // 检查文本
      const currentText = clipboard.readText()
      if (currentText && currentText !== this.lastClipboardText) {
        this.lastClipboardText = currentText
        this.addToHistory({
          content: currentText,
          type: 'text',
          timestamp: Date.now()
        })
      }

      // 检查图片
      const currentImage = clipboard.readImage()
      if (!currentImage.isEmpty()) {
        const currentImageData = currentImage.toDataURL()
        if (currentImageData !== this.lastClipboardImage) {
          this.lastClipboardImage = currentImageData
          const size = currentImage.getSize()
          this.addToHistory({
            content: currentImageData,
            type: 'image',
            timestamp: Date.now(),
            width: size.width,
            height: size.height
          })
        }
      }
    }, this.CHECK_INTERVAL_MS)
  }

  private addToHistory(entry: ClipboardEntry) {
    // 对于文本，去除首尾空白
    if (entry.type === 'text') {
      entry.content = entry.content.trim()
      if (!entry.content) {
        return
      }
    }

    // 检查是否已存在（移除重复）
    const existingIndex = this.history.findIndex(e => {
      if (e.type !== entry.type) return false
      if (entry.type === 'text') {
        return e.content === entry.content
      } else {
        // 图片比较 data URL
        return e.content === entry.content
      }
    })

    if (existingIndex !== -1) {
      this.history.splice(existingIndex, 1)
    }

    // 添加到历史记录开头
    this.history.unshift(entry)

    // 限制历史记录数量
    if (this.history.length > this.MAX_HISTORY) {
      this.history = this.history.slice(0, this.MAX_HISTORY)
    }

    // 保存到 store
    this.saveHistory()

    const preview = entry.type === 'text'
      ? this.getPreview(entry.content)
      : `Image (${entry.width}x${entry.height})`
    console.log('Added to clipboard history:', preview)
  }

  private getPreview(content: string, maxLength: number = 60): string {
    const singleLine = content.replace(/\s+/g, ' ').trim()
    if (singleLine.length <= maxLength) return singleLine
    return singleLine.substring(0, maxLength) + '...'
  }

  private loadHistory() {
    if (!this.store) {
      return
    }

    const saved = this.store.get<ClipboardEntry[]>(this.STORAGE_KEY)
    if (saved && Array.isArray(saved)) {
      this.history = saved
    }
  }

  private saveHistory() {
    if (!this.store) {
      return
    }

    this.store.set(this.STORAGE_KEY, this.history)
  }

  // 清理资源
  onDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }
}

export default new ClipboardHistoryExtension()
