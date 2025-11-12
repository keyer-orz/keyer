import React, { useState, useEffect, useRef } from 'react'
import './App.css'
import { IAction } from '../shared/types'
import Settings from './components/Settings'
import { initializeCommandManager, getCommandManager } from './core/RendererCommandManager'
import { IExtensionResult } from 'keyerext'

// 扩展 Window 类型以支持 ipcRenderer
declare global {
  interface Window {
    require: NodeRequire
  }
}

function App() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<IAction[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isMouseActive, setIsMouseActive] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [commandManagerReady, setCommandManagerReady] = useState(false)

  // 扩展组件状态
  const [extensionComponent, setExtensionComponent] = useState<React.ComponentType<any> | null>(null)
  const [extensionProps, setExtensionProps] = useState<Record<string, any>>({})

  const inputRef = useRef<HTMLInputElement>(null)
  const selectedItemRef = useRef<HTMLDivElement>(null)

  // 初始化 CommandManager
  useEffect(() => {
    const init = async () => {
      try {
        await initializeCommandManager()
        setCommandManagerReady(true)
        console.log('CommandManager initialized in renderer process')
      } catch (error) {
        console.error('Failed to initialize CommandManager:', error)
      }
    }

    init()
  }, [])

  // 监听事件
  useEffect(() => {
    const { ipcRenderer } = window.require('electron')

    // 监听焦点输入事件
    const handleFocusInput = () => {
      inputRef.current?.focus()
      setInput('')
      setResults([])
      setSelectedIndex(0)
      // 关闭扩展组件
      setExtensionComponent(null)
    }

    // 监听主题变化
    const handleThemeChanged = (_: any, newTheme: string) => {
      setTheme(newTheme as 'dark' | 'light')
    }

    // 注册事件监听
    ipcRenderer.on('focus-input', handleFocusInput)
    ipcRenderer.on('theme-changed', handleThemeChanged)

    // 加载配置
    ipcRenderer.invoke('get-config').then((config: any) => {
      if (config && config.theme) {
        setTheme(config.theme)
      }
    })

    return () => {
      ipcRenderer.removeListener('focus-input', handleFocusInput)
      ipcRenderer.removeListener('theme-changed', handleThemeChanged)
    }
  }, [])

  // 搜索
  useEffect(() => {
    const searchCommands = async () => {
      if (!commandManagerReady) return

      try {
        const commandManager = getCommandManager()
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
    // 如果显示扩展组件，不处理键盘事件
    if (extensionComponent) return

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
      const { ipcRenderer } = window.require('electron')
      ipcRenderer.invoke('hide-window')
    }
  }

  // 执行命令
  const handleExecute = async (action: IAction) => {
    try {
      const commandManager = getCommandManager()
      const result = await commandManager.execute(action)

      // 处理不同类型的返回值
      if (typeof result === 'boolean') {
        // 布尔值：true 保持打开，false 关闭
        if (!result) {
          const { ipcRenderer } = window.require('electron')
          await ipcRenderer.invoke('hide-window')
        }
        setInput('')
        setResults([])
      } else {
        // 扩展结果对象
        const extResult = result as IExtensionResult

        if (extResult.component) {
          // 显示扩展组件
          setExtensionComponent(() => extResult.component!)
          setExtensionProps({
            ...extResult.props,
            onClose: () => {
              setExtensionComponent(null)
              setInput('')
              setResults([])
            }
          })
        }

        if (extResult.keepOpen === false) {
          const { ipcRenderer } = window.require('electron')
          await ipcRenderer.invoke('hide-window')
        }
      }
    } catch (error) {
      console.error('Execute error:', error)
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

  // 渲染扩展组件
  if (extensionComponent) {
    const ExtComponent = extensionComponent
    return (
      <div className={`app theme-${theme}`}>
        <ExtComponent {...extensionProps} />
      </div>
    )
  }

  return (
    <div className={`app theme-${theme}`}>
      {!showSettings && (
        <>
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

          <div className="footer">
            <div className="footer-desc">
              {results[selectedIndex]?.desc || ''}
            </div>
            <div className="footer-settings" onClick={() => setShowSettings(true)}>
              ⚙️
            </div>
          </div>
        </>
      )}
      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}

export default App
