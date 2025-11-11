import React, { useState, useEffect, useRef } from 'react'
import './Panel.css'
import { IListItem, IBoardItem, IPanelConfig } from 'keyerext'

interface PanelProps {
  config: IPanelConfig
  onClose: () => void
  onAction: (item: IListItem | IBoardItem) => void
}

function Panel({ config, onClose, onAction }: PanelProps) {
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
      if (config.onSearch) {
        const results = await config.onSearch(searchQuery)
        setItems(results)
        setSelectedIndex(0)
      }
    }

    const debounce = setTimeout(handleSearch, 150)
    return () => clearTimeout(debounce)
  }, [searchQuery, config])

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
        onAction(items[selectedIndex])
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
                onClick={() => onAction(item)}
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
                onClick={() => onAction(item)}
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
