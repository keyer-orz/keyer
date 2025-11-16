import React, { createContext, useContext } from 'react'

/**
 * 窗口大小类型
 */
export type WindowSize = 'normal' | 'large'

/**
 * 视图状态定义
 */
export interface ViewState {
  commandId: string  // 命令 ID，用于栈管理
  type: 'main' | 'extension' | 'system'
  extensionComponent?: React.ComponentType<any>
  extensionElement?: React.ReactElement
  extensionProps?: Record<string, any>
  windowSize?: WindowSize
}

/**
 * 导航上下文类型
 */
export interface NavigationContextType {
  // 导航到指定命令
  navigateToCommand: (commandId: string) => void
  // 返回上一页
  navigateBack: () => void
  // 当前视图状态
  currentView: ViewState
  // 兼容旧版：通过 ViewState 导航（已废弃）
  navigateTo: (viewState: ViewState) => void
}

export const NavigationContext = createContext<NavigationContextType | null>(null)

export function useNavigation(): NavigationContextType {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider')
  }
  return context
}
