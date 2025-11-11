import React, { useState, useEffect, useRef } from 'react'
import './Panel.css'
import { IListItem, IBoardItem } from 'keyerext'

// 可序列化的 Panel 配置（不包含函数）
interface SerializablePanelConfig {
  type: 'list' | 'board'
  title: string
  items: IListItem[] | IBoardItem[]
  placeholder?: string
  hasSearch?: boolean
  hasAction?: boolean
}

interface PanelProps {
  config: SerializablePanelConfig
  onClose: () => void
}

function Panel({ config, onClose }: PanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [items, setItems] = useState(config.items)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedItemRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    setItems(config.items)
    setSelectedIndex(0)
  }, [config.items])

  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'auto',
        block: 'nearest',
      })
    }
  }, [selectedIndex])

  useEffect(() => {
    const handleSearch = async () => {
      if (config.hasSearch && searchQuery) {
        // 通过 IPC 调用主进程的搜索回调
        const results = await window.electron.invoke('panel-search', searchQuery)
        setItems(results)
        setSelectedIndex(0)
      } else if (!searchQuery) {
        // 如果搜索为空，恢复原始列表
        setItems(config.items)
        setSelectedIndex(0)
      }
    }

    const debounce = setTimeout(handleSearch, 150)
    return () => clearTimeout(debounce)
  }, [searchQuery, config])

  const handleAction = async (item: IListItem | IBoardItem) => {
    if (config.hasAction) {
      // 通过 IPC 调用主进程的动作回调
      await window.electron.invoke('panel-action', item)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (items[selectedIndex]) {
        handleAction(items[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">{config.title}</div>
        <div className="panel-close" onClick={onClose}>✕</div>
      </div>

      <div className="panel-search">
        <input
          ref={inputRef}
          type="text"
          className="panel-search-input"
          placeholder={config.placeholder || 'Search...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className="panel-content">
        {config.type === 'list' && (
          <div className="panel-list">
            {(items as IListItem[]).map((item, index) => (
              <div
                key={item.id}
                ref={index === selectedIndex ? selectedItemRef : null}
                className={`list-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleAction(item)}
              >
                {item.icon && <div className="list-item-icon">{item.icon}</div>}
                <div className="list-item-content">
                  <div className="list-item-title">{item.title}</div>
                  {item.subtitle && <div className="list-item-subtitle">{item.subtitle}</div>}
                </div>
                {item.accessories && item.accessories.length > 0 && (
                  <div className="list-item-accessories">
                    {item.accessories.map((acc: string, i: number) => (
                      <span key={i} className="accessory">{acc}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {config.type === 'board' && (
          <div className="panel-board">
            {(items as IBoardItem[]).map((item, index) => (
              <div
                key={item.id}
                ref={index === selectedIndex ? selectedItemRef : null}
                className={`board-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleAction(item)}
              >
                {item.icon && <div className="board-item-icon">{item.icon}</div>}
                <div className="board-item-title">{item.title}</div>
                {item.description && <div className="board-item-description">{item.description}</div>}
                {item.metadata && Object.keys(item.metadata).length > 0 && (
                  <div className="board-item-metadata">
                    {Object.entries(item.metadata).map(([key, value]: [string, string]) => (
                      <div key={key} className="metadata-item">
                        <span className="metadata-key">{key}:</span>
                        <span className="metadata-value">{value as string}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Panel
