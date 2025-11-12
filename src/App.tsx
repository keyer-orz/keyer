import React, { useState, useEffect, useRef } from 'react'
import './App.css'
import { IAction } from './types'
import Settings from './components/Settings'
import Panel from './components/Panel'
import { IPanelConfig, IListItem } from 'keyerext'
import { uiExtensionLoader } from './core/UIExtensionLoader'
import { initializeCommandManager, getCommandManager } from './core/RendererCommandManager'

// 可序列化的 Panel 配置（包含 extensionId）
interface SerializablePanelConfig extends IPanelConfig {
  extensionId: string
}

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
  const [showPanel, setShowPanel] = useState(false)
  const [panelConfig, setPanelConfig] = useState<SerializablePanelConfig | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [commandManagerReady, setCommandManagerReady] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedItemRef = useRef<HTMLDivElement>(null)

  // 初始化 CommandManager
  useEffect(() => {
    const init = async () => {
      try {
        await initializeCommandManager()
        setCommandManagerReady(true)
        console.log('CommandManager initialized in renderer process')

        // 加载 UI 扩展
        const commandManager = getCommandManager()
        const uiExtensions = commandManager.getUIExtensions()
        for (const { id, uiPath } of uiExtensions) {
          try {
            await uiExtensionLoader.loadExtension(id, uiPath)
            console.log(`Loaded UI extension: ${id}`)
          } catch (error) {
            console.error(`Failed to load UI extension ${id}:`, error)
          }
        }
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
    }

    // 监听面板显示
    const handleShowPanel = (event: CustomEvent) => {
      const config = event.detail as SerializablePanelConfig
      setPanelConfig(config)
      setShowPanel(true)
    }

    // 监听面板关闭
    const handleClosePanel = () => {
      setShowPanel(false)
      setPanelConfig(null)
    }

    // 监听面板更新
    const handleUpdatePanel = (event: CustomEvent) => {
      const items = event.detail as IListItem[]
      if (panelConfig) {
        setPanelConfig({ ...panelConfig, props: { ...panelConfig.props, items } })
      }
    }

    // 监听主题变化
    const handleThemeChanged = (_: any, newTheme: string) => {
      setTheme(newTheme as 'dark' | 'light')
    }

    // 注册事件监听
    ipcRenderer.on('focus-input', handleFocusInput)
    ipcRenderer.on('theme-changed', handleThemeChanged)
    window.addEventListener('show-panel', handleShowPanel as EventListener)
    window.addEventListener('close-panel', handleClosePanel)
    window.addEventListener('update-panel', handleUpdatePanel as EventListener)

    // 加载配置
    ipcRenderer.invoke('get-config').then((config: any) => {
      if (config && config.theme) {
        setTheme(config.theme)
      }
    })

    return () => {
      ipcRenderer.removeListener('focus-input', handleFocusInput)
      ipcRenderer.removeListener('theme-changed', handleThemeChanged)
      window.removeEventListener('show-panel', handleShowPanel as EventListener)
      window.removeEventListener('close-panel', handleClosePanel)
      window.removeEventListener('update-panel', handleUpdatePanel as EventListener)
    }
  }, [panelConfig])

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
      const keepOpen = await commandManager.execute(action)

      if (!keepOpen) {
        const { ipcRenderer } = window.require('electron')
        await ipcRenderer.invoke('hide-window')
      }

      setInput('')
      setResults([])
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
