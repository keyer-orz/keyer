// 使用主 App 的 React 实例，避免多实例冲突
import type * as ReactType from 'react'

// 延迟获取 React，避免在模块加载时就访问 window.React
function getReact(): typeof ReactType {
  if (typeof window !== 'undefined' && (window as any).React) {
    return (window as any).React
  }
  return require('react')
}

export interface PanelProps {
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  padding?: string | number
}

export function Panel({
  children,
  className = '',
  style = {},
  padding = '16px'
}: PanelProps) {
  const React = getReact()

  return React.createElement(
    'div',
    {
      className: `keyer-panel ${className}`,
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding,
        boxSizing: 'border-box',
        backgroundColor: 'var(--bg-primary)',
        ...style
      }
    },
    children
  )
}
