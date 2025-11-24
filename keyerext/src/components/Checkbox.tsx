import React from 'react'

export interface CheckboxProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  label?: string
  disabled?: boolean
  indeterminate?: boolean
  className?: string
}

export function Checkbox({
  checked = false,
  onChange,
  label,
  disabled = false,
  indeterminate = false,
  className = ''
}: CheckboxProps) {
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
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      tabIndex={disabled ? -1 : 0}
      className={`keyer-checkbox ${checked ? 'keyer-checkbox-checked' : ''} ${
        indeterminate ? 'keyer-checkbox-indeterminate' : ''
      } ${disabled ? 'keyer-checkbox-disabled' : ''} ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="keyer-checkbox-box">
        {indeterminate ? (
          <svg className="keyer-checkbox-icon" viewBox="0 0 16 16" fill="none">
            <line x1="4" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : checked ? (
          <svg className="keyer-checkbox-icon" viewBox="0 0 16 16" fill="none">
            <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </div>
      {label && <span className="keyer-checkbox-label">{label}</span>}
    </div>
  )
}

export interface CheckboxGroupProps {
  options: Array<{ label: string; value: string; disabled?: boolean }>
  value?: string[]
  onChange?: (value: string[]) => void
  disabled?: boolean
  className?: string
}

export function CheckboxGroup({
  options,
  value = [],
  onChange,
  disabled = false,
  className = ''
}: CheckboxGroupProps) {
  const handleChange = (optionValue: string, checked: boolean) => {
    if (disabled) return

    const newValue = checked
      ? [...value, optionValue]
      : value.filter(v => v !== optionValue)

    onChange?.(newValue)
  }

  return (
    <div className={`keyer-checkbox-group ${className}`}>
      {options.map((option, index) => (
        <Checkbox
          key={index}
          checked={value.includes(option.value)}
          onChange={(checked) => handleChange(option.value, checked)}
          label={option.label}
          disabled={disabled || option.disabled}
        />
      ))}
    </div>
  )
}
