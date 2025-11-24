import React from 'react'

export interface RadioOption<T = any> {
  label: string
  value: T
  disabled?: boolean
}

export interface RadioGroupProps<T = any> {
  options: RadioOption<T>[]
  value?: T
  onChange?: (value: T) => void
  disabled?: boolean
  className?: string
}

export function RadioGroup<T = any>({
  options,
  value,
  onChange,
  disabled = false,
  className = ''
}: RadioGroupProps<T>) {
  const handleSelect = (option: RadioOption<T>) => {
    if (disabled || option.disabled) return
    onChange?.(option.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent, option: RadioOption<T>) => {
    if (disabled || option.disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onChange?.(option.value)
    }
  }

  return (
    <div className={`keyer-radio-group ${className}`}>
      {options.map((option, index) => {
        const isChecked = option.value === value
        const isDisabled = disabled || option.disabled

        return (
          <div
            key={index}
            role="radio"
            aria-checked={isChecked}
            tabIndex={isDisabled ? -1 : 0}
            className={`keyer-radio ${isChecked ? 'keyer-radio-checked' : ''} ${
              isDisabled ? 'keyer-radio-disabled' : ''
            }`}
            onClick={() => handleSelect(option)}
            onKeyDown={(e) => handleKeyDown(e, option)}
          >
            <div className="keyer-radio-circle">
              {isChecked && <div className="keyer-radio-inner" />}
            </div>
            <span className="keyer-radio-label">{option.label}</span>
          </div>
        )
      })}
    </div>
  )
}
