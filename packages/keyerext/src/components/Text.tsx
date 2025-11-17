import React from '../utils/react'

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
  // 构建 className
  const variantClass = `keyer-text-${variant}`
  const ellipsisClass = ellipsis ? 'keyer-text-ellipsis' : ''
  const combinedClassName = [variantClass, ellipsisClass, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={combinedClassName} style={style}>
      {children}
    </div>
  )
}
