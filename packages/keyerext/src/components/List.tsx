// 使用主 App 的 React 实例，避免多实例冲突
import type * as ReactType from 'react'

// 延迟获取 React，避免在模块加载时就访问 window.React
function getReact(): typeof ReactType {
  if (typeof window !== 'undefined' && (window as any).React) {
    return (window as any).React
  }
  return require('react')
}

export interface ListItem<T = any> {
  id: string | number
  data: T
}

export interface ListProps<T = any> {
  items: ListItem<T>[]
  onSelect?: (item: ListItem<T>, index: number) => void
  onEnter?: (item: ListItem<T>, index: number) => void
  renderItem: (item: ListItem<T>, index: number, isSelected: boolean) => React.ReactNode
  className?: string
  selectedClassName?: string
  autoFocus?: boolean
  initialSelectedIndex?: number
}

export interface ListHandle {
  focus: () => void
  selectNext: () => void
  selectPrev: () => void
  enter: () => void
  getSelectedIndex: () => number
  getSelectedItem: () => any
}

function ListInner<T = any>({
  items,
  onSelect,
  onEnter,
  renderItem,
  className = 'results-list',
  selectedClassName = 'selected',
  autoFocus = true,
  initialSelectedIndex = 0
}: ListProps<T>, ref: React.Ref<ListHandle>) {
  const React = getReact()
  const [selectedIndex, setSelectedIndex] = React.useState(initialSelectedIndex)
  const listRef = React.useRef<HTMLDivElement>(null)
  const selectedItemRef = React.useRef<HTMLDivElement>(null)

  // 当 items 变化时，重置选中索引
  React.useEffect(() => {
    if (items.length > 0 && selectedIndex >= items.length) {
      setSelectedIndex(Math.max(0, items.length - 1))
    } else if (items.length === 0) {
      setSelectedIndex(0)
    }
  }, [items.length])

  // 自动滚动到选中项
  React.useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'auto',
        block: 'nearest',
      })
    }
  }, [selectedIndex])

  // 选中项变化时触发回调
  React.useEffect(() => {
    if (onSelect && items[selectedIndex]) {
      onSelect(items[selectedIndex], selectedIndex)
    }
  }, [selectedIndex, items, onSelect])

  // 自动聚焦
  React.useEffect(() => {
    if (autoFocus && listRef.current) {
      listRef.current.focus()
    }
  }, [autoFocus])
  // 监听全局键盘事件（当 List 没有焦点时也能响应）
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 只要 List 元素存在就处理（不管焦点在哪里）
      if (listRef.current) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1))
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
        } else if (e.key === 'Enter') {
          e.preventDefault()
          if (items[selectedIndex] && onEnter) {
            onEnter(items[selectedIndex], selectedIndex)
          }
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [items.length, selectedIndex, onEnter])

  // 处理点击
  const handleClick = React.useCallback((item: ListItem<T>, index: number) => {
    setSelectedIndex(index)
    if (onEnter) {
      onEnter(item, index)
    }
  }, [onEnter])

  if (items.length === 0) {
    return null
  }

  return React.createElement(
    'div',
    {
      ref: listRef,
      className: `keyer-list ${className}`,
      tabIndex: 0,
      'data-keyer-list': 'true'
    },
    items.map((item, index) =>
      React.createElement(
        'div',
        {
          key: item.id,
          ref: index === selectedIndex ? selectedItemRef : null,
          className: `keyer-list-item ${index === selectedIndex ? selectedClassName : ''}`,
          onClick: () => handleClick(item, index)
        },
        renderItem(item, index, index === selectedIndex)
      )
    )
  )
}

// 使用 forwardRef 包装
export const List = getReact().forwardRef(ListInner) as <T = any>(
  props: ListProps<T> & { ref?: React.Ref<ListHandle> }
) => ReturnType<typeof ListInner>

// Item 组件（纯容器组件，外部自定义内容）
export interface ItemProps {
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

export function Item({
  className = '',
  style = {},
  children
}: ItemProps) {
  const React = getReact()

  // 默认样式
  const defaultStyle: React.CSSProperties = {
    padding: '4px 6px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minHeight: '32px'
  }

  // 合并默认样式和用户传入的样式
  const mergedStyle = { ...defaultStyle, ...style }

  return React.createElement(
    'div',
    { className: `keyer-item ${className}`, style: mergedStyle },
    children
  )
}
