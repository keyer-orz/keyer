/**
 * 网络请求共享类型
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
