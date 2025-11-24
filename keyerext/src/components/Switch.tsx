import React from 'react'

export interface SwitchProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function Switch({
  checked = false,
  onChange,
  disabled = false,
  className = ''
}: SwitchProps) {
  const handleClick = () => {
    if (disabled) return
    onChange?.(!checked)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onChange?.(!checked)
    }
  }

  return (
    <div
      role="switch"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      className={`keyer-switch ${checked ? 'keyer-switch-checked' : ''} ${
        disabled ? 'keyer-switch-disabled' : ''
      } ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="keyer-switch-thumb" />
    </div>
  )
}
