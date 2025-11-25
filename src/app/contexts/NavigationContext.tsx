import { useState, useCallback, useEffect, ReactNode, useRef } from 'react'
import { NavigationContext, PageStackItem } from 'keyerext'
import { commandManager } from '../managers/CommandManager'

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<PageStackItem[]>(() => {
    console.log('🚀 Navigation initialized')

    // 开发模式下默认显示 Main 页面
    if (import.meta.env.DEV) {
      const mainElement = commandManager.execute('@sysetem#main')
      if (mainElement) {
        console.log('🔧 DEV mode: Auto-show Main page')
        return [{ pageName: '@sysetem#main', element: mainElement }]
      }
    }

    return []
  })

  const escapeHandlerRef = useRef<(() => boolean) | null>(null)

  const registerEscapeHandler = useCallback((handler: () => boolean) => {
    escapeHandlerRef.current = handler
  }, [])

  const unregisterEscapeHandler = useCallback(() => {
    escapeHandlerRef.current = null
  }, [])

  const pop = useCallback(() => {
    setStack(prev => {
      if (prev.length === 0) return prev

      const newStack = prev.slice(0, -1)
      console.log('📤 Pop:', prev[prev.length - 1].pageName, '→', newStack[newStack.length - 1]?.pageName || 'empty')

      if (window.electronAPI?.onStackChange) {
        window.electronAPI.onStackChange(newStack.length)
      }

      return newStack
    })
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('⌨️  ESC')

        // 如果有组件注册了 Escape 处理器，先调用它
        if (escapeHandlerRef.current) {
          const shouldPop = escapeHandlerRef.current()
          console.log('🎯 Component handled ESC:', shouldPop ? 'allow pop' : 'prevent pop')
          if (shouldPop) {
            pop()
          }
        } else {
          // 没有处理器时，直接执行 pop
          pop()
        }
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [pop])

  useEffect(() => {
    if (window.electronAPI?.onNavigateToPage) {
      window.electronAPI.onNavigateToPage((pageName: string) => {
        console.log('📨 Shortcut triggered:', pageName)

        setStack(() => {
          console.log('🆕 Create:', pageName)
          const element = commandManager.execute(pageName)
          if (!element) {
            console.error('❌ Failed to create:', pageName)
            return []
          }

          if (window.electronAPI?.onStackChange) {
            window.electronAPI.onStackChange(1)
          }
          return [{ pageName, element }]
        })
      })
    }
  }, [])

  const push = useCallback((page: string) => {
    setStack(prev => {
      console.log('📥 Push:', page)

      const element = commandManager.execute(page)
      if (!element) {
        console.error('❌ Failed to create:', page)
        return prev
      }

      const newStack = [...prev, { pageName: page, element }]

      if (window.electronAPI?.onStackChange) {
        window.electronAPI.onStackChange(newStack.length)
      }

      return newStack
    })
  }, [])

  const currentPage = stack.length > 0 ? stack[stack.length - 1] : null

  return (
    <NavigationContext.Provider value={{ push, pop, currentPage, stack, registerEscapeHandler, unregisterEscapeHandler }}>
      {children}
    </NavigationContext.Provider>
  )
}