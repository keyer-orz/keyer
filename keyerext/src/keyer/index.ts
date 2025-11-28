/**
 * Keyer 核心能力声明
 *
 * 这个模块只负责声明接口,具体实现由 app 的 src/app/keyer 提供
 * 插件可以通过 Keyer 实例访问应用的核心能力
 */

/**
 * 剪贴板数据类型
 */
export interface ClipboardData {
  /**
   * 文本内容
   */
  text?: string

  /**
   * 图片内容 (Base64 编码)
   */
  image?: string

  /**
   * HTML 内容
   */
  html?: string
}

/**
 * 命令执行模式
 */
export type ExecOptions = {
  mode?: 'terminal' | 'window'
  cwd?: string
}

/**
 * 命令执行结果
 */
export interface ExecResult {
  success: boolean
  output?: string
  error?: string
}

/**
 * 扩展数据存储接口
 */
export interface IExtensionStore {
  /**
   * 获取数据
   * @param key 键名
   * @param defaultValue 默认值
   */
  get<T = any>(key: string, defaultValue?: T): T

  /**
   * 设置数据
   * @param key 键名
   * @param value 值
   */
  set<T = any>(key: string, value: T): void

  /**
   * 删除数据
   * @param key 键名
   */
  delete(key: string): void

  /**
   * 检查键是否存在
   * @param key 键名
   */
  has(key: string): boolean

  /**
   * 清空所有数据
   */
  clear(): void

  /**
   * 获取所有键名
   */
  keys(): string[]

  /**
   * 保存到文件（自动调用，通常不需要手动调用）
   */
  save(): Promise<void>
}

/**
 * Keyer 核心能力接口
 */
export interface IKeyer {
  /**
   * 执行命令
   * @param cmd 要执行的命令
   * @param mode 执行模式: terminal(系统终端) 或 window(新窗口)
   * @returns 执行结果的 Promise
   */
  exec(cmd: string, opt?: ExecOptions): Promise<ExecResult>

  /**
   * 剪贴板操作
   */
  clipboard: {
    /**
     * 读取剪贴板内容
     * @returns 剪贴板数据
     */
    read(): Promise<ClipboardData>

    /**
     * 读取剪贴板文本
     * @returns 文本内容
     */
    readText(): Promise<string>

    /**
     * 读取剪贴板图片
     * @returns 图片的 Base64 编码
     */
    readImage(): Promise<string | null>

    /**
     * 写入文本到剪贴板
     * @param text 要写入的文本
     */
    writeText(text: string): Promise<void>

    /**
     * 写入图片到剪贴板
     * @param image 图片的 Base64 编码或 Buffer
     */
    writeImage(image: string | Buffer): Promise<void>

    /**
     * 写入 HTML 到剪贴板
     * @param html HTML 内容
     */
    writeHtml(html: string): Promise<void>

    /**
     * 清空剪贴板
     */
    clear(): Promise<void>
  }

  /**
   * 应用控制
   */
  app: {
    /**
     * 隐藏应用窗口
     */
    hide(): Promise<void>

    /**
     * 显示应用窗口
     */
    show(): Promise<void>
  }
}

/**
 * 全局 Keyer 实例
 * 由 app 在运行时注入实现
 */
export let Keyer: IKeyer

/**
 * 设置 Keyer 实例 (由 app 调用)
 * @internal
 */
export function setKeyer(instance: IKeyer): void {
  Keyer = instance
}
