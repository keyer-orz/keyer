import { useEffect, useRef } from 'react'
import { useNavigation } from './useNavigation'

/**
 * Escape 处理器 hook
 * @param handler - 布尔值或函数，决定是否允许 Esc 关闭页面
 *                 - boolean: true 阻止关闭, false 允许关闭
 *                 - function: 返回 true 允许关闭, false 阻止关闭
 *
 * @example
 * ```tsx
 * // 使用布尔值
 * function MyComponent() {
 *   const [preventClose, setPreventClose] = useState(false)
 *   useEscapeHandler(preventClose)
 *
 *   return <Switch checked={preventClose} onChange={setPreventClose} />
 * }
 *
 * // 使用函数
 * function MyComponent() {
 *   const [hasChanges, setHasChanges] = useState(false)
 *   useEscapeHandler(() => {
 *     if (hasChanges) {
 *       return window.confirm('有未保存的更改，确定退出吗？')
 *     }
 *     return true
 *   })
 *
 *   return <input onChange={() => setHasChanges(true)} />
 * }
 * ```
 */
export function useEscapeHandler(handler: boolean | (() => boolean)) {
  const { registerEscapeHandler, unregisterEscapeHandler } = useNavigation()
  const handlerRef = useRef(handler)

  // 保持 handlerRef 同步
  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    const escapeHandler = () => {
      const currentHandler = handlerRef.current
      if (typeof currentHandler === 'function') {
        return currentHandler()
      }
      return !currentHandler
    }

    registerEscapeHandler(escapeHandler)
    return () => {
      unregisterEscapeHandler()
    }
  }, [registerEscapeHandler, unregisterEscapeHandler])
}
