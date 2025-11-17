// 核心接口定义
// Command 定义（文档规范）
export interface ICommand {
  ucid: string        // unique command id: 如 "ext.name#cmd.name" 或 "@script#script.name"
  icon?: string       // 图标（emoji 或图标路径）
  name: string        // 存储名称
  title: string       // 展示名称
  desc: string        // 展示描述
  type?: string       // 类型：Command、Script 等
  source?: 'dev' | 'mine' | 'sandbox'  // 来源标记
  windowSize?: 'normal' | 'large'  // 窗口大小
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
export type ExtensionResult = null | React.ReactElement | boolean

export interface IExtension {
  // 扩展的存储实例（由框架注入）
  store?: IStore

  // 是否启用预览功能（默认 false）
  enabledPreview?: boolean

  // 准备阶段，返回扩展提供的 commands
  // 返回的 command 只需要提供 name, title, desc, icon, type
  // ucid 和 source 由 ExtensionManager 自动生成
  onPrepare(): Promise<Partial<ICommand>[]> | Partial<ICommand>[]

  // 执行命令
  // name: command 的 name 字段（不是 ucid）
  // 返回值：
  //   - null/false: 关闭主面板
  //   - true: 保持主面板打开
  //   - React.ReactElement: 切换至插件的二级面板
  doAction(name: string): ExtensionResult | Promise<ExtensionResult>

  // 预览功能（可选）
  // 当用户输入时，如果 enabledPreview 为 true，会调用此方法
  // input: 用户当前输入的内容
  // 返回值：
  //   - null: 不显示预览
  //   - React.ReactElement: 在列表顶部显示的预览元素
  onPreview?(input: string): ExtensionResult

  // 返回功能（可选）
  // 当用户按下 Esc 键时调用
  // 返回值：
  //   - true: 返回上一个界面（默认行为）
  //   - false: 由扩展自己处理，不返回上一个界面
  doBack?(): boolean
}

// Extension 的包配置定义（文档规范）
export interface ExtensionPackage {
  icon?: string         // 展示图标（emoji 或图标路径）
  name: string          // 存储名称，建议 xxx-xxx-xx 格式，如 "app-launcher"
  title: string         // 展示名称，如 "App Launcher"
  desc?: string         // 展示描述
  version?: string      // 版本号
  commands?: Partial<ICommand>[] // 静态命令列表（可选，只需提供 name, title, desc, icon, type）
  main: string          // 主入口文件
}

// React Components
export { List, Item } from './components/List'
export type { ListItem, ListSection, ListProps, ItemProps } from './components/List'
export { Input } from './components/Input'
export type { InputProps, InputHandle } from './components/Input'
export { Panel } from './components/Panel'
export type { PanelProps } from './components/Panel'
export { Text } from './components/Text'
export type { TextProps, TextVariant } from './components/Text'
// Keyer API
export { Keyer } from './Keyer'
export type { NetResponseType, NetFetchRequest, NetFetchResponse, ClipboardImage } from './Keyer'
