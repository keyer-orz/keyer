// 使用主 App 的 React 实例，避免多实例冲突
import type * as ReactType from 'react'
const React: typeof ReactType = typeof window !== 'undefined' ? (window as any).React : require('react')
const { useState, useEffect, useRef, useCallback } = React

export interface ListItem<T = any> {
  id: string | number
  data: T
}

export interface ListProps<T = any> {
  items: ListItem<T>[]
  onSelect?: (item: ListItem<T>, index: number) => void
  onEnter?: (item: ListItem<T>, index: number) => void
  onEscape?: () => void
  renderItem: (item: ListItem<T>, index: number, isSelected: boolean) => React.ReactNode
  className?: string
  selectedClassName?: string
  autoFocus?: boolean
  initialSelectedIndex?: number
}

export function List<T = any>({
  items,
  onSelect,
  onEnter,
  onEscape,
  renderItem,
  className = '',
  selectedClassName = 'selected',
  autoFocus = true,
  initialSelectedIndex = 0
}: ListProps<T>) {
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex)
  const [isMouseActive, setIsMouseActive] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const selectedItemRef = useRef<HTMLDivElement>(null)

  // 当 items 变化时，重置选中索引
  useEffect(() => {
    if (selectedIndex >= items.length) {
      setSelectedIndex(Math.max(0, items.length - 1))
    }
  }, [items.length, selectedIndex])

  // 自动滚动到选中项
  useEffect(() => {
    if (selectedItemRef.current && !isMouseActive) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'auto',
        block: 'nearest',
      })
    }
  }, [selectedIndex, isMouseActive])

  // 选中项变化时触发回调
  useEffect(() => {
    if (onSelect && items[selectedIndex]) {
      onSelect(items[selectedIndex], selectedIndex)
    }
  }, [selectedIndex, items, onSelect])

  // 自动聚焦
  useEffect(() => {
    if (autoFocus && listRef.current) {
      listRef.current.focus()
    }
  }, [autoFocus])

  // 键盘事件处理
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIsMouseActive(false)
      setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIsMouseActive(false)
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (items[selectedIndex] && onEnter) {
        onEnter(items[selectedIndex], selectedIndex)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (onEscape) {
        onEscape()
      }
    }
  }, [items, selectedIndex, onEnter, onEscape])

  // 处理鼠标悬停
  const handleMouseEnter = useCallback((index: number) => {
    setIsMouseActive(true)
    setSelectedIndex(index)
  }, [])

  // 处理点击
  const handleClick = useCallback((item: ListItem<T>, index: number) => {
    if (onEnter) {
      onEnter(item, index)
    }
  }, [onEnter])

  if (items.length === 0) {
    return null
  }

  return (
    <div
      ref={listRef}
      className={`keyer-list ${className} ${isMouseActive ? 'mouse-active' : ''}`}
      onKeyDown={handleKeyDown}
      onMouseMove={() => setIsMouseActive(true)}
      tabIndex={0}
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          ref={index === selectedIndex ? selectedItemRef : null}
          className={`keyer-list-item ${index === selectedIndex ? selectedClassName : ''}`}
          onMouseEnter={() => handleMouseEnter(index)}
          onClick={() => handleClick(item, index)}
        >
          {renderItem(item, index, index === selectedIndex)}
        </div>
      ))}
    </div>
  )
}

// Item 组件（辅助组件，用于标准化列表项样式）
export interface ItemProps {
  icon?: React.ReactNode
  title: string
  description?: string
  badge?: string
  className?: string
  children?: React.ReactNode
}

export function Item({
  icon,
  title,
  description,
  badge,
  className = '',
  children
}: ItemProps) {
  return (
    <div className={`keyer-item ${className}`}>
      {icon && <div className="keyer-item-icon">{icon}</div>}
      <div className="keyer-item-content">
        <div className="keyer-item-header">
          <div className="keyer-item-title">{title}</div>
          {badge && <div className="keyer-item-badge">{badge}</div>}
        </div>
        {description && <div className="keyer-item-description">{description}</div>}
        {children}
      </div>
    </div>
  )
}
