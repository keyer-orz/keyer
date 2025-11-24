import { createContext, useContext, useState, useCallback, useEffect, ReactNode, ReactElement } from 'react'
import { commandManager } from '../managers/CommandManager'

interface PageStackItem {
  pageName: string
  element: ReactElement
}

interface NavigationContextType {
  push: (page: string) => void
  pop: () => void
  currentPage: PageStackItem | null
  stack: PageStackItem[]
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

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
        pop()
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
    <NavigationContext.Provider value={{ push, pop, currentPage, stack }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}
