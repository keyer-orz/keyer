import React, { useRef, useImperativeHandle, forwardRef } from 'react'

export interface InputProps {
  value?: string
  placeholder?: string
  onChange?: (value: string) => void
  autoFocus?: boolean
  className?: string
}

export interface InputRef {
  focus: () => void
  blur: () => void
  clear: () => void
  isEmpty: () => boolean
  isFocused: () => boolean
}

export const Input = forwardRef<InputRef, InputProps>(({
  value,
  placeholder,
  onChange,
  autoFocus = false,
  className = ''
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
    },
    blur: () => {
      inputRef.current?.blur()
    },
    clear: () => {
      if (inputRef.current) {
        inputRef.current.value = ''
        onChange?.('')
      }
    },
    isEmpty: () => {
      return !value || value.trim().length === 0
    },
    isFocused: () => {
      return document.activeElement === inputRef.current
    }
  }))


  return (
    <input
      ref={inputRef}
      type="text"
      className={`keyer-input ${className}`}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      autoFocus={autoFocus}
    />
  )
})
