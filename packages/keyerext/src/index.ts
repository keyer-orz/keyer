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

export interface IExtension {
  // 扩展的存储实例（由框架注入）
  store?: IStore

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
