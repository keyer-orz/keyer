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

export interface IExtension {
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
