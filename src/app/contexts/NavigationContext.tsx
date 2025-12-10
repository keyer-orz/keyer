import { useState, useCallback, useEffect, ReactNode } from 'react'
import { NavigationContext, PageStackItem } from 'keyerext'
import { commandManager } from '@/app/managers/CommandManager'
import { Keyer } from '@/app/keyer'
import { ipcRenderer } from 'electron'
import { console } from 'inspector'

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
    return []
  })


  // ==================== Navigation Actions ====================

  /**
   * 将新页面压入栈顶
   */
  const push = useCallback((page: string) => {
    setStack(prev => {
      console.log('📥 Push:', page)

      const result = commandManager.execute(page)
      if (!result) {
        if (prev.length === 1 && prev[0].pageName === "@system#main") {
          Keyer.window.hide()
        }
        return prev
      }

      const newStack = [...prev, {
        pageName: page,
        element: result.element,
        windowSize: result.windowSize,
        ctx: result.ctx,
      }]

      // 有页面时显示窗口并调整尺寸
      if (newStack.length > 0) {
        // 总是调整窗口尺寸：使用配置的尺寸或默认尺寸
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

      const poppedPage = prev[prev.length - 1]
      const newStack = prev.slice(0, -1)
      console.log('📤 Pop:', poppedPage.pageName, '→', newStack[newStack.length - 1]?.pageName || 'empty')

      // 没有页面时隐藏窗口
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
  const registerEscapeHandler = useCallback((handler: () => boolean) => {
    setStack(prev => {
      if (prev.length === 0) return prev

      const currentPage = prev[prev.length - 1]

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
    const handleNavigate = (pageName: string) => {
      console.log('📨 Shortcut triggered:', pageName)

      setStack((prev) => {
        // 如果当前栈中只有一个页面，且就是要导航的页面，直接复用
        if (prev.length === 1 && prev[0].pageName === pageName) {
          console.log('♻️  Reuse existing page:', pageName)
          // 显示窗口（可能是隐藏状态），并确保尺寸正确
          const targetSize = prev[0].windowSize || { width: 800, height: 500 }
          Keyer.window.resize(targetSize)
          Keyer.window.show()
          return prev
        }
        // 否则，创建新页面并替换整个栈
        console.log("111")
        const result = commandManager.execute(pageName)
        if (!result) {
          return []
        }
        // 总是调整窗口尺寸：使用配置的尺寸或默认尺寸
        const targetSize = result.windowSize || { width: 800, height: 500 }
        Keyer.window.resize(targetSize)
        Keyer.window.show()
        return [{ pageName, element: result.element, windowSize: result.windowSize, ctx: result.ctx }]
      })
    }
    const handler = (_event: any, pageName: string) => handleNavigate(pageName)
    ipcRenderer.on('navigate-to-page', handler)
    return () => {
      ipcRenderer.removeListener('navigate-to-page', handler)
    } 
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