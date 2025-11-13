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

export interface ListSection<T = any> {
  header: string
  items: ListItem<T>[]
}

export interface ListProps<T = any> {
  sections: ListSection<T>[]
  onSelect?: (item: ListItem<T>) => void
  onEnter?: (item: ListItem<T>) => void
  renderItem: (item: ListItem<T>, isSelected: boolean) => React.ReactNode
  renderHeader?: (header: string) => React.ReactNode
  className?: string
  selectedClassName?: string
  initialSelectedIndex?: number
  autoHide?: boolean  // 回车后自动隐藏窗口，默认 true
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
  sections = [],
  onSelect,
  onEnter,
  renderItem,
  renderHeader,
  className = 'results-list',
  selectedClassName = 'selected',
  initialSelectedIndex = 0,
  autoHide = true
}: ListProps<T>, ref: React.Ref<ListHandle>) {
  const React = getReact()
  const [selectedIndex, setSelectedIndex] = React.useState(initialSelectedIndex)
  const listRef = React.useRef<HTMLDivElement>(null)
  const selectedItemRef = React.useRef<HTMLDivElement>(null)

  // 扁平化所有 items，用于索引计算
  const allItems = React.useMemo(() => {
    return sections.flatMap(section => section.items)
  }, [sections])

  // 当 items 变化时，重置选中索引
  React.useEffect(() => {
    if (allItems.length > 0 && selectedIndex >= allItems.length) {
      setSelectedIndex(Math.max(0, allItems.length - 1))
    } else if (allItems.length === 0) {
      setSelectedIndex(0)
    }
  }, [allItems.length])

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
    if (onSelect && allItems[selectedIndex]) {
      onSelect(allItems[selectedIndex])
    }
  }, [selectedIndex, allItems, onSelect])

  // 监听全局键盘事件
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (listRef.current) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, allItems.length - 1))
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
        } else if (e.key === 'Enter') {
          e.preventDefault()
          if (allItems[selectedIndex] && onEnter) {
            onEnter(allItems[selectedIndex])

            // 如果 autoHide 为 true，回调执行后隐藏窗口
            if (autoHide && typeof window !== 'undefined' && (window as any).require) {
              const { ipcRenderer } = (window as any).require('electron')
              ipcRenderer.invoke('hide-window')
            }
          }
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [allItems.length, selectedIndex, onEnter, autoHide])

  // 处理点击
  const handleClick = React.useCallback((item: ListItem<T>, itemIndex: number) => {
    setSelectedIndex(itemIndex)
    if (onEnter) {
      onEnter(item)
    }
  }, [onEnter])

  // 默认的 header 渲染函数
  const defaultRenderHeader = (header: string) => {
    return React.createElement('div', { className: 'section-header' }, header)
  }

  const headerRenderer = renderHeader || defaultRenderHeader

  if (allItems.length === 0) {
    return null
  }

  // 渲染所有 sections
  let currentItemIndex = 0
  return React.createElement(
    'div',
    {
      ref: listRef,
      className: `keyer-list ${className}`,
      tabIndex: 0,
      'data-keyer-list': 'true'
    },
    sections.map((section, sectionIndex) => {
      const sectionStartIndex = currentItemIndex
      const sectionItems = section.items.map((item, localIndex) => {
        const globalIndex = sectionStartIndex + localIndex
        const isSelected = globalIndex === selectedIndex

        return React.createElement(
          'div',
          {
            key: item.id,
            ref: isSelected ? selectedItemRef : null,
            className: `keyer-list-item ${isSelected ? selectedClassName : ''}`,
            onClick: () => handleClick(item, globalIndex)
          },
          renderItem(item, isSelected)
        )
      })

      currentItemIndex += section.items.length

      return React.createElement(
        React.Fragment,
        { key: `section-${sectionIndex}` },
        headerRenderer(section.header),
        ...sectionItems
      )
    })
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
}: ItemProps): React.ReactElement {
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
