import React from '../utils/react'

export interface PanelProps {
  children?: React.ReactNode
  direction?: 'horizontal' | 'vertical'
}

export function Panel({
  children,
  direction = 'vertical'
}: PanelProps) {
  return (
    <div className={`keyer-panel keyer-panel-${direction}`}>
      {children}
    </div>
  )
}
