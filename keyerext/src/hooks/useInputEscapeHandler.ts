import { RefObject } from 'react'
import { useEscapeHandler } from './useEscapeHandler'
import type { InputRef } from '../components/Input'

/**
 * Input 组件专用的 Escape 处理器
 * 按下 Esc 时的行为：
 * 1. 如果 Input 未聚焦 -> 聚焦
 * 2. 如果 Input 已聚焦且不为空 -> 清空
 * 3. 如果 Input 已聚焦且为空 -> 返回 true (允许关闭页面)
 *
 * @param inputRef - Input 组件的 ref
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const inputRef = useRef<InputRef>(null)
 *   const [searchText, setSearchText] = useState('')
 *
 *   useInputEscapeHandler(inputRef)
 *
 *   return <Input ref={inputRef} value={searchText} onChange={setSearchText} />
 * }
 * ```
 */
export function useInputEscapeHandler(inputRef: RefObject<InputRef>) {
  useEscapeHandler(() => {
    const input = inputRef.current

    if (!input) {
      return true
    }

    // 检查 Input 是否聚焦
    if (!input.isFocused()) {
      // 未聚焦 -> 聚焦
      input.focus()
      return false // 阻止关闭
    }

    if (!input.isEmpty()) {
      // 已聚焦且不为空 -> 清空
      input.clear()
      return false // 阻止关闭
    }

    // 已聚焦且为空 -> 允许关闭
    return true
  })
}
