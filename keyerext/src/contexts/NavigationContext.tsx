import { createContext, ReactElement } from 'react'

export interface PageStackItem {
  pageName: string
  element: ReactElement
}

export interface NavigationContextType {
  push: (page: string) => void
  pop: () => void
  currentPage: PageStackItem | null
  stack: PageStackItem[]
  registerEscapeHandler: (handler: () => boolean) => void
  unregisterEscapeHandler: () => void
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined)
