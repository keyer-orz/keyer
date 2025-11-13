import { useState, useEffect, useCallback } from 'react'
import './ShortcutRecorder.css'

interface ShortcutRecorderProps {
  value: string
  onChange: (shortcut: string) => void
  onClear?: () => void
  placeholder?: string
}

// 将快捷键对象转换为显示字符串
function formatShortcut(keys: string[]): string {
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

  return keys.map(key => symbols[key] || key.toUpperCase()).join('')
}

function ShortcutRecorder({ value, onChange, onClear, placeholder = 'Record Shortcut' }: ShortcutRecorderProps) {
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
        mainKey = e.code // ArrowUp, ArrowDown, etc.
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

      const shortcut = formatShortcut([...modifiers, ...mainKeys])
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

  return (
    <div
      className={`shortcut-recorder ${isRecording ? 'recording' : ''} ${value ? 'has-value' : ''}`}
      onClick={handleClick}
    >
      <span className="shortcut-display">
        {isRecording
          ? pressedKeys.size > 0
            ? formatShortcut(Array.from(pressedKeys))
            : 'Press keys...'
          : value || placeholder
        }
      </span>
      {value && !isRecording && (
        <button className="shortcut-clear" onClick={handleClear}>
          ✕
        </button>
      )}
    </div>
  )
}

export default ShortcutRecorder
