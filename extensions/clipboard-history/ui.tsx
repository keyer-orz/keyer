// 使用主 App 的 React 实例，避免多实例冲突
import type * as ReactType from 'react'
const React: typeof ReactType = (window as any).React
const { useState, useEffect, useMemo } = React

import { List, Item, Input, Panel, Text } from 'keyerext'
import type { ListItem, ListSection } from 'keyerext'

export type ClipboardEntryType = 'text' | 'image'

export interface ClipboardEntry {
  content: string  // 对于文本是内容，对于图片是 base64 data URL
  type: ClipboardEntryType
  timestamp: number
  // 图片特有属性
  width?: number
  height?: number
}

export interface ClipboardHistoryPanelProps {
  history: ClipboardEntry[]
  onCopy: (entry: ClipboardEntry) => void
}

export function ClipboardHistoryPanel({ history, onCopy }: ClipboardHistoryPanelProps) {
  const [filter, setFilter] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<ClipboardEntry | null>(
    history.length > 0 ? history[0] : null
  )

  // 根据过滤条件筛选历史记录（仅文本可过滤）
  const filteredHistory = useMemo(() => {
    return history.filter(entry => {
      if (!filter) return true
      if (entry.type === 'text') {
        return entry.content.toLowerCase().includes(filter.toLowerCase())
      }
      return false  // 图片不参与过滤
    })
  }, [history, filter])

  // 构建 Section 列表
  const sections = useMemo(() => {
    if (filteredHistory.length === 0) return []
    return [{
      header: 'Clipboard History',
      items: filteredHistory.map(entry => ({
        id: entry.timestamp,
        data: entry
      }))
    }]
  }, [filteredHistory])

  // 复制到剪贴板
  const handleCopy = (item: ListItem<ClipboardEntry>) => {
    onCopy(item.data)
  }

  // 选中项变化
  const handleSelect = (item: ListItem<ClipboardEntry>) => {
    setSelectedEntry(item.data)
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

  // 获取文本预览
  const getTextPreview = (content: string, maxLength: number = 60): string => {
    const singleLine = content.replace(/\s+/g, ' ').trim()
    if (singleLine.length <= maxLength) return singleLine
    return singleLine.substring(0, maxLength) + '...'
  }

  // 获取类型标签
  const getTypeLabel = (entry: ClipboardEntry): string => {
    if (entry.type === 'text') {
      return 'Text'
    } else {
      return `Image (${entry.width || 0} x ${entry.height || 0})`
    }
  }

  // 获取图标
  const getIcon = (entry: ClipboardEntry): string => {
    return entry.type === 'text' ? '📝' : '🖼️'
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

      {/* 左右分栏布局 */}
      <div style={{
        display: 'flex',
        gap: '0',
        height: 'calc(100% - 60px)',
        padding: '0 12px 12px 12px'
      }}>
        {/* 左侧列表 */}
        <div style={{
          flex: '0 0 400px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {sections.length === 0 ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--text-tertiary)'
            }}>
              {filter ? 'No matching items' : 'No clipboard history yet'}
            </div>
          ) : (
            <List
              sections={sections}
              onEnter={handleCopy}
              onSelect={handleSelect}
              renderItem={(item, isSelected) => (
                <Item>
                  <div style={{ fontSize: '20px', flexShrink: 0 }}>
                    {getIcon(item.data)}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                    <Text variant="title" ellipsis>
                      {item.data.type === 'text'
                        ? getTextPreview(item.data.content)
                        : getTypeLabel(item.data)
                      }
                    </Text>
                    <Text variant="body" style={{ marginTop: '2px' }}>
                      {getTimeAgo(item.data.timestamp)}
                    </Text>
                  </div>
                </Item>
              )}
            />
          )}
        </div>

        {/* 分隔线 */}
        <div style={{
          width: '1px',
          backgroundColor: 'var(--border-color, #e0e0e0)',
          margin: '0 2px 12px'
        }} />

        {/* 右侧预览 */}
        <div style={{
          flex: 1,
          padding: '12px',
          overflow: 'auto'
        }}>
          {selectedEntry ? (
            selectedEntry.type === 'text' ? (
              <div style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: '14px',
                lineHeight: '1.6',
                color: 'var(--text-primary)'
              }}>
                {selectedEntry.content}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}>
                <img
                  src={selectedEntry.content}
                  alt="Clipboard"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '4px'
                  }}
                />
                <Text variant="caption" style={{ marginTop: '12px' }}>
                  {selectedEntry.width} x {selectedEntry.height}
                </Text>
              </div>
            )
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--text-tertiary)'
            }}>
              No item selected
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}
