import React from 'react'

export interface StackProps {
  children: React.ReactNode
  spacing?: number
  className?: string
  style?: React.CSSProperties
}

export function HStack({ children, spacing = 8, className = '', style = {} }: StackProps) {
  return (
    <div
      className={`keyer-hstack ${className}`}
      style={{ gap: `${spacing}px`, ...style }}
    >
      {children}
    </div>
  )
}

export function VStack({ children, spacing = 8, className = '', style = {} }: StackProps) {
  return (
    <div
      className={`keyer-vstack ${className}`}
      style={{ gap: `${spacing}px`, ...style }}
    >
      {children}
    </div>
  )
}
