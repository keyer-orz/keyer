import { useState, useEffect, useMemo } from 'react'
import '@/styles/App.css'
import { CommandManager } from '@/managers/CommandManager'
import { ConfigManager } from '@/shared/Config'
import { NavigationContext, ViewState, NavigationContextType } from '@/utils/NavigationContext'
import { executeCommand } from '@/utils/CommandExecutor'
import { setToastCallback } from './keyer-api'
import { MainExtensionInstance } from '../main'

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
    return [
      {
        commandId: '@system#main',
        element: MainExtensionInstance.doAction('main') as React.ReactElement,
        windowSize: 'normal'
      }
    ]
  })

  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false
  })

  // 当前视图是栈顶元素
  const viewState = viewStack[viewStack.length - 1]

  // 监听视图切换，调整窗口大小
  useEffect(() => {
    if (!viewState) return

    const { ipcRenderer } = window.require('electron')

    const windowSize = viewState.windowSize || 'normal'

    if (windowSize === 'large') {
      ipcRenderer.invoke('resize-window', 1200, 700)
    } else {
      ipcRenderer.invoke('restore-window-size')
    }
  }, [viewState])

  // 初始化 CommandManager
  useEffect(() => {
    CommandManager.initializeFromRenderer()
  }, [])

  // 监听事件
  useEffect(() => {
    const { ipcRenderer } = window.require('electron')

    // 处理 execute-command 事件：统一的命令执行入口
    const handleExecuteCommand = async (_: any, commandId: string) => {
      if (!CommandManager.isReady()) {
        console.warn('CommandManager not ready')
        return
      }

      const commandManager = CommandManager.getInstance()
      const command = commandManager.getCommand(commandId)

      if (command) {
        const navigateTo = (newViewState: ViewState) => {
          newViewState.windowSize = newViewState.windowSize || 'normal'
          setViewStack([newViewState])
        }
        // 调用全局命令执行器
        await executeCommand(command.ucid, { navigateTo })
      } else {
        console.warn('Command not found:', commandId)
      }
    }

    ipcRenderer.on('execute-command', handleExecuteCommand)

    // 使用 ConfigManager 单例获取主题
    const configManager = ConfigManager.getInstance()
    const config = configManager.getConfig()
    if (config && config.theme) {
      const nextTheme = config.theme === 'light' ? 'light' : 'dark'
      setTheme(nextTheme)
    }

    // 设置 toast 回调
    setToastCallback((message: string, duration: number) => {
      setToast({ message, visible: true })
      setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }))
      }, duration)
    })

    return () => {
      ipcRenderer.removeListener('execute-command', handleExecuteCommand)
    }
  }, [])

  // 全局键盘快捷键处理
  useEffect(() => {
    const handleGlobalKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()

        // 1. 调用当前扩展的 doBack() 方法
        let shouldGoBack = true

        if (CommandManager.isReady() && viewState) {
          const commandManager = CommandManager.getInstance()
          const currentCommandId = viewState.commandId

          // 调用当前视图对应扩展的 doBack()
          shouldGoBack = commandManager.callDoBack(currentCommandId)
        }

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
  }, [viewStack, viewState])

  // 创建导航上下文值
  const navigationValue: NavigationContextType = useMemo(() => ({
    navigateTo: (newViewState: ViewState) => {
      // 将新视图压入栈
      setViewStack(prev => [...prev, newViewState])
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
    currentView: viewState
  }), [viewState, viewStack])

  // 渲染当前视图
  const renderView = () => {
    if (!viewState) {
      return null
    }
    return viewState.element
  }

  return (
    <NavigationContext.Provider value={navigationValue}>
      {renderView()}
    </NavigationContext.Provider>
  )
}

export default App
