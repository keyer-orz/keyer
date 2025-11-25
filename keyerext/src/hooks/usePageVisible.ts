import { useEffect, useState } from 'react'
import { useNavigation } from './useNavigation'

/**
 * 检测当前组件所在的页面是否可见
 *
 * @returns 当前页面是否为栈顶（可见）页面
 *
 * @example
 * ```tsx
 * function MyPage() {
 *   const isVisible = usePageVisible()
 *
 *   useEffect(() => {
 *     if (isVisible) {
 *       console.log('Page is now visible')
 *     }
 *   }, [isVisible])
 * }
 * ```
 */
export function usePageVisible(): boolean {
  const { currentPage } = useNavigation()
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    setIsVisible(true)
  }, [currentPage])

  return isVisible
}
