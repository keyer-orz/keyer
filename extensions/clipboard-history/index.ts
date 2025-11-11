import { clipboard } from 'electron'
import { IExtension, IActionDef, IStore, IPanelController } from 'keyerext'

export interface ClipboardEntry {
  content: string
  timestamp: number
}

class ClipboardHistoryExtension implements IExtension {
  store?: IStore
  panel?: IPanelController
  private history: ClipboardEntry[] = []
  private lastClipboard: string = ''
  private checkInterval: NodeJS.Timeout | null = null
  private readonly MAX_HISTORY = 100
  private readonly CHECK_INTERVAL_MS = 1000

  async onPrepare(): Promise<IActionDef[]> {
    // 从 store 加载历史记录
    this.loadHistory()
    // 开始监听剪贴板
    this.startClipboardMonitoring()
    console.log(`Clipboard History: Loaded ${this.history.length} entries`)
    return []
  }

  doAction(key: string): boolean {
    // 检查是否是打开面板命令
    if (key === 'show-panel') {
      return this.showPanel()
    }
    return true
  }

  private showPanel(): boolean {
    if (!this.panel) {
      console.error('Panel controller not available')
      return false
    }

    // 显示面板，传递历史记录数据
    this.panel.showPanel({
      title: 'Clipboard History',
      component: 'ClipboardHistoryPanel',
      props: {
        history: this.history
      }
    })

    // 保持主面板打开
    return true
  }

  // 公开方法供 UI 调用
  public copyToClipboard(index: number): void {
    const entry = this.history[index]
    if (entry) {
      clipboard.writeText(entry.content)
      console.log('Copied to clipboard:', this.getPreview(entry.content))
    }
  }

  public getHistory(): ClipboardEntry[] {
    return this.history
  }

  public getPreview(content: string, maxLength: number = 60): string {
    // 替换换行符为空格
    const singleLine = content.replace(/\s+/g, ' ').trim()

    if (singleLine.length <= maxLength) {
      return singleLine
    }

    return singleLine.substring(0, maxLength) + '...'
  }

  public getTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)

    if (seconds < 60) {
      return 'Just now'
    }

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) {
      return `${minutes}m ago`
    }

    const hours = Math.floor(minutes / 60)
    if (hours < 24) {
      return `${hours}h ago`
    }

    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  private startClipboardMonitoring() {
    // 获取初始剪贴板内容
    this.lastClipboard = clipboard.readText()

    // 定期检查剪贴板变化
    this.checkInterval = setInterval(() => {
      const current = clipboard.readText()

      if (current && current !== this.lastClipboard) {
        this.lastClipboard = current
        this.addToHistory(current)
      }
    }, this.CHECK_INTERVAL_MS)
  }

  private addToHistory(content: string) {
    // 去除首尾空白
    content = content.trim()

    if (!content) {
      return
    }

    // 检查是否已存在（移除重复）
    const existingIndex = this.history.findIndex(e => e.content === content)
    if (existingIndex !== -1) {
      this.history.splice(existingIndex, 1)
    }

    // 添加到历史记录开头
    this.history.unshift({
      content,
      timestamp: Date.now()
    })

    // 限制历史记录数量
    if (this.history.length > this.MAX_HISTORY) {
      this.history = this.history.slice(0, this.MAX_HISTORY)
    }

    // 保存到 store
    this.saveHistory()

    console.log('Added to clipboard history:', this.getPreview(content))
  }

  private loadHistory() {
    if (!this.store) {
      return
    }

    const saved = this.store.get<ClipboardEntry[]>('history')
    if (saved && Array.isArray(saved)) {
      this.history = saved
    }
  }

  private saveHistory() {
    if (!this.store) {
      return
    }

    this.store.set('history', this.history)
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
