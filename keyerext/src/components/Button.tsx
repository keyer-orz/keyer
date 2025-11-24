import React from 'react'

export interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'solid' | 'outline'
  size?: 'normal' | 'small'
  disabled?: boolean
  className?: string
}

export function Button({
  children,
  onClick,
  variant = 'solid',
  size = 'normal',
  disabled = false,
  className = ''
}: ButtonProps) {
  const variantClass = variant === 'solid' ? 'keyer-button-solid' : 'keyer-button-outline'
  const sizeClass = size === 'normal' ? 'keyer-button-normal' : 'keyer-button-small'
  const disabledClass = disabled ? 'keyer-button-disabled' : ''

  return (
    <button
      className={`keyer-button ${variantClass} ${sizeClass} ${disabledClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
