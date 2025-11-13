// 使用主 App 的 React 实例，避免多实例冲突
import type * as ReactType from 'react'

// 延迟获取 React，避免在模块加载时就访问 window.React
function getReact(): typeof ReactType {
  if (typeof window !== 'undefined' && (window as any).React) {
    return (window as any).React
  }
  return require('react')
}

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
  const React = getReact()
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

  return React.createElement('input', {
    ref: inputRef,
    type: 'text',
    className: `keyer-input search-input ${className}`,
    placeholder,
    value,
    onChange: (e: any) => onChange(e.target.value),
    'data-keyer-input': 'true',
    style
  })
}

export const Input = getReact().forwardRef(InputInner)
