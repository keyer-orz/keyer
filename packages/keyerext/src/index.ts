// 核心接口定义

export interface ICommand {
  id: string
  name: string
  desc: string
}

export interface IAction extends ICommand {
  typeLabel?: string  // 类型标签，如 "Command", "Script", "System" 等
  ext?: any  // 扩展字段，由 onSearch 返回，并传递给 doAction
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

// Board 卡片项
export interface IBoardItem {
  id: string
  title: string
  description?: string
  icon?: string
  metadata?: Record<string, string>  // 元数据键值对
  action?: IAction
}

// Panel 类型
export type PanelType = 'list' | 'board'

// Panel 配置
export interface IPanelConfig {
  type: PanelType
  title: string
  items: IListItem[] | IBoardItem[]
  placeholder?: string  // 搜索占位符
  onSearch?: (query: string) => Promise<IListItem[] | IBoardItem[]>  // 搜索回调
  onAction?: (item: IListItem | IBoardItem) => Promise<void>  // 点击回调
}

// Panel 控制器
export interface IPanelController {
  // 显示面板
  showPanel(config: IPanelConfig): void

  // 关闭面板
  closePanel(): void

  // 更新面板内容
  updatePanel(items: IListItem[] | IBoardItem[]): void
}

export interface IExtension {
  // 扩展的存储实例（由框架注入）
  store?: IStore

  // 面板控制器（由框架注入）
  panel?: IPanelController

  // 准备阶段
  onPrepare(): Promise<void> | void

  // 根据关键字返回结果
  onSearch(input: string): Promise<IAction[]> | IAction[]

  // 执行命令
  doAction(action: IAction): Promise<void> | void
}

// Extension 的包配置定义
export interface ExtensionPackage {
  id: string
  name: string
  version: string
  commands: ICommand[]
  main: string  // 扩展的入口文件
}
