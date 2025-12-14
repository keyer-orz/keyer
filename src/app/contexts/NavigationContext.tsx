import { useState, useCallback, useEffect, useMemo, useRef, ReactNode } from 'react'
import { NavigationContext, PageStackItem } from 'keyerext'
import { commandManager } from '@/app/managers/CommandManager'
import { Keyer } from '@/app/keyer'
import { ipcRenderer } from 'electron'
import { console } from 'inspector'

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<PageStackItem[]>(() => {
    console.log('🚀 Navigation initialized')
    return []
  })

  const backHandlersRef = useRef<() => boolean>(() => { return false })

  /**
   * 将新页面压入栈顶
   */
  const push = useCallback((page: string) => {
    setStack(prev => {
      console.log('📥 Push:', page)

      const result = commandManager.execute(page)
      if (!result) { // 该命令非 view 类型，忽略
        if (prev.length === 1 && prev[0].pageName === "@system#main") {
          Keyer.window.hide()
        }
        return []
      }

      const newStack = [...prev, {
        pageName: page,
        element: result.element,
        windowSize: result.windowSize,
        ctx: result.ctx,
      }]

      backHandlersRef.current = () => { return true }

      if (newStack.length > 0) {
        const targetSize = result.windowSize || { width: 800, height: 500 }
        Keyer.window.resize(targetSize)
        Keyer.window.show()
      }

      return newStack
    })

  }, [])

  /**
   * 弹出栈顶页面
   */
  const pop = useCallback(() => {
    setStack(prev => {
      if (prev.length === 0) return prev
      backHandlersRef.current = () => { return true }

      const newStack = prev.slice(0, -1)
      if (newStack.length === 0) {
        Keyer.window.hide()
      } else {
        const targetSize = newStack[newStack.length - 1]?.windowSize || { width: 800, height: 500 }
        Keyer.window.resize(targetSize)
        Keyer.window.show()
      }
      return newStack
    })
  }, [])

  // ==================== Escape Handler Management ====================

  /**
   * 为栈顶页面注册 escape handler
   * handler 返回 true 表示允许关闭页面，false 表示阻止关闭
   */
  const escapeHandler = useCallback((handler: () => boolean) => {
    backHandlersRef.current = handler
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      console.log("esc backHandlersRef", backHandlersRef.current)
      if (backHandlersRef.current()) {
        pop()
        return
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [stack])

  useEffect(() => {
    const handler = (_event: any, pageName: string) => push(pageName)
    ipcRenderer.on('navigate-to-page', handler)
    return () => {
      ipcRenderer.removeListener('navigate-to-page', handler)
    }
  }, [])

  const currentPage = stack.length > 0 ? stack[stack.length - 1] : null

  const contextValue = useMemo(() => ({
    push,
    pop,
    currentPage,
    stack,
    escapeHandler,
  }), [push, pop, currentPage, stack, escapeHandler])

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  )
}