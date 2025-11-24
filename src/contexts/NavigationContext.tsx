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
    const mainElement = commandManager.execute('@sysetem#main')
    if (!mainElement) {
      console.error('❌ Failed to create Main page')
      return []
    }
    return [{ pageName: '@sysetem#main', element: mainElement }]
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

  const push = useCallback((page: string) => {
    setStack(prev => {
      console.log('📥 Push request:', page, 'Current stack:', prev.map(p => p.pageName))

      // 从栈中查找是否已存在该页面实例
      const existing = prev.find(item => item.pageName === page)

      if (existing) {
        console.log('♻️  Reuse:', page, '(same object:', existing === prev.find(p => p === existing), ')')
        return [...prev, existing]
      }

      console.log('🆕 Create:', page)
      const element = commandManager.execute(page)
      if (!element) {
        console.error('❌ Failed to create:', page)
        return prev
      }

      return [...prev, { pageName: page, element }]
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
