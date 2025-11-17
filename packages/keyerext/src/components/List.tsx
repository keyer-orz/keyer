import React from '../utils/react'

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
  onSelect?: (item: ListItem<T>, index: number) => void
  onEnter?: (item: ListItem<T>) => void
  renderItem: (item: ListItem<T>, isSelected: boolean) => React.ReactNode
  renderHeader?: (header: string) => React.ReactNode
  className?: string
  selectedClassName?: string
  initialSelectedIndex?: number
}

export function List<T = any>({
  sections = [],
  onSelect,
  onEnter,
  renderItem,
  renderHeader,
  className = 'results-list',
  selectedClassName = 'selected',
  initialSelectedIndex = 0
}: ListProps<T>) {
  const [selectedIndex, setSelectedIndex] = React.useState(initialSelectedIndex)
  const listRef = React.useRef(null as HTMLDivElement | null)
  const selectedItemRef = React.useRef(null as HTMLDivElement | null)

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
      onSelect(allItems[selectedIndex], selectedIndex)
    }
  }, [selectedIndex, allItems, onSelect])

  // 监听全局键盘事件
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (listRef.current) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex((prev: number) => Math.min(prev + 1, allItems.length - 1))
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex((prev: number) => Math.max(prev - 1, 0))
        } else if (e.key === 'Enter') {
          e.preventDefault()
          if (allItems[selectedIndex] && onEnter) {
            onEnter(allItems[selectedIndex])
          }
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [allItems.length, selectedIndex, onEnter])

  // 处理点击
  const handleClick = React.useCallback((item: ListItem<T>, itemIndex: number) => {
    setSelectedIndex(itemIndex)
    if (onEnter) {
      onEnter(item)
    }
  }, [onEnter])

  // 默认的 header 渲染函数
  const defaultRenderHeader = (header: string) => {
    return <div className="section-header">{header}</div>
  }

  const headerRenderer = renderHeader || defaultRenderHeader

  if (allItems.length === 0) {
    return null
  }

  // 渲染所有 sections
  let currentItemIndex = 0
  return (
    <div
      ref={listRef}
      className={`keyer-list ${className}`}
      tabIndex={0}
      data-keyer-list="true"
    >
      {sections.map((section, sectionIndex) => {
        const sectionStartIndex = currentItemIndex
        const sectionItems = section.items.map((item, localIndex) => {
          const globalIndex = sectionStartIndex + localIndex
          const isSelected = globalIndex === selectedIndex

          return (
            <div
              key={item.id}
              ref={isSelected ? selectedItemRef : null}
              className={`keyer-list-item ${isSelected ? selectedClassName : ''}`}
              onClick={() => handleClick(item, globalIndex)}
            >
              {renderItem(item, isSelected)}
            </div>
          )
        })

        currentItemIndex += section.items.length

        return (
          <React.Fragment key={`section-${sectionIndex}`}>
            {headerRenderer(section.header)}
            {sectionItems}
          </React.Fragment>
        )
      })}
    </div>
  )
}

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
  // 默认样式
  const defaultStyle: React.CSSProperties = {
    padding: '4px 6px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    minHeight: '32px'
  }

  // 合并默认样式和用户传入的样式
  const mergedStyle = { ...defaultStyle, ...style }

  return (
    <div className={`keyer-item ${className}`} style={mergedStyle}>
      {children}
    </div>
  )
}
