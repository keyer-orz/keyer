import React, { useState, useEffect, useCallback } from 'react'
import './App.css'
import { IAction } from '../shared/types'
import Settings from './components/Settings'
import MainView from './components/MainView'
import { CommandManager } from '../shared/Commands'

// 扩展 Window 类型以支持 ipcRenderer
declare global {
  interface Window {
    require: NodeRequire
  }
}

// 视图类型
type ViewType = 'main' | 'extension' | 'settings'

interface ViewState {
  type: ViewType
  // 扩展视图的数据
  extensionComponent?: React.ComponentType<any>
  extensionElement?: React.ReactElement  // 支持 React 元素
  extensionProps?: Record<string, any>
}

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [commandManagerReady, setCommandManagerReady] = useState(false)

  // 视图状态机
  const [viewState, setViewState] = useState<ViewState>({ type: 'main' })

  // 监听视图切换，调整窗口大小
  useEffect(() => {
    const { ipcRenderer } = window.require('electron')

    if (viewState.type === 'settings') {
      // 切换到设置界面，窗口变大
      ipcRenderer.invoke('resize-window', 1200, 700, true)
    } else if (viewState.type === 'main') {
      // 返回主界面，恢复原始大小
      ipcRenderer.invoke('restore-window-size')
    }
  }, [viewState.type])

  // 初始化 CommandManager
  useEffect(() => {
    const init = async () => {
      try {
        const { ipcRenderer } = window.require('electron')

        // 从主进程获取路径信息
        const paths = await ipcRenderer.invoke('get-paths') as {
          scriptsDir: string
          extensionsDirs: string[]
          isDev: boolean
        }

        await CommandManager.createInstance(paths.scriptsDir, paths.extensionsDirs)
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

    // 监听焦点输入事件 - 返回主界面
    const handleFocusInput = () => {
      setViewState({ type: 'main' })
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

  // 全局键盘快捷键处理
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 处理 Escape 键 - 智能行为
      if (e.key === 'Escape') {
        const inputElement = document.querySelector('[data-keyer-input="true"]') as HTMLInputElement

        if (inputElement) {
          // 1. 如果焦点不在 Input 上，让 Input 获取焦点
          if (document.activeElement !== inputElement) {
            e.preventDefault()
            inputElement.focus()
            return
          }

          // 2. 如果焦点在 Input 上且 Input 不为空，清空 Input
          if (inputElement.value.trim() !== '') {
            e.preventDefault()
            // 触发 onChange 事件来清空（模拟用户输入）
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              'value'
            )?.set
            nativeInputValueSetter?.call(inputElement, '')
            inputElement.dispatchEvent(new Event('input', { bubbles: true }))
            return
          }

          // 3. 如果在主界面且 Input 为空，隐藏窗口
          if (viewState.type === 'main') {
            e.preventDefault()
            const { ipcRenderer } = window.require('electron')
            ipcRenderer.invoke('hide-window')
            return
          }
        }

        // 如果不在主界面，返回主界面
        if (viewState.type !== 'main') {
          e.preventDefault()
          setViewState({ type: 'main' })
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [viewState.type])

  // 返回主界面
  const returnToMain = useCallback(() => {
    setViewState({ type: 'main' })
  }, [])

  // 打开设置
  const openSettings = useCallback(() => {
    setViewState({ type: 'settings' })
  }, [])

  // 执行命令
  const handleExecute = useCallback(async (action: IAction) => {
    try {
      const commandManager = CommandManager.getInstance()
      const result = await commandManager.execute(action)

      // 处理返回值
      if (result === null) {
        // null: 关闭主面板
        const { ipcRenderer } = window.require('electron')
        await ipcRenderer.invoke('hide-window')
      } else if (typeof result === 'function') {
        // React.ComponentType: 切换至插件的二级面板
        setViewState({
          type: 'extension',
          extensionComponent: result
        })
      } else if (React.isValidElement(result)) {
        // React.ReactElement: 直接显示 React 元素
        setViewState({
          type: 'extension',
          extensionElement: result
        })
      }
    } catch (error) {
      console.error('Execute error:', error)
    }
  }, [returnToMain])

  // 渲染当前视图
  const renderView = () => {
    switch (viewState.type) {
      case 'main':
        return (
          <MainView
            onExecute={handleExecute}
            onOpenSettings={openSettings}
            commandManagerReady={commandManagerReady}
          />
        )

      case 'extension':
        // 优先显示 React 元素，其次是组件
        if (viewState.extensionElement) {
          return viewState.extensionElement
        }
        if (viewState.extensionComponent) {
          const ExtComponent = viewState.extensionComponent
          return <ExtComponent />
        }
        return null

      case 'settings':
        return <Settings />

      default:
        return null
    }
  }

  return (
    <div className={`app theme-${theme}`}>
      {renderView()}
    </div>
  )
}

export default App
