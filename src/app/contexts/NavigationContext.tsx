import { useState, useCallback, useEffect, ReactNode } from 'react'
import { NavigationContext, PageStackItem } from 'keyerext'
import { commandManager } from '../managers/CommandManager'

/**
 * NavigationProvider 管理页面栈和导航逻辑
 *
 * 功能：
 * - 维护页面栈（stack），支持 push/pop 操作
 * - 处理全局 ESC 键事件，支持自定义 escape handler
 * - 监听 Electron 快捷键触发的页面跳转
 * - 通知 Electron 主进程窗口栈变化
 */
export function NavigationProvider({ children }: { children: ReactNode }) {
  // ==================== State ====================

  const [stack, setStack] = useState<PageStackItem[]>(() => {
    console.log('🚀 Navigation initialized')

    // 开发模式下默认显示 Main 页面
    if (import.meta.env.DEV) {
      const mainElement = commandManager.execute('@system#main')
      if (mainElement) {
        console.log('🔧 DEV mode: Auto-show Main page')
        return [{ pageName: '@system#main', element: mainElement }]
      }
    }

    return []
  })


  // ==================== Navigation Actions ====================

  /**
   * 将新页面压入栈顶
   */
  const push = useCallback((page: string) => {
    setStack(prev => {
      console.log('📥 Push:', page)

      const element = commandManager.execute(page)
      if (!element) {
        console.error('❌ Failed to create:', page)
        return prev
      }

      const newStack = [...prev, { pageName: page, element }]
      window.electronAPI.onStackChange(newStack.length)

      return newStack
    })
  }, [])

  /**
   * 弹出栈顶页面
   */
  const pop = useCallback(() => {
    setStack(prev => {
      if (prev.length === 0) return prev

      const poppedPage = prev[prev.length - 1]
      const newStack = prev.slice(0, -1)
      console.log('📤 Pop:', poppedPage.pageName, '→', newStack[newStack.length - 1]?.pageName || 'empty')

      window.electronAPI.onStackChange(newStack.length)

      return newStack
    })
  }, [])

  // ==================== Escape Handler Management ====================

  /**
   * 为栈顶页面注册 escape handler
   * handler 返回 true 表示允许关闭页面，false 表示阻止关闭
   */
  const registerEscapeHandler = useCallback((handler: () => boolean) => {
    setStack(prev => {
      if (prev.length === 0) return prev

      const currentPage = prev[prev.length - 1]
      console.log('📝 Register escape handler for:', currentPage.pageName)

      const newStack = [...prev]
      newStack[newStack.length - 1] = { ...currentPage, escapeHandler: handler }
      return newStack
    })
  }, [])

  /**
   * 移除栈顶页面的 escape handler
   */
  const unregisterEscapeHandler = useCallback(() => {
    setStack(prev => {
      if (prev.length === 0) return prev

      const currentPage = prev[prev.length - 1]
      console.log('🗑️  Unregister escape handler for:', currentPage.pageName)

      const newStack = [...prev]
      newStack[newStack.length - 1] = { ...currentPage, escapeHandler: undefined }
      return newStack
    })
  }, [])

  // ==================== Global Escape Key Handler ====================

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('⌨️  ESC')

        const currentPage = stack[stack.length - 1]
        if (!currentPage) return

        const handler = currentPage.escapeHandler

        if (handler) {
          // 页面自定义处理
          console.log('🔍 Found escape handler for:', currentPage.pageName)
          const shouldPop = handler()
          console.log('🎯 Handler result:', shouldPop ? 'allow pop' : 'prevent pop')

          if (shouldPop) {
            pop()
          }
        } else {
          // 默认行为：直接出栈
          console.log('✅ Default ESC behavior: pop')
          pop()
        }
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [stack, pop])

  // ==================== Electron Shortcut Integration ====================

  useEffect(() => {
    window.electronAPI.onNavigateToPage((pageName: string) => {
      console.log('📨 Shortcut triggered:', pageName)

      setStack(() => {
        console.log('🆕 Create:', pageName)
        const element = commandManager.execute(pageName)
        if (!element) {
          console.error('❌ Failed to create:', pageName)
          return []
        }
        window.electronAPI.onStackChange(1)
        return [{ pageName, element }]
      })
    })
  }, [])

  // ==================== Render ====================

  const currentPage = stack.length > 0 ? stack[stack.length - 1] : null

  return (
    <NavigationContext.Provider
      value={{
        push,
        pop,
        currentPage,
        stack,
        registerEscapeHandler,
        unregisterEscapeHandler
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}