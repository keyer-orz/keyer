// 使用主 App 的 React 实例，避免多实例冲突
import type * as ReactType from 'react'

// 延迟获取 React，避免在模块加载时就访问 window.React
function getReact(): typeof ReactType {
  if (typeof window !== 'undefined' && (window as any).React) {
    return (window as any).React
  }
  return require('react')
}

// Extension ID Context - 用于在 Panel 中注入当前的 extensionId
export const ExtensionIdContext = getReact().createContext<string | null>(null)

declare global {
  interface Window {
    extensionStore: {
      get: (extensionId: string, key: string, defaultValue?: any) => Promise<any>
      set: (extensionId: string, key: string, value: any) => Promise<boolean>
      delete: (extensionId: string, key: string) => Promise<boolean>
      keys: (extensionId: string) => Promise<string[]>
    }
  }
}

/**
 * React Hook 用于访问 Extension Store
 * @param extensionId Extension ID (例如: 'com.keyer.panel-demo')
 * @param key Store 键名
 * @param defaultValue 默认值
 */
export function useExtensionStore<T = any>(
  extensionId: string,
  key: string,
  defaultValue?: T
): [T | undefined, (value: T) => Promise<void>, () => Promise<void>] {
  const React = getReact()
  const [value, setValue] = React.useState<T | undefined>(defaultValue)

  // 加载初始值
  React.useEffect(() => {
    if (window.extensionStore) {
      window.extensionStore.get(extensionId, key, defaultValue).then(setValue)
    }
  }, [extensionId, key, defaultValue])

  // 更新值
  const updateValue = React.useCallback(
    async (newValue: T) => {
      if (window.extensionStore) {
        const success = await window.extensionStore.set(extensionId, key, newValue)
        if (success) {
          setValue(newValue)
        }
      }
    },
    [extensionId, key]
  )

  // 删除值
  const deleteValue = React.useCallback(async () => {
    if (window.extensionStore) {
      const success = await window.extensionStore.delete(extensionId, key)
      if (success) {
        setValue(defaultValue)
      }
    }
  }, [extensionId, key, defaultValue])

  return [value, updateValue, deleteValue]
}

/**
 * React Hook 用于获取 Extension Store 的所有键
 * @param extensionId Extension ID
 */
export function useExtensionStoreKeys(extensionId: string): string[] {
  const React = getReact()
  const [keys, setKeys] = React.useState<string[]>([])

  React.useEffect(() => {
    if (window.extensionStore) {
      window.extensionStore.keys(extensionId).then(setKeys)
    }
  }, [extensionId])

  return keys
}

/**
 * 简化版 React Hook - 自动从 Context 获取 Extension ID
 * 只能在 Panel 组件内使用
 * @param key Store 键名
 * @param defaultValue 默认值
 */
export function useStore<T = any>(
  key: string,
  defaultValue?: T
): [T | undefined, (value: T) => Promise<void>, () => Promise<void>] {
  const React = getReact()
  const extensionId = React.useContext(ExtensionIdContext)

  if (!extensionId) {
    throw new Error('useStore must be used within an ExtensionIdContext.Provider')
  }

  return useExtensionStore<T>(extensionId, key, defaultValue)
}
