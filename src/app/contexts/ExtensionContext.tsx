import { ReactNode } from 'react'
import { ExtensionContext, ExtensionContextType, IExtensionMeta } from 'keyerext'

interface ExtensionProviderProps {
  meta: IExtensionMeta
  children: ReactNode
}

export function ExtensionProvider({ meta, children }: ExtensionProviderProps) {
  const contextValue: ExtensionContextType = {
    meta,
  }

  return (
    <ExtensionContext.Provider value={contextValue}>
      {children}
    </ExtensionContext.Provider>
  )
}
