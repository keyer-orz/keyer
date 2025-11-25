import { useEffect, RefObject } from 'react'
import { useNavigation } from './useNavigation'
import type { InputRef } from '../components/Input'

/**
 * 当页面变为可见（成为栈顶）时，自动聚焦指定的 Input
 *
 * @param inputRef - Input 组件的 ref
 *
 * @example
 * ```tsx
 * function MyPage() {
 *   const inputRef = useRef<InputRef>(null)
 *
 *   // 当页面显示时自动聚焦
 *   useAutoFocusOnVisible(inputRef)
 *
 *   return <Input ref={inputRef} />
 * }
 * ```
 */
export function useAutoFocusOnVisible(inputRef: RefObject<InputRef>) {
  const { currentPage } = useNavigation()

  useEffect(() => {
    // 当 currentPage 变化时（包括返回到此页面时），聚焦 Input
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [currentPage, inputRef])
}
