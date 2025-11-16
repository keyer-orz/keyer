import { useState, useEffect, useMemo } from 'react'
import './styles/App.css'
import { CommandManager } from './managers/CommandManager'
import { ConfigManager } from '../shared/Config'
import { NavigationContext, ViewState, NavigationContextType } from './utils/NavigationContext'
import { getSystemCommand } from './utils/SystemCommands'
import { executeCommand } from './utils/CommandExecutor'
import { setToastCallback } from './keyer-api'

// 扩展 Window 类型以支持 ipcRenderer
declare global {
  interface Window {
    require: NodeRequire
  }
}

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  // 使用栈管理视图：存储 ViewState
  const [viewStack, setViewStack] = useState<ViewState[]>(() => {
    const mainCommand = getSystemCommand('@system#main')
    return [{
      commandId: '@system#main',
      type: 'main',
      extensionComponent: mainCommand?.component
    }]
  })

  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false
  })

  // 当前视图是栈顶元素
  const viewState = viewStack[viewStack.length - 1]

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
    CommandManager.initializeFromRenderer()
  }, [])

  // 监听事件
  useEffect(() => {
    const { ipcRenderer } = window.require('electron')

    const handleFocusInput = () => {
      // 返回主视图：重置栈为只包含主视图
      const mainCommand = getSystemCommand('@system#main')
      setViewStack([{
        commandId: '@system#main',
        type: 'main',
        extensionComponent: mainCommand?.component
      }])
    }

    // 处理 execute-command 事件：统一的命令执行入口
    const handleExecuteCommand = async (_: any, commandId: string) => {
      // 特殊处理：@system#main 直接返回主视图
      if (commandId === '@system#main') {
        handleFocusInput()
        return
      }

      // 其他命令：查找并执行
      if (!CommandManager.isReady()) {
        console.warn('CommandManager not ready')
        return
      }

      const commandManager = CommandManager.getInstance()
      const allCommands = await commandManager.search('')
      const command = allCommands.find(cmd => cmd.ucid === commandId)

      if (command) {
        // 创建 navigateTo 函数，将新视图压入栈
        const navigateTo = (newViewState: ViewState) => {
          setViewStack(prev => [...prev, newViewState])
        }
        // 调用全局命令执行器
        await executeCommand(command, { navigateTo })
      } else {
        console.warn('Command not found:', commandId)
      }
    }

    ipcRenderer.on('focus-input', handleFocusInput)
    ipcRenderer.on('execute-command', handleExecuteCommand)

    // 使用 ConfigManager 单例获取主题
    const configManager = ConfigManager.getInstance()
    const config = configManager.getConfig()
    if (config && config.theme) {
      setTheme(config.theme)
    }

    // 设置 toast 回调
    setToastCallback((message: string, duration: number) => {
      setToast({ message, visible: true })
      setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }))
      }, duration)
    })

    return () => {
      ipcRenderer.removeListener('focus-input', handleFocusInput)
      ipcRenderer.removeListener('execute-command', handleExecuteCommand)
    }
  }, [])

  // 全局键盘快捷键处理
  useEffect(() => {
    const handleGlobalKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()

        // 1. 调用当前扩展的 doBack() 方法
        // TODO: 需要获取当前扩展实例并调用 doBack()
        // 暂时默认返回 true

        const shouldGoBack = true // 默认行为

        if (!shouldGoBack) {
          // 扩展自己处理了 Esc，不执行默认行为
          return
        }

        // 2. 默认行为：出栈
        if (viewStack.length > 1) {
          // 有多个视图，出栈返回上一个
          setViewStack(prev => prev.slice(0, -1))
        } else {
          // 只剩主视图，隐藏窗口
          const { ipcRenderer } = window.require('electron')
          ipcRenderer.invoke('hide-window')
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [viewStack])

  // 创建导航上下文值
  const navigationValue: NavigationContextType = useMemo(() => ({
    navigateToCommand: (commandId: string) => {
      // 根据 commandId 创建 ViewState 并压入栈
      const systemCommand = getSystemCommand(commandId)
      if (systemCommand) {
        setViewStack(prev => [...prev, {
          commandId,
          type: 'system',
          extensionComponent: systemCommand.component,
          windowSize: systemCommand.windowSize
        }])
      }
    },
    navigateBack: () => {
      // 出栈
      if (viewStack.length > 1) {
        setViewStack(prev => prev.slice(0, -1))
      } else {
        // 只剩主视图，隐藏窗口
        const { ipcRenderer } = window.require('electron')
        ipcRenderer.invoke('hide-window')
      }
    },
    navigateTo: (newViewState: ViewState) => {
      // 将新视图压入栈
      setViewStack(prev => [...prev, newViewState])
    },
    currentView: viewState
  }), [viewState, viewStack])

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
        {/* Toast 提示 */}
        {toast.visible && (
          <div className="toast">
            {toast.message}
          </div>
        )}
      </div>
    </NavigationContext.Provider>
  )
}

export default App
