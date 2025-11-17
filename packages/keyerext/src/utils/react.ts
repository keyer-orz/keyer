/**
 * React 实例管理工具
 *
 * 为了避免多 React 实例冲突，优先使用主 App 注入的 React 实例（window.React）
 * 如果没有，则使用 peerDependency 的 react
 */

import * as ReactModule from 'react'

// 获取 React 实例（优先使用 window.React）
const React = (typeof window !== 'undefined' && (window as any).React)
  ? (window as any).React
  : ReactModule

// 默认导出 React 实例供 JSX 使用，类型始终使用 ReactModule 的类型
export default React as typeof ReactModule

/**
 * 获取全局 React 实例
 * @deprecated 推荐直接 import React from '../utils/react'
 */
export function getReact() {
  return React
}
