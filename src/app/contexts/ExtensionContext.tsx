import { ReactNode } from 'react'
import { ExtensionContext, ExtensionContextType, IExtensionMeta } from 'keyerext'
import { ExtensionMeta } from '../../shared/extension'

interface ExtensionProviderProps {
  meta: ExtensionMeta
  children: ReactNode
}

export function ExtensionProvider({ meta, children }: ExtensionProviderProps) {
  // 将 ExtensionMeta 转换为 IExtensionMeta 接口
  const extensionMeta: IExtensionMeta = {
    dir: meta.pkg.dir
  }

  const contextValue: ExtensionContextType = {
    meta: extensionMeta,
    // 可以从 configManager 获取更多全局配置
  }

  return (
    <ExtensionContext.Provider value={contextValue}>
      {children}
    </ExtensionContext.Provider>
  )
}
