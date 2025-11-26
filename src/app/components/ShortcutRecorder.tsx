import React, { useState, useEffect, useCallback } from 'react'
import { VscClose } from "react-icons/vsc";

export interface ShortcutRecorderProps {
  value: string
  onChange: (shortcut: string) => void
  onClear?: () => void
  placeholder?: string
}

const symbols: Record<string, string> = {
  'Meta': '⌘',
  'Control': '⌃',
  'Alt': '⌥',
  'Shift': '⇧',
  'Enter': '↩',
  'Backspace': '⌫',
  'Delete': '⌦',
  'Escape': '⎋',
  'Tab': '⇥',
  'Space': '␣',
  'ArrowUp': '↑',
  'ArrowDown': '↓',
  'ArrowLeft': '←',
  'ArrowRight': '→'
}

function formatKey(key: string): string {
  if (symbols[key]) {
    return symbols[key]
  }
  if (key.startsWith('Key')) {
    return key.replace('Key', '').toUpperCase()
  }
  if (key.startsWith('Digit')) {
    return key.replace('Digit', '')
  }
  return key.toUpperCase()
}
// 将快捷键对象转换为显示字符串
function formatShortcut(keys: string[]): string {
  return keys.map(formatKey).join('')
}
/**
 * 快捷键录制组件
 * 自动捕获键盘输入并转换为快捷键格式（如 Shift+Space, Ctrl+Alt+K）
 * 兼容 Windows 和 Mac
 */
export function ShortcutRecorder({ value, onChange, onClear, placeholder = 'Record Shortcut' }: ShortcutRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isRecording) return

    e.preventDefault()
    e.stopPropagation()

    const newKeys = new Set(pressedKeys)

    // 添加修饰键
    if (e.metaKey) newKeys.add('Meta')
    if (e.ctrlKey) newKeys.add('Control')
    if (e.altKey) newKeys.add('Alt')
    if (e.shiftKey) newKeys.add('Shift')

    // 添加主键（排除单独的修饰键）- 使用 e.code 而不是 e.key 来获取物理按键
    if (!['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) {
      newKeys.add(formatKey(e.code))
    }

    setPressedKeys(newKeys)
  }, [isRecording, pressedKeys])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!isRecording) return

    e.preventDefault()
    e.stopPropagation()

    // 如果有按键被记录，保存快捷键
    if (pressedKeys.size > 0) {
      const keysArray = Array.from(pressedKeys)

      // 修饰键排序：Meta, Control, Alt, Shift, 主键
      const modifierOrder = ['Meta', 'Control', 'Alt', 'Shift']
      const modifiers = keysArray.filter(k => modifierOrder.includes(k))
        .sort((a, b) => modifierOrder.indexOf(a) - modifierOrder.indexOf(b))
      const mainKeys = keysArray.filter(k => !modifierOrder.includes(k))

      const shortcut = [...modifiers, ...mainKeys].join('+')
      onChange(shortcut)
      setIsRecording(false)
      setPressedKeys(new Set())
    }
  }, [isRecording, pressedKeys, onChange])

  useEffect(() => {
    if (isRecording) {
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('keyup', handleKeyUp)
      }
    }
  }, [isRecording, handleKeyDown, handleKeyUp])

  const handleClick = () => {
    if (isRecording) {
      // 取消录制
      setIsRecording(false)
      setPressedKeys(new Set())
    } else {
      // 开始录制
      setIsRecording(true)
      setPressedKeys(new Set())
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    if (onClear) onClear()
    setIsRecording(false)
    setPressedKeys(new Set())
  }

  const getDisplayText = () => {
    return isRecording
      ? pressedKeys.size > 0
        ? formatShortcut(Array.from(pressedKeys))
        : 'Press keys...'
      : formatShortcut(Array.from(value.split('+'))) || placeholder
  }

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <div
        onClick={handleClick}
        style={{
          flex: 1,
          padding: '8px 32px 8px 12px', // 右侧留空间给按钮
          fontSize: '14px',
          color: 'var(--color-title)',
          backgroundColor: 'var(--color-input-bg)',
          border: `2px solid ${isRecording ? 'var(--color-title)' : 'var(--color-border)'}`,
          outline: 'none',
          fontWeight: 800
        }}
      >{getDisplayText()}</div>
      <span
        style={{
          position: 'absolute',
          right: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          cursor: 'pointer',
          color: 'var(--color-subtitle)',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          zIndex: 2
        }}
        onClick={handleClear}
      >
        <VscClose size={18} />
      </span>
    </div>
  )
}