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
 * Keyer 核心能力接口
 */
export interface IKeyer {
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
