import { useNavigation } from './useNavigation'
import { useRef, useEffect, useState } from 'react'

/**
 * 获取当前页面名称并检测是否为栈顶页面
 * 在组件创建时绑定当前的pageName，只有当绑定的pageName与栈顶一致时才返回true
 *
 * @returns 当前组件绑定的页面是否为栈顶页面
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isVisible = usePageVisible()
 *   // 只有当组件创建时的页面仍为栈顶时，isVisible才为true
 * }
 * ```
 */
export function usePageVisible(): boolean {
  const { currentPage } = useNavigation()
  const boundPageName = useRef<string | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  
  // 在组件首次渲染时绑定当前页面名称
  useEffect(() => {
    if (boundPageName.current === null) {
      boundPageName.current = currentPage?.pageName || '@system#main'
    }
  }, [])
  
  // 检测绑定的页面名称是否与当前栈顶页面一致
  useEffect(() => {
    const currentPageName = currentPage?.pageName || '@system#main'
    setIsVisible(boundPageName.current === currentPageName)
  }, [currentPage])
  
  return isVisible
}
