import { HStack } from 'keyerext';
import React, { useState, useEffect, useCallback } from 'react'
import { VscClose } from "react-icons/vsc";

export interface ShortcutRecorderProps {
  value: string
  onChange: (shortcut: string | undefined) => void
  onClear?: () => void
  placeholder?: string
  disabled?: boolean
}

const symbols: Record<string, string> = {
  'Meta': '⌘',
  'Control': '⌃',
  'Alt': '⌥',
  'Shift': '⇧',
  'Enter': '↩',
  'Backspace': '⌫',
  'Delete': '⌦',
  'Escape': 'Esc',
  'Tab': '⇥',
  'Up': '↑',
  'Down': '↓',
  'Left': '←',
  'Right': '→'
}
// 将symbols键值反转
const reverseSymbols: Record<string, string> = Object.fromEntries(
  Object.entries(symbols).map(([key, value]) => [value, key])
)

function parseShortcut(keys: string[]): string {
  return keys.map(key => reverseSymbols[key] || key).join('+')
}

/**
 * 快捷键录制组件
 * 自动捕获键盘输入并转换为快捷键格式（如 Shift+Space, Ctrl+Alt+K）
 * 兼容 Windows 和 Mac
 */
export function ShortcutRecorder({ value, onChange, onClear, placeholder = '--', disabled = false }: ShortcutRecorderProps) {
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
      // 使用 code 获取物理按键，如 KeyV, KeyA 等
      let mainKey = e.key

      // 如果是字母键，使用 code 来确保获取正确的字母
      if (e.code.startsWith('Key')) {
        mainKey = e.code.replace('Key', '') // KeyV -> V
      } else if (e.code.startsWith('Digit')) {
        mainKey = e.code.replace('Digit', '') // Digit1 -> 1
      } else if (e.code === 'Space') {
        mainKey = 'Space'
      } else if (e.code.startsWith('Arrow')) {
         mainKey = e.code.replace('Arrow', '') // KeyV -> V
      } else if (['Enter', 'Tab', 'Backspace', 'Delete', 'Escape'].includes(e.code)) {
        mainKey = e.code
      }

      newKeys.add(mainKey)
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
      const shortcut = parseShortcut([...modifiers, ...mainKeys])
      console.log('Recorded shortcut:', shortcut)
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
    if (disabled) return
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
    onChange(undefined)
    if (onClear) onClear()
    setIsRecording(false)
    setPressedKeys(new Set())
  }

  return (
    <HStack style={{
      padding: '4px',
      fontSize: '14px',
      color: disabled ? 'var(--color-disabled)' : 'var(--color-title)',
      backgroundColor: 'var(--color-input-bg)',
      border: `2px solid ${isRecording ? 'var(--color-title)' : 'var(--color-border)'}`,
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
      pointerEvents: disabled ? 'none' : 'auto',
    }}>
      <div
        onClick={handleClick}
        style={{
          flexGrow: 1,
          userSelect: 'none',
        }}
      >{isRecording
        ? pressedKeys.size > 0
          ? <Keys keys={Array.from(pressedKeys)} />
          : 'Recording...'
        : value
          ? <Keys keys={value.split("+")} />
          : placeholder
        }</div>
      <VscClose onClick={disabled ? undefined : handleClear} size={18} style={{ pointerEvents: disabled ? 'none' : 'auto', opacity: disabled ? 0.5 : 1 }} />
    </HStack>
  )
}


function Keys({keys}: {keys: string[]}) {
  return <HStack>
    {keys.map((key, index) => (
      <div key={index} style={{
        padding: '4px 8px',
        borderRadius: '2px',
        backgroundColor: 'var(--color-selected)',
        color: 'var(--color-title)',
        fontSize: '12px',
        fontWeight: 600, 
      }}>{symbols[key] || key.toUpperCase()}</div>
    ))}
  </HStack>
}