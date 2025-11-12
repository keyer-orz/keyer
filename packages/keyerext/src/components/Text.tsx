// 使用主 App 的 React 实例，避免多实例冲突
import type * as ReactType from 'react'

// 延迟获取 React，避免在模块加载时就访问 window.React
function getReact(): typeof ReactType {
  if (typeof window !== 'undefined' && (window as any).React) {
    return (window as any).React
  }
  return require('react')
}

export type TextVariant = 'title' | 'body' | 'caption' | 'input' | 'label'

export interface TextProps {
  variant?: TextVariant
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  ellipsis?: boolean  // 是否启用文字省略
}

export function Text({
  variant = 'body',
  className = '',
  style = {},
  children,
  ellipsis = false
}: TextProps) {
  const React = getReact()

  // 构建 className
  const variantClass = `keyer-text-${variant}`
  const ellipsisClass = ellipsis ? 'keyer-text-ellipsis' : ''
  const combinedClassName = [variantClass, ellipsisClass, className]
    .filter(Boolean)
    .join(' ')

  return React.createElement(
    'div',
    { className: combinedClassName, style },
    children
  )
}
