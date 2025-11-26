import React, { useState, useEffect } from 'react'

export interface ShortcutRecorderProps {
  value: string
  onChange: (shortcut: string) => void
  onValidate?: (shortcut: string) => Promise<boolean>
  placeholder?: string
  disabled?: boolean
  style?: React.CSSProperties
  defaultHint?: string
  showClearButton?: boolean
}

// 检测操作系统
const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

/**
 * 快捷键录制组件
 * 自动捕获键盘输入并转换为快捷键格式（如 Shift+Space, Ctrl+Alt+K）
 * 兼容 Windows 和 Mac
 */
export function ShortcutRecorder({
  value,
  onChange,
  onValidate,
  placeholder = 'Click to record shortcut',
  disabled = false,
  style,
  defaultHint = isMac ? 'e.g., Command+Shift+Space' : 'e.g., Ctrl+Shift+Space',
  showClearButton = true
}: ShortcutRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState(false)
  const [displayValue, setDisplayValue] = useState(value)
  const [pressingKeys, setPressingKeys] = useState<string[]>([]) // 实时按键展示

  useEffect(() => {
    setDisplayValue(value)
  }, [value])

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    e.preventDefault()
    e.stopPropagation()

    // 构建实时按键显示数组
    const currentKeys: string[] = []

    // 添加修饰键 (根据平台显示)
    if (e.metaKey) currentKeys.push(isMac ? 'Command' : 'Meta')
    if (e.ctrlKey) currentKeys.push('Ctrl')
    if (e.shiftKey) currentKeys.push('Shift')
    if (e.altKey) currentKeys.push(isMac ? 'Option' : 'Alt')

    // 忽略单独的修饰键
    if (['Control', 'Shift', 'Alt', 'Meta', 'Command'].includes(e.key)) {
      setPressingKeys(currentKeys)
      return
    }

    // 处理按键名称
    let key = e.key
    if (key === ' ') key = 'Space'
    else if (key === 'Escape') key = 'Esc'
    else if (key.length === 1) key = key.toUpperCase()

    currentKeys.push(key)
    setPressingKeys(currentKeys)

    // 构建快捷键字符串 (使用标准格式)
    const modifiers: string[] = []
    if (e.ctrlKey || e.metaKey) modifiers.push(e.metaKey && isMac ? 'Command' : 'Ctrl')
    if (e.shiftKey) modifiers.push('Shift')
    if (e.altKey) modifiers.push('Alt')

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
    setPressingKeys([])
  }

  const handleKeyUp = () => {
    // 清除实时按键展示
    setPressingKeys([])
  }

  const handleFocus = () => {
    setIsRecording(true)
    setPressingKeys([])
  }

  const handleBlur = () => {
    setIsRecording(false)
    setPressingKeys([])
    if (error) {
      setDisplayValue(value)
      setError(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDisplayValue('')
    onChange('')
    setError(false)
    setPressingKeys([])
  }

  // 获取显示文本
  const getDisplayText = () => {
    if (error) return '❌ Failed to register'
    if (pressingKeys.length > 0) return pressingKeys.join(' + ')
    if (isRecording && !displayValue) return '⌨️ Recording...'
    if (displayValue) return displayValue
    if (isRecording) return '⌨️ Recording...'
    return ''
  }

  // 获取占位符文本
  const getPlaceholder = () => {
    if (!displayValue && !isRecording) return defaultHint
    return placeholder
  }

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', ...style }}>
      <input
        type="text"
        value={getDisplayText()}
        placeholder={getPlaceholder()}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        readOnly
        style={{
          flex: 1,
          padding: '8px 12px',
          fontSize: '14px',
          color: pressingKeys.length > 0 ? 'var(--color-selected)' : 'var(--color-title)',
          backgroundColor: 'var(--color-input-bg)',
          border: `1px solid ${error ? 'var(--color-error, #ff4444)' : isRecording ? 'var(--color-selected)' : 'var(--color-border)'}`,
          borderRadius: '4px',
          outline: 'none',
          transition: 'all 0.2s',
          cursor: disabled ? 'not-allowed' : 'text',
          opacity: disabled ? 0.5 : 1,
          fontWeight: pressingKeys.length > 0 ? 600 : 400
        }}
        onMouseEnter={(e) => {
          if (!disabled && !error && !isRecording) {
            e.currentTarget.style.borderColor = 'var(--color-title)'
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !error && !isRecording) {
            e.currentTarget.style.borderColor = 'var(--color-border)'
          }
        }}
      />
      {showClearButton && displayValue && !disabled && (
        <button
          onClick={handleClear}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            color: 'var(--color-subtitle)',
            backgroundColor: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-title)'
            e.currentTarget.style.borderColor = 'var(--color-title)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-subtitle)'
            e.currentTarget.style.borderColor = 'var(--color-border)'
          }}
        >
          Clear
        </button>
      )}
    </div>
  )
}
