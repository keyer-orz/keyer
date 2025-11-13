// 使用主 App 的 React 实例，避免多实例冲突
import type * as ReactType from 'react'
const React: typeof ReactType = (window as any).React
const { useState, useEffect, useRef } = React

import electron from 'electron'
import { IExtension, IActionDef, IStore, List, Item, Input, Panel, Text } from 'keyerext'
import type { ListItem } from 'keyerext'

const { clipboard } = electron

export interface ClipboardEntry {
  content: string
  timestamp: number
}

// ============ Extension Instance (单例) ============
let extensionInstance: ClipboardHistoryExtension | null = null

// ============ React Component ============

function ClipboardHistoryPanel() {
  const [filter, setFilter] = useState('')
  // 从扩展实例获取历史记录
  const [history] = useState<ClipboardEntry[]>(extensionInstance?.getHistory() || [])

  // 根据过滤条件筛选历史记录
  const filteredHistory = history.filter(entry => {
    if (!filter) return true
    return entry.content.toLowerCase().includes(filter.toLowerCase())
  })

  // 转换为 ListItem 格式
  const listItems: ListItem<ClipboardEntry>[] = filteredHistory.map(entry => ({
    id: entry.timestamp,
    data: entry
  }))


  // 复制到剪贴板
  const copyToClipboard = (item: ListItem<ClipboardEntry>) => {
    clipboard.writeText(item.data.content)
    console.log('Copied to clipboard:', item.data.content.substring(0, 50))
  }

  // 格式化时间
  const getTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  // 获取预览文本
  const getPreview = (content: string, maxLength: number = 100): string => {
    const singleLine = content.replace(/\s+/g, ' ').trim()
    if (singleLine.length <= maxLength) return singleLine
    return singleLine.substring(0, maxLength) + '...'
  }

  return (
    <Panel>
      {/* 搜索框 */}
      <div className="search-container">
        <Input
          value={filter}
          onChange={setFilter}
          placeholder="Filter clipboard history..."
          autoFocus={true}
        />
      </div>
      <div className="results-container">
        {/* 历史记录列表 */}
        {listItems.length === 0 ? (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-tertiary)'
          }}>
            {filter ? 'No matching items' : 'No clipboard history yet'}
          </div>
        ) : (
          <List
            items={listItems}
            onEnter={copyToClipboard}
            renderItem={(item) => (
              <Item>
                <div style={{ fontSize: '20px' }}>📋</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <Text variant="title" ellipsis>
                    {getPreview(item.data.content)}
                  </Text>
                  <Text variant="body" style={{ marginTop: '2px' }}>
                    {getTimeAgo(item.data.timestamp)}
                  </Text>
                </div>
              </Item>
            )}
          />
        )}
        {/* 提示信息 */}
        <Text variant="caption" style={{
          marginTop: '12px',
          textAlign: 'center'
        }}>
          ↑↓ Navigate • Enter Copy • Esc Close
        </Text>
      </div>
    </Panel>
  )
}

// ============ Extension Class ============

class ClipboardHistoryExtension implements IExtension {
  store?: IStore
  private history: ClipboardEntry[] = []
  private lastClipboard: string = ''
  private checkInterval: NodeJS.Timeout | null = null
  private readonly MAX_HISTORY = 100
  private readonly CHECK_INTERVAL_MS = 1000

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

  doAction(key: string): React.ComponentType<any> | null {
    // 检查是否是打开面板命令
    if (key === 'show-panel') {
      return ClipboardHistoryPanel
    }
    return null
  }

  // 供组件调用的公共方法
  getHistory(): ClipboardEntry[] {
    return this.history
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

  private getPreview(content: string, maxLength: number = 60): string {
    const singleLine = content.replace(/\s+/g, ' ').trim()
    if (singleLine.length <= maxLength) return singleLine
    return singleLine.substring(0, maxLength) + '...'
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
