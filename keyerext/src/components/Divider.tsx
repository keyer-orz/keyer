import React from 'react'

export interface DividerProps {
  vertical?: boolean
  className?: string
}

export function Divider({ vertical = false, className = '' }: DividerProps) {
  return (
    <hr className={`${vertical ? 'keyer-divider-vertical' : 'keyer-divider'} ${className}`} />
  )
}
