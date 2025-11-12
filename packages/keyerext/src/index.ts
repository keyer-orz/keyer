// 核心接口定义
import type * as React from 'react'

export interface ICommand {
  id: string
  key: string
  name: string
  desc: string
}

export interface IAction extends ICommand {
  typeLabel?: string  // 类型标签，如 "Command", "Script", "Extension" 等
}

// Extension Action 定义（用于 onPrepare 返回）
export interface IActionDef {
  name: string
  desc: string
  typeLabel?: string
  key: string
}

// Store 接口，提供简单的 key-value 存储
export interface IStore {
  // 获取值
  get<T = any>(key: string): T | undefined
  get<T = any>(key: string, defaultValue: T): T

  // 设置值
  set(key: string, value: any): void

  // 删除值
  delete(key: string): void

  // 清空所有数据
  clear(): void

  // 获取所有键
  keys(): string[]

  // 判断键是否存在
  has(key: string): boolean
}

// Extension 执行结果
export interface IExtensionResult {
  // 是否保持主窗口打开
  keepOpen?: boolean

  // 要显示的 React 组件（可选）
  component?: React.ComponentType<any>

  // 传递给组件的 props（可选）
  props?: Record<string, any>
}

export interface IExtension {
  // 扩展的存储实例（由框架注入）
  store?: IStore

  // 准备阶段，返回扩展提供的 actions
  // 返回的 action 不需要设置 id，由 ExtensionManager 自动生成（格式：extensionId#key）
  onPrepare(): Promise<IActionDef[]> | IActionDef[]

  // 执行命令
  // key: action 的唯一标识符（来自 IActionDef 中定义的 key）
  // 返回值：
  //   - boolean: true 保持主面板打开，false 自动关闭主面板
  //   - IExtensionResult: 详细控制结果，可以返回 React 组件
  doAction(key: string): Promise<boolean | IExtensionResult> | boolean | IExtensionResult
}

// Extension 的包配置定义
export interface ExtensionPackage {
  id: string
  name: string  // 小写中线命名，如 "panel-demo"
  title: string  // 对外显示的标题，如 "Panel Demo"
  version: string
  commands: ICommand[]
  main: string  // 主进程入口文件
}

// React Hooks
export { useStore, ExtensionIdContext } from './hooks'
