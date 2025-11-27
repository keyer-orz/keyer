import React from 'react'

export interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: 'default' | 'primary' | 'danger'
  size?: 'normal' | 'small'
  disabled?: boolean
  className?: string
}

export function Button({
  children,
  onClick,
  type = 'default',
  size = 'normal',
  disabled = false,
  className = ''
}: ButtonProps) {
  const typeClass = `keyer-button-${type}`
  const sizeClass = size === 'normal' ? 'keyer-button-normal' : 'keyer-button-small'
  const disabledClass = disabled ? 'keyer-button-disabled' : ''

  return (
    <button
      className={`keyer-button ${typeClass} ${sizeClass} ${disabledClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
