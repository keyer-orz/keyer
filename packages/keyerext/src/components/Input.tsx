import React from '../utils/react'

export interface InputProps {
  value: string
  onChange: (value: string) => void
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

function InputInner({
  value,
  onChange,
  placeholder = '',
  autoFocus = false,
  className = '',
  style = {}
}: InputProps, ref: React.Ref<InputHandle>) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  // 暴露方法给父组件
  React.useImperativeHandle(ref, () => ({
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
  React.useEffect(() => {
    if (autoFocus && inputRef.current) {
      // 使用 setTimeout 确保在组件完全渲染后聚焦
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
      return () => clearTimeout(timer)
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
      style={style}
    />
  )
}

export const Input = React.forwardRef(InputInner)
