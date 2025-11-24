import React from 'react'

export interface InputProps {
  value?: string
  placeholder?: string
  onChange?: (value: string) => void
  onEnter?: (value: string) => void
  autoFocus?: boolean
  className?: string
}

export function Input({
  value,
  placeholder,
  onChange,
  onEnter,
  autoFocus = false,
  className = ''
}: InputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onEnter) {
      onEnter(e.currentTarget.value)
    }
  }

  return (
    <input
      type="text"
      className={`keyer-input ${className}`}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      onKeyDown={handleKeyDown}
      autoFocus={autoFocus}
    />
  )
}
