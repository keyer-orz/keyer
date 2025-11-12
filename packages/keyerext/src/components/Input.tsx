// 使用主 App 的 React 实例，避免多实例冲突
import type * as ReactType from 'react'
const React: typeof ReactType = typeof window !== 'undefined' ? (window as any).React : require('react')
const { useRef, useEffect, useImperativeHandle, forwardRef } = React

export interface InputProps {
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
  style?: React.CSSProperties
}

export interface InputHandle {
  focus: () => void
  clear: () => void
  getValue: () => string
  isEmpty: () => boolean
}

export const Input = forwardRef<InputHandle, InputProps>(function Input({
  value,
  onChange,
  onKeyDown,
  placeholder = '',
  autoFocus = false,
  className = '',
  style = {}
}, ref) {
  const inputRef = useRef<HTMLInputElement>(null)

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
    },
    clear: () => {
      onChange('')
    },
    getValue: () => {
      return value
    },
    isEmpty: () => {
      return value.trim() === ''
    }
  }), [value, onChange])

  // 自动聚焦
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  return (
    <input
      ref={inputRef}
      type="text"
      className={`keyer-input ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      data-keyer-input="true"
      style={{
        width: '100%',
        fontSize: '16px',
        border: 'none',
        outline: 'none',
        background: 'transparent',
        color: 'var(--text-secondary)',
        fontWeight: 400,
        ...style
      }}
    />
  )
})
