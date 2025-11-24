import React, { useState, useEffect, useCallback } from 'react'

export interface ListItem {
  id: string
  content: React.ReactNode
}

export interface ListGroup {
  title?: string
  items: ListItem[]
}

export interface ListProps {
  groups: ListGroup[]
  selectedId?: string
  onSelect?: (id: string) => void
  onDoubleClick?: (id: string) => void
  className?: string
}

export function List({ groups, selectedId, onSelect, onDoubleClick, className = '' }: ListProps) {
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [internalSelectedId, setInternalSelectedId] = useState<string | undefined>(selectedId)

  // 获取所有项的扁平列表
  const allItems = groups.flatMap(group => group.items)
  const currentSelectedId = selectedId !== undefined ? selectedId : internalSelectedId

  useEffect(() => {
    if (selectedId !== undefined) {
      setInternalSelectedId(selectedId)
    }
  }, [selectedId])

  const handleSelect = useCallback((id: string) => {
    setInternalSelectedId(id)
    onSelect?.(id)
  }, [onSelect])

  const handleDoubleClick = useCallback((id: string) => {
    onDoubleClick?.(id)
  }, [onDoubleClick])

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()

        const currentIndex = allItems.findIndex(item => item.id === currentSelectedId)
        let nextIndex: number

        if (e.key === 'ArrowUp') {
          nextIndex = currentIndex <= 0 ? allItems.length - 1 : currentIndex - 1
        } else {
          nextIndex = currentIndex >= allItems.length - 1 ? 0 : currentIndex + 1
        }

        const nextItem = allItems[nextIndex]
        if (nextItem) {
          handleSelect(nextItem.id)
        }
      } else if (e.key === 'Enter' && currentSelectedId) {
        handleDoubleClick(currentSelectedId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [allItems, currentSelectedId, handleSelect, handleDoubleClick])

  return (
    <div className={`keyer-list ${className}`}>
      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="keyer-list-group">
          {group.title && (
            <div className="keyer-list-group-title">{group.title}</div>
          )}
          {group.items.map(item => {
            const isSelected = item.id === currentSelectedId
            const isHovered = item.id === hoverId

            return (
              <div
                key={item.id}
                className={`keyer-list-item ${isSelected ? 'keyer-list-item-selected' : ''}`}
                onClick={() => handleSelect(item.id)}
                onDoubleClick={() => handleDoubleClick(item.id)}
                onMouseEnter={() => setHoverId(item.id)}
                onMouseLeave={() => setHoverId(null)}
              >
                {item.content}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
