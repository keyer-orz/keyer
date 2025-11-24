import React, { useState, useRef, useEffect } from 'react'

export interface DropdownOption<T = any> {
  label: string
  value: T
  disabled?: boolean
}

export interface DropdownProps<T = any> {
  options: DropdownOption<T>[]
  value?: T
  placeholder?: string
  onChange?: (value: T) => void
  className?: string
  disabled?: boolean
}

export function Dropdown<T = any>({
  options,
  value,
  placeholder = '请选择...',
  onChange,
  className = '',
  disabled = false
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleSelect = (option: DropdownOption<T>) => {
    if (option.disabled) return
    onChange?.(option.value)
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className={`keyer-dropdown ${className}`}>
      <button
        className={`keyer-dropdown-trigger ${disabled ? 'keyer-dropdown-disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="keyer-dropdown-value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`keyer-dropdown-arrow ${isOpen ? 'keyer-dropdown-arrow-open' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="keyer-dropdown-menu">
          {options.map((option, index) => (
            <div
              key={index}
              className={`keyer-dropdown-option ${
                option.value === value ? 'keyer-dropdown-option-selected' : ''
              } ${option.disabled ? 'keyer-dropdown-option-disabled' : ''}`}
              onClick={() => handleSelect(option)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
