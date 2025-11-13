import React, { useState, useEffect, useMemo } from 'react'
import './App.css'
import Settings from './components/Settings'
import MainView from './components/MainView'
import { CommandManager } from '../shared/Commands'
import { NavigationContext, ViewState, NavigationContextType } from './contexts/NavigationContext'

// 扩展 Window 类型以支持 ipcRenderer
declare global {
  interface Window {
    require: NodeRequire
  }
}

// 视图组件映射
const VIEW_COMPONENTS = {
  main: MainView,
  settings: Settings,
  extension: null // 动态组件
} as const

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [commandManagerReady, setCommandManagerReady] = useState(false)
  const [viewState, setViewState] = useState<ViewState>({ type: 'main' })

  // 监听视图切换，调整窗口大小
  useEffect(() => {
    const { ipcRenderer } = window.require('electron')

    if (viewState.type === 'settings') {
      ipcRenderer.invoke('resize-window', 1200, 700, true)
    } else if (viewState.type === 'main') {
      ipcRenderer.invoke('restore-window-size')
    }
  }, [viewState.type])

  // 初始化 CommandManager
  useEffect(() => {
    const init = async () => {
      try {
        const { ipcRenderer } = window.require('electron')

        const [config, sandboxDir, devPaths] = await Promise.all([
          ipcRenderer.invoke('get-config'),
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

    const handleFocusInput = () => {
      setViewState({ type: 'main' })
    }

    const handleThemeChanged = (_: any, newTheme: string) => {
      setTheme(newTheme as 'dark' | 'light')
    }

    ipcRenderer.on('focus-input', handleFocusInput)
    ipcRenderer.on('theme-changed', handleThemeChanged)

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

  // 全局键盘快捷键处理
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()

        // 1. 如果不在主界面，直接返回主界面
        if (viewState.type !== 'main') {
          setViewState({ type: 'main' })
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

    // 处理扩展视图（动态组件）
    if (type === 'extension') {
      if (viewState.extensionElement) {
        return viewState.extensionElement
      }
      if (viewState.extensionComponent) {
        const ExtComponent = viewState.extensionComponent
        return <ExtComponent />
      }
      return null
    }

    // 使用映射渲染标准视图
    const Component = VIEW_COMPONENTS[type]
    if (!Component) return null

    // 传递 commandManagerReady 给需要的组件
    if (type === 'main') {
      return <Component commandManagerReady={commandManagerReady} />
    }

    return <Component commandManagerReady={false}/>
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
