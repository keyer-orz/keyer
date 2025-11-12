import React, { useState, useEffect, useRef } from 'react'
import { IAction } from '../../shared/types'
import { CommandManager } from '../../shared/CommandManager'
import { Input, InputHandle } from 'keyerext'

interface MainViewProps {
  onExecute: (action: IAction) => Promise<void>
  onOpenSettings: () => void
  commandManagerReady: boolean
}

function MainView({ onExecute, onOpenSettings, commandManagerReady }: MainViewProps) {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<IAction[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isMouseActive, setIsMouseActive] = useState(true)

  const inputRef = useRef<InputHandle>(null)
  const selectedItemRef = useRef<HTMLDivElement>(null)

  // 自动聚焦输入框
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // 搜索
  useEffect(() => {
    const searchCommands = async () => {
      if (!commandManagerReady) return

      try {
        const commandManager = CommandManager.getInstance()
        const actions = await commandManager.search(input)
        setResults(actions)
        setSelectedIndex(0)
      } catch (error) {
        console.error('Search error:', error)
      }
    }

    const debounce = setTimeout(searchCommands, 150)
    return () => clearTimeout(debounce)
  }, [input, commandManagerReady])

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
        onExecute(results[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      const { ipcRenderer } = window.require('electron')
      ipcRenderer.invoke('hide-window')
    }
  }

  // 获取图标
  const getIcon = (action: IAction) => {
    if (action.typeLabel === 'System') {
      return '⚙️'
    } else if (action.typeLabel === 'Command') {
      return '⚡'
    }
    return '📦'
  }

  return (
    <>
      <div className="search-container">
        <Input
          ref={inputRef}
          value={input}
          onChange={setInput}
          onKeyDown={handleKeyDown}
          placeholder="Search for apps and commands..."
          autoFocus={true}
          className="search-input"
        />
      </div>

      <div
        className={`results-container ${isMouseActive ? 'mouse-active' : ''}`}
        onMouseMove={() => setIsMouseActive(true)}
      >
        {results.map((result, index) => (
          <div
            key={`${result.id}-${index}`}
            ref={index === selectedIndex ? selectedItemRef : null}
            className={`result-item ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => onExecute(result)}
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

      <div className="footer">
        <div className="footer-desc">
          {results[selectedIndex]?.desc || ''}
        </div>
        <div className="footer-settings" onClick={onOpenSettings}>
          ⚙️
        </div>
      </div>
    </>
  )
}

export default MainView
