/**
 * Keyer API
 * 提供插件调用主应用功能的 API
 * 实现由主应用通过 window.__keyer__ 注入
 */

export type NetResponseType = 'json' | 'text' | 'arrayBuffer'

export interface NetFetchRequest {
  url: string
  method?: string
  headers?: Record<string, string>
  body?: unknown
  responseType?: NetResponseType
  timeoutMs?: number
}

export interface NetFetchResponse {
  ok: boolean
  status: number
  statusText: string
  headers: Record<string, string>
  body: unknown
  responseType: NetResponseType
  encoding?: 'utf-8' | 'base64'
  error?: string
}

export interface ClipboardImage {
  dataURL: string  // base64 data URL
  width: number
  height: number
}

interface IKeyerAPI {
  /** 隐藏窗口 */
  hideWindow(): Promise<void>
  /** 显示窗口 */
  showWindow(): Promise<void>
  /** 调整窗口大小 */
  resizeWindow(width: number, height: number, center?: boolean): Promise<void>
  /** 恢复窗口原始大小 */
  restoreWindowSize(): Promise<void>
  /** 模拟粘贴到前一个应用 */
  simulatePaste(): Promise<void>
  /** 复制并粘贴（组合操作） */
  copyAndPaste(copyAction: () => void): Promise<void>
  /** 显示提示消息 */
  showToast(message: string, duration?: number): Promise<void>

  // ============ 剪切板 API ============
  /** 读取剪切板文本 */
  clipboardReadText(): Promise<string>
  /** 写入剪切板文本 */
  clipboardWriteText(text: string): Promise<void>
  /** 读取剪切板图片 */
  clipboardReadImage(): Promise<ClipboardImage | null>
  /** 写入剪切板图片 */
  clipboardWriteImage(dataURL: string): Promise<void>
}

declare global {
  interface Window {
    __keyer__: IKeyerAPI
  }
}

// 使用 Proxy 实现懒加载，避免时序问题
export const Keyer: IKeyerAPI = new Proxy({} as IKeyerAPI, {
  get(_, prop: keyof IKeyerAPI) {
    if (!window.__keyer__) {
      throw new Error('Keyer API not initialized. Make sure it runs after app initialization.')
    }
    return window.__keyer__[prop]
  }
})
