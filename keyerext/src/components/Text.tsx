import React from 'react'

export interface TextProps {
  children: React.ReactNode
  color?: 'title' | 'subtitle'
  size?: 'large' | 'medium' | 'small'
  className?: string
  style?: React.CSSProperties
}

export function Text({ children, color = 'title', size = 'medium', className = '', style }: TextProps) {
  const classes = [
    'keyer-text',
    `keyer-text-${color}`,
    `keyer-text-${size}`,
    className
  ].filter(Boolean).join(' ')

  return <span className={classes} style={style}>{children}</span>
}
