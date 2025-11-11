import React, { useState, useEffect, useRef } from 'react'
import './App.css'
import { IAction } from './types'

declare global {
  interface Window {
    electronAPI: {
      search: (input: string) => Promise<IAction[]>
      execute: (action: IAction) => Promise<void>
      hideWindow: () => Promise<void>
      onFocusInput: (callback: () => void) => void
    }
  }
}

function App() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<IAction[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isMouseActive, setIsMouseActive] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedItemRef = useRef<HTMLDivElement>(null)

  // 监听焦点输入事件
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onFocusInput(() => {
        inputRef.current?.focus()
        setInput('')
        setResults([])
        setSelectedIndex(0)
      })
    }
  }, [])

  // 搜索
  useEffect(() => {
    const searchCommands = async () => {
      if (window.electronAPI) {
        const actions = await window.electronAPI.search(input)
        setResults(actions)
        setSelectedIndex(0)
      }
    }

    const debounce = setTimeout(searchCommands, 150)
    return () => clearTimeout(debounce)
  }, [input])

  // 键盘导航时自动滚动到选中项
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'auto',
        block: 'nearest',
      })
    }
  }, [selectedIndex, results])

  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIsMouseActive(false)
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIsMouseActive(false)
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        handleExecute(results[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (window.electronAPI) {
        window.electronAPI.hideWindow()
      }
    }
  }

  // 执行命令
  const handleExecute = async (action: IAction) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.execute(action)
        setInput('')
        setResults([])
      }
    } catch (error) {
      console.error('Execute error:', error)
    }
  }

  // 获取图标
  const getIcon = (action: IAction) => {
    // 根据扩展类型返回不同的 emoji
    if (action.ext?.type === 'system-preferences') {
      return '⚙️'
    } else if (action.ext?.type === 'command') {
      return '⚡'
    }
    return '📦'
  }

  return (
    <div className="app">
      <div className="search-container">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search for apps and commands..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </div>

      {results.length > 0 && (
        <div
          className={`results-container ${isMouseActive ? 'mouse-active' : ''}`}
          onMouseMove={() => setIsMouseActive(true)}
        >
          {results.map((result, index) => (
            <div
              key={`${result.id}-${index}`}
              ref={index === selectedIndex ? selectedItemRef : null}
              className={`result-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleExecute(result)}
            >
              <div className="result-icon">
                {getIcon(result)}
              </div>
              <div className="result-content">
                <div className="result-info">
                  <div className="result-name">{result.name}</div>
                </div>
                <div className="result-tag">{result.typeLabel || 'Extension'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
