import React, { forwardRef, useRef, useImperativeHandle, CSSProperties } from 'react'

export interface InputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
  style?: CSSProperties
  // 焦点事件回调
  onFocus?: () => void
  onBlur?: () => void
}

export interface InputHandle {
  focus: () => void
  clear: () => void
  isFocused: () => boolean
  isEmpty: () => boolean
}

export const Input = forwardRef<InputHandle, InputProps>(({
  value,
  onChange,
  placeholder = '',
  autoFocus = false,
  className = '',
  style = {},
  onFocus,
  onBlur
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null)

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
    },
    clear: () => {
      onChange('')
    },
    isFocused: () => {
      return document.activeElement === inputRef.current
    },
    isEmpty: () => {
      return !value || value.trim() === ''
    }
  }), [value, onChange])

  return (
    <input
      ref={inputRef}
      type="text"
      className={`keyer-input search-input ${className}`}
      placeholder={placeholder}
      value={value}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      style={style}
    />
  )
})

Input.displayName = 'Input'
