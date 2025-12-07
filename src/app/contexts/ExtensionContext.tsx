import { ReactNode } from 'react'
import { ExtensionContext, ExtensionContextType } from 'keyerext'

interface ExtensionProviderProps {
  ctx: ExtensionContextType
  children: ReactNode
}

export function ExtensionProvider({ ctx, children }: ExtensionProviderProps) {
  return (
    <ExtensionContext.Provider value={ctx}>
      {children}
    </ExtensionContext.Provider>
  )
}
