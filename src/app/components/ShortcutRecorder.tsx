import React, { useState, useEffect } from 'react'

export interface ShortcutRecorderProps {
  value: string
  onChange: (shortcut: string) => void
  onValidate?: (shortcut: string) => Promise<boolean>
  placeholder?: string
  disabled?: boolean
  style?: React.CSSProperties
}

/**
 * 快捷键录制组件
 * 自动捕获键盘输入并转换为快捷键格式（如 Shift+Space, Ctrl+Alt+K）
 */
export function ShortcutRecorder({
  value,
  onChange,
  onValidate,
  placeholder = 'Press keys to record shortcut',
  disabled = false,
  style
}: ShortcutRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState(false)
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    setDisplayValue(value)
  }, [value])

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    e.preventDefault()
    e.stopPropagation()

    // 忽略单独的修饰键
    if (['Control', 'Shift', 'Alt', 'Meta', 'Command'].includes(e.key)) {
      return
    }

    // 构建修饰键数组
    const modifiers: string[] = []
    if (e.ctrlKey || e.metaKey) modifiers.push(e.ctrlKey ? 'Ctrl' : 'Command')
    if (e.shiftKey) modifiers.push('Shift')
    if (e.altKey) modifiers.push('Alt')

    // 处理按键名称
    let key = e.key
    if (key === ' ') key = 'Space'
    else if (key.length === 1) key = key.toUpperCase()

    // 组合快捷键
    const shortcut = [...modifiers, key].join('+')
    setDisplayValue(shortcut)

    // 验证快捷键
    if (onValidate) {
      try {
        const isValid = await onValidate(shortcut)
        if (isValid) {
          onChange(shortcut)
          setError(false)
        } else {
          setError(true)
          // 2秒后恢复原值
          setTimeout(() => {
            setDisplayValue(value)
            setError(false)
          }, 2000)
        }
      } catch (err) {
        console.error('Shortcut validation error:', err)
        setError(true)
        setTimeout(() => {
          setDisplayValue(value)
          setError(false)
        }, 2000)
      }
    } else {
      // 无需验证,直接更新
      onChange(shortcut)
      setError(false)
    }

    setIsRecording(false)
  }

  const handleFocus = () => {
    setIsRecording(true)
  }

  const handleBlur = () => {
    setIsRecording(false)
    if (error) {
      setDisplayValue(value)
      setError(false)
    }
  }

  return (
    <div style={style}>
      <input
        type="text"
        value={displayValue}
        placeholder={error ? '❌ Failed to register' : isRecording ? '⌨️ Recording...' : placeholder}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        readOnly
        style={{
          width: '80%',
          padding: '8px 12px',
          fontSize: '14px',
          color: 'var(--color-title)',
          backgroundColor: 'var(--color-input-bg)',
          border: `1px solid ${error ? 'var(--color-error, #ff4444)' : 'var(--color-border)'}`,
          borderRadius: '4px',
          outline: 'none',
          transition: 'border-color 0.2s',
          cursor: disabled ? 'not-allowed' : 'text',
          opacity: disabled ? 0.5 : 1,
          ...style
        }}
        onMouseEnter={(e) => {
          if (!disabled && !error) {
            e.currentTarget.style.borderColor = 'var(--color-title)'
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !error) {
            e.currentTarget.style.borderColor = 'var(--color-border)'
          }
        }}
      />
    </div>
  )
}
