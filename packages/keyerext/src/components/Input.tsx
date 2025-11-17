import React from '../utils/react'

export interface InputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
  style?: React.CSSProperties
  // 焦点事件回调
  onFocus?: () => void
  onBlur?: () => void
}

export function Input({
  value,
  onChange,
  placeholder = '',
  autoFocus = false,
  className = '',
  style = {},
  onFocus,
  onBlur
}: InputProps) {
  const inputRef = React.useRef(null as HTMLInputElement | null)

  // 自动聚焦（响应 autoFocus 变化）
  React.useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  return (
    <input
      ref={inputRef}
      type="text"
      className={`keyer-input search-input ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      style={style}
    />
  )
}
