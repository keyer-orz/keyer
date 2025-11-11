// 核心接口定义

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

// Panel 相关接口

// List 列表项
export interface IListItem {
  id: string
  title: string
  subtitle?: string
  icon?: string
  accessories?: string[]  // 右侧附加信息
  action?: IAction  // 点击时执行的动作
}

// Panel 配置（只支持自定义 React 组件）
export interface IPanelConfig {
  title: string
  component: string  // 组件名称（需要在扩展的 UI 入口中导出）
  props?: Record<string, any>  // 传递给组件的 props
}

// Panel 控制器
export interface IPanelController {
  // 显示面板
  showPanel(config: IPanelConfig): void

  // 关闭面板
  closePanel(): void

  // 更新面板内容
  updatePanel(props: Record<string, any>): void
}

export interface IExtension {
  // 扩展的存储实例（由框架注入）
  store?: IStore

  // 面板控制器（由框架注入）
  panel?: IPanelController

  // 准备阶段，返回扩展提供的 actions
  // 返回的 action 不需要设置 id，由 ExtensionManager 自动生成（格式：extensionId#key）
  onPrepare(): Promise<IActionDef[]> | IActionDef[]

  // 执行命令
  // key: action 的唯一标识符（来自 IActionDef 中定义的 key）
  // 返回 true: 保持主面板打开
  // 返回 false: 自动关闭主面板
  doAction(key: string): Promise<boolean> | boolean
}

// Extension 的包配置定义
export interface ExtensionPackage {
  id: string
  name: string  // 小写中线命名，如 "panel-demo"
  title: string  // 对外显示的标题，如 "Panel Demo"
  version: string
  commands: ICommand[]
  main: string  // 主进程入口文件
  ui?: string   // 渲染进程 UI 组件入口文件（可选）
}

// React Hooks
export { useStore, ExtensionIdContext } from './hooks'
