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

// 扩展返回的 UI 结果类型
// - null: 关闭主面板 / 不显示 UI
// - React.ReactElement: 显示 React 元素
export type ExtensionUIResult = null | React.ReactElement

export interface IExtension {
  // 扩展的存储实例（由框架注入）
  store?: IStore

  // 是否启用预览功能（默认 false）
  enabledPreview?: boolean

  // 准备阶段，返回扩展提供的 actions
  // 返回的 action 不需要设置 id，由 ExtensionManager 自动生成（格式：extensionId#key）
  onPrepare(): Promise<IActionDef[]> | IActionDef[]

  // 执行命令
  // key: action 的唯一标识符（来自 IActionDef 中定义的 key）
  // 返回值：
  //   - null: 关闭主面板
  //   - React.ReactElement: 切换至插件的二级面板
  doAction(key: string): Promise<ExtensionUIResult> | ExtensionUIResult

  // 预览功能（可选）
  // 当用户输入时，如果 enabledPreview 为 true，会调用此方法
  // input: 用户当前输入的内容
  // 返回值：
  //   - null: 不显示预览
  //   - React.ReactElement: 在列表顶部显示的预览元素
  onPreview?(input: string): Promise<ExtensionUIResult> | ExtensionUIResult
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

// React Components
export { List, Item } from './components/List'
export type { ListItem, ListSection, ListProps, ItemProps, ListHandle } from './components/List'
export { Input } from './components/Input'
export type { InputProps, InputHandle } from './components/Input'
export { Panel } from './components/Panel'
export type { PanelProps } from './components/Panel'
export { Text } from './components/Text'
export type { TextProps, TextVariant } from './components/Text'
