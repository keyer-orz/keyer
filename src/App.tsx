import React, { useState, useEffect, useRef } from 'react'
import './App.css'
import { IAction } from './types'
import Settings from './components/Settings'
import Panel from './components/Panel'
import { IPanelConfig, IListItem } from 'keyerext'
import { uiExtensionLoader } from './core/UIExtensionLoader'

declare global {
  interface Window {
    electronAPI: {
      search: (input: string) => Promise<IAction[]>
      execute: (action: IAction) => Promise<void>
      hideWindow: () => Promise<void>
      onFocusInput: (callback: () => void) => void
      getExtensions: () => Promise<any[]>
      getScripts: () => Promise<any[]>
      getConfig: () => Promise<any>
      updateConfig: (updates: any) => Promise<boolean>
      onThemeChanged: (callback: (theme: string) => void) => void
      onShowPanel: (callback: (config: IPanelConfig) => void) => void
      onClosePanel: (callback: () => void) => void
      onUpdatePanel: (callback: (items: IListItem[]) => void) => void
      loadUIExtensions: () => Promise<Array<{ id: string, uiPath: string }>>
    }
  }
}

function App() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<IAction[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isMouseActive, setIsMouseActive] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [panelConfig, setPanelConfig] = useState<IPanelConfig | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
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

      // 加载配置
      window.electronAPI.getConfig().then(config => {
        if (config && config.theme) {
          setTheme(config.theme)
        }
      })

      // 加载 UI 扩展
      window.electronAPI.loadUIExtensions().then(extensions => {
        extensions.forEach(({ id, uiPath }) => {
          uiExtensionLoader.loadExtension(id, uiPath)
        })
      })

      // 监听主题变化
      window.electronAPI.onThemeChanged((newTheme: string) => {
        setTheme(newTheme as 'dark' | 'light')
      })

      // 监听面板显示
      window.electronAPI.onShowPanel((config: IPanelConfig) => {
        setPanelConfig(config)
        setShowPanel(true)
      })

      // 监听面板关闭
      window.electronAPI.onClosePanel(() => {
        setShowPanel(false)
        setPanelConfig(null)
      })

      // 监听面板更新
      window.electronAPI.onUpdatePanel((items: IListItem[] | IBoardItem[]) => {
        if (panelConfig) {
          setPanelConfig({ ...panelConfig, items })
        }
      })
    }
  }, [panelConfig])

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
      console.log("Escape key pressed")
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
    // 使用 typeLabel 来区分类型
    if (action.typeLabel === 'System') {
      return '⚙️'
    } else if (action.typeLabel === 'Command') {
      return '⚡'
    }
    return '📦'
  }

  return (
    <div className={`app theme-${theme}`}>
      {showPanel && panelConfig && (
        <Panel
          config={panelConfig}
          onClose={() => {
            setShowPanel(false)
            setPanelConfig(null)
          }}
        />
      )}
      {!showPanel && !showSettings && (
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
      {!showPanel && showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}

export default App
