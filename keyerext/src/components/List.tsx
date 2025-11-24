import React, { useState, useEffect, useCallback } from 'react'

export interface ListItem<T = any> {
  id: string
  data: T
}

export interface ListGroup<T = any> {
  title?: string
  items: ListItem<T>[]
}

export interface ListProps<T = any> {
  groups: ListGroup<T>[]
  selectedId?: string
  onSelect?: (id: string, data: T) => void
  onDoubleClick?: (id: string, data: T) => void
  renderItem: (item: ListItem<T>, isSelected: boolean, isHovered: boolean) => React.ReactNode
  className?: string
}

export function List<T = any>({ groups, selectedId, onSelect, onDoubleClick, renderItem, className = '' }: ListProps<T>) {
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

  const handleSelect = useCallback((id: string, data: T) => {
    setInternalSelectedId(id)
    onSelect?.(id, data)
  }, [onSelect])

  const handleDoubleClick = useCallback((id: string, data: T) => {
    onDoubleClick?.(id, data)
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
          handleSelect(nextItem.id, nextItem.data)
        }
      } else if (e.key === 'Enter' && currentSelectedId) {
        const currentItem = allItems.find(item => item.id === currentSelectedId)
        if (currentItem) {
          handleDoubleClick(currentSelectedId, currentItem.data)
        }
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
                onClick={() => handleSelect(item.id, item.data)}
                onDoubleClick={() => handleDoubleClick(item.id, item.data)}
                onMouseEnter={() => setHoverId(item.id)}
                onMouseLeave={() => setHoverId(null)}
              >
                {renderItem(item, isSelected, isHovered)}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
