import React, { useState, useEffect, useRef } from 'react'

interface ClipboardEntry {
  content: string
  timestamp: number
}

interface ClipboardHistoryPanelProps {
  history: ClipboardEntry[]
}

// 声明 window 类型
declare global {
  interface Window {
    electronAPI?: {
      hideWindow: () => Promise<void>
    }
    require?: any
  }
}

function ClipboardHistoryPanel({ history: initialHistory }: ClipboardHistoryPanelProps) {
  const [filter, setFilter] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [history, setHistory] = useState<ClipboardEntry[]>(initialHistory || [])
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // 根据过滤条件筛选历史记录
  const filteredHistory = history.filter(entry => {
    if (!filter) return true
    return entry.content.toLowerCase().includes(filter.toLowerCase())
  })

  // 当过滤条件改变时，重置选中索引
  useEffect(() => {
    setSelectedIndex(0)
  }, [filter])

  // 自动聚焦输入框
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, filteredHistory.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredHistory[selectedIndex]) {
        copyToClipboard(selectedIndex)
      }
    }  
  }

  // 复制到剪贴板
  const copyToClipboard = (index: number) => {
    const entry = filteredHistory[index]
    if (!entry) return

    // 直接使用 electron 的 clipboard API
    if (window.require) {
      const { clipboard } = window.require('electron')
      clipboard.writeText(entry.content)
      console.log('Copied to clipboard:', entry.content.substring(0, 50))

      // 关闭窗口
      window.electronAPI?.hideWindow()
    }
  }

  // 点击列表项
  const handleItemClick = (index: number) => {
    setSelectedIndex(index)
    copyToClipboard(index)
  }

  // 滚动选中项到可见区域
  useEffect(() => {
    const selectedElement = listRef.current?.children[selectedIndex] as HTMLElement
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIndex])

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
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      {/* 搜索框 */}
      <div style={{ marginBottom: '12px' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Filter clipboard history..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* 历史记录列表 */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          border: '1px solid #ddd',
          borderRadius: '6px'
        }}
      >
        {filteredHistory.length === 0 ? (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            color: '#999'
          }}>
            {filter ? 'No matching items' : 'No clipboard history yet'}
          </div>
        ) : (
          filteredHistory.map((entry, index) => (
            <div
              key={index}
              onClick={() => handleItemClick(index)}
              style={{
                padding: '12px',
                borderBottom: index < filteredHistory.length - 1 ? '1px solid #eee' : 'none',
                backgroundColor: index === selectedIndex ? '#e3f2fd' : 'transparent',
                cursor: 'pointer',
                transition: 'background-color 0.1s'
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div style={{
                fontSize: '14px',
                marginBottom: '4px',
                wordBreak: 'break-word'
              }}>
                {getPreview(entry.content)}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#999'
              }}>
                {getTimeAgo(entry.timestamp)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 提示信息 */}
      <div style={{
        marginTop: '12px',
        fontSize: '12px',
        color: '#999',
        textAlign: 'center'
      }}>
        ↑↓ Navigate • Enter Copy • Esc Close
      </div>
    </div>
  )
}

// 导出所有组件（与系统期望的格式一致）
export default {
  ClipboardHistoryPanel
}
