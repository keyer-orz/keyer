import { useState, useEffect, useMemo } from 'react'
import './App.css'
import { CommandManager } from '../shared/Commands'
import { ConfigManager } from '../shared/Config'
import { NavigationContext, ViewState, NavigationContextType } from './contexts/NavigationContext'
import MainView from './components/MainView'

// 扩展 Window 类型以支持 ipcRenderer
declare global {
  interface Window {
    require: NodeRequire
  }
}

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [viewState, setViewState] = useState<ViewState>(() => {
    return {
      type: 'main',
      extensionComponent: MainView
    }
  })

  // 监听视图切换，调整窗口大小
  useEffect(() => {
    const { ipcRenderer } = window.require('electron')

    const windowSize = viewState.windowSize || 'normal'

    if (windowSize === 'large') {
      ipcRenderer.invoke('resize-window', 1200, 700)
    } else {
      ipcRenderer.invoke('restore-window-size')
    }
  }, [viewState.windowSize])

  // 初始化 CommandManager
  useEffect(() => {
    const init = async () => {
      try {
        const { ipcRenderer } = window.require('electron')

        // 获取 ConfigManager 单例
        const configManager = ConfigManager.getInstance()
        const config = configManager.getConfig()

        const [sandboxDir, devPaths] = await Promise.all([
          ipcRenderer.invoke('get-sandbox-dir'),
          ipcRenderer.invoke('get-dev-paths')
        ])

        console.log('Config:', config)
        console.log('Sandbox dir:', sandboxDir)
        console.log('Dev paths:', devPaths)

        await CommandManager.createInstance({
          devExtensionsDir: devPaths?.extensionsDir || undefined,
          devScriptsDir: devPaths?.scriptsDir || undefined,
          configExtensions: config?.extensions || [],
          configScripts: config?.scripts || [],
          sandboxDir: sandboxDir
        })
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

    const handleFocusInput = () => {
      // 返回主视图
      setViewState({
        type: 'main',
        extensionComponent: MainView
      })
    }

    ipcRenderer.on('focus-input', handleFocusInput)

    // 使用 ConfigManager 单例获取主题
    const configManager = ConfigManager.getInstance()
    const config = configManager.getConfig()
    if (config && config.theme) {
      setTheme(config.theme)
    }

    return () => {
      ipcRenderer.removeListener('focus-input', handleFocusInput)
    }
  }, [])

  // 全局键盘快捷键处理
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()

        // 检查是否在主界面
        const isMainView = viewState.type === 'main'

        // 1. 如果不在主界面，直接返回主界面
        if (!isMainView) {
          setViewState({
            type: 'main',
            extensionComponent: MainView
          })
          return
        }

        // 2. 在主界面的情况下
        const inputElement = document.querySelector('[data-keyer-input="true"]') as HTMLInputElement

        if (inputElement) {
          // 2.1 如果焦点不在 Input 上，让 Input 获取焦点
          if (document.activeElement !== inputElement) {
            inputElement.focus()
            return
          }

          // 2.2 如果焦点在 Input 上且 Input 不为空，清空 Input
          if (inputElement.value.trim() !== '') {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              'value'
            )?.set
            nativeInputValueSetter?.call(inputElement, '')
            inputElement.dispatchEvent(new Event('input', { bubbles: true }))
            return
          }

          // 2.3 如果在主界面、焦点在 Input 上且 Input 为空，隐藏窗口
          const { ipcRenderer } = window.require('electron')
          ipcRenderer.invoke('hide-window')
        } else {
          // 2.4 在主界面但没有 Input 元素（不太可能），隐藏窗口
          const { ipcRenderer } = window.require('electron')
          ipcRenderer.invoke('hide-window')
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [viewState.type])

  // 创建导航上下文值
  const navigationValue: NavigationContextType = useMemo(() => ({
    navigateTo: (newViewState: ViewState) => setViewState(newViewState),
    currentView: viewState
  }), [viewState])

  // 渲染当前视图
  const renderView = () => {
    const { type } = viewState

    if (type === 'main') {
      const MainComponent = viewState.extensionComponent
      return MainComponent ? <MainComponent /> : null
    }

    // 处理系统命令视图（动态组件）
    if (type === 'system') {
      if (viewState.extensionElement) {
        return viewState.extensionElement
      }
      if (viewState.extensionComponent) {
        const SystemComponent = viewState.extensionComponent
        return <SystemComponent />
      }
      return null
    }

    // 处理扩展视图（React 元素）
    if (type === 'extension') {
      if (viewState.extensionElement) {
        return viewState.extensionElement
      }
      return null
    }

    return null
  }

  return (
    <NavigationContext.Provider value={navigationValue}>
      <div className={`app theme-${theme}`}>
        {renderView()}
      </div>
    </NavigationContext.Provider>
  )
}

export default App
