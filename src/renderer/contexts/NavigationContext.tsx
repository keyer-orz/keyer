import React, { createContext, useContext } from 'react'

/**
 * 窗口大小类型
 */
export type WindowSize = 'normal' | 'large'

/**
 * 视图状态定义
 */
export interface ViewState {
  type: 'main' | 'extension' | 'system'
  extensionComponent?: React.ComponentType<any>
  extensionElement?: React.ReactElement
  extensionProps?: Record<string, any>
  windowSize?: WindowSize
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
