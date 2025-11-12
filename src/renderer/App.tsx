import React, { useState, useEffect, useCallback } from 'react'
import './App.css'
import { IAction } from '../shared/types'
import Settings from './components/Settings'
import MainView from './components/MainView'
import { CommandManager } from '../shared/CommandManager'
import { IExtensionResult } from 'keyerext'

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
  extensionProps?: Record<string, any>
}

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [commandManagerReady, setCommandManagerReady] = useState(false)

  // 视图状态机
  const [viewState, setViewState] = useState<ViewState>({ type: 'main' })

  // 初始化 CommandManager
  useEffect(() => {
    const init = async () => {
      try {
        const { ipcRenderer } = window.require('electron')

        // 从主进程获取路径信息
        const paths = await ipcRenderer.invoke('get-paths') as {
          scriptsDir: string
          extensionsDir: string
          isDev: boolean
        }

        await CommandManager.createInstance(paths.scriptsDir, paths.extensionsDir)
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

  // 全局键盘事件 - 处理非主界面的 Esc 返回
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewState.type !== 'main') {
        e.preventDefault()
        setViewState({ type: 'main' })
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

      // 处理不同类型的返回值
      if (typeof result === 'boolean') {
        // 布尔值：true 保持打开，false 关闭
        if (!result) {
          const { ipcRenderer } = window.require('electron')
          await ipcRenderer.invoke('hide-window')
        }
      } else {
        // 扩展结果对象
        const extResult = result as IExtensionResult

        if (extResult.component) {
          // 显示扩展组件
          setViewState({
            type: 'extension',
            extensionComponent: extResult.component,
            extensionProps: {
              ...extResult.props,
              onClose: returnToMain
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
        if (viewState.extensionComponent) {
          const ExtComponent = viewState.extensionComponent
          return <ExtComponent {...viewState.extensionProps} />
        }
        return null

      case 'settings':
        return <Settings onClose={returnToMain} />

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
