import React, { createContext, useContext } from 'react'

/**
 * 窗口大小类型
 */
export type WindowSize = 'normal' | 'large'

/**
 * 视图状态定义
 * 简化版：只存储命令执行后的必要信息
 */
export interface ViewState {
  commandId: string  // 命令 ID，用于栈管理和标识
  element: React.ReactElement  // 要渲染的 React 元素
  windowSize?: WindowSize  // 窗口大小
}

/**
 * 导航上下文类型
 */
export interface NavigationContextType {
  // 导航到新视图（压栈）
  navigateTo: (viewState: ViewState) => void
  // 返回上一页（出栈）
  navigateBack: () => void
  // 当前视图状态
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
