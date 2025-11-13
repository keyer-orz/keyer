import React, { createContext, useContext } from 'react'

/**
 * 视图状态定义
 */
export interface ViewState {
  type: 'main' | 'extension' | 'settings'
  extensionComponent?: React.ComponentType<any>
  extensionElement?: React.ReactElement
  extensionProps?: Record<string, any>
}

/**
 * 导航上下文类型 - 只包含通用的 navigateTo 方法
 * 所有特定导航逻辑通过 SystemCommand 实现
 */
export interface NavigationContextType {
  navigateTo: (viewState: ViewState) => void
  currentView: ViewState
}

export const NavigationContext = createContext<NavigationContextType | null>(null)

export function useNavigation(): NavigationContextType {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider')
  }
  return context
}
