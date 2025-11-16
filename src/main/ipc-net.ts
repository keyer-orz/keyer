/**
 * IPC 网络请求处理器
 */
import { ipcMain } from 'electron'
import { Buffer } from 'buffer'
import type { NetFetchRequest, NetFetchResponse, NetResponseType } from '../shared/Net'

/**
 * 通过主进程代理 fetch，以便扩展在受限环境下发起网络请求
 */
export function setupNetIPCHandlers() {
  ipcMain.handle('net:fetch', async (_event, rawRequest: NetFetchRequest): Promise<NetFetchResponse> => {
    if (!rawRequest || typeof rawRequest.url !== 'string') {
      return buildErrorResponse('The request url is required.')
    }

    const {
      url,
      method = 'GET',
      headers: requestHeaders = {},
      body,
      responseType = 'json',
      timeoutMs
    } = rawRequest

    const headers: Record<string, string> = { ...requestHeaders }
    const init: RequestInit = { method, headers }

    let controller: AbortController | null = null
    let timeoutHandle: NodeJS.Timeout | null = null

    if (typeof timeoutMs === 'number' && timeoutMs > 0) {
      controller = new AbortController()
      init.signal = controller.signal
      timeoutHandle = setTimeout(() => controller?.abort(), timeoutMs)
    }

    try {
      if (body !== undefined && body !== null) {
        if (typeof body === 'string') {
          init.body = body
        } else if (typeof body === 'object') {
          init.body = JSON.stringify(body)
          if (!hasContentTypeHeader(headers)) {
            headers['Content-Type'] = 'application/json'
          }
        } else {
          init.body = String(body)
        }
      }

      const response = await fetch(url, init)
      const responseHeaders = headersToObject(response.headers)
      const { parsedBody, encoding } = await parseBody(response, responseType)

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: parsedBody,
        responseType,
        encoding
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return buildErrorResponse(message)
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle)
      }
    }
  })
}

function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {}
  headers.forEach((value, key) => {
    result[key] = value
  })
  return result
}

async function parseBody(response: Response, responseType: NetResponseType) {
  try {
    if (responseType === 'text') {
      return { parsedBody: await response.text(), encoding: 'utf-8' as const }
    }

    if (responseType === 'arrayBuffer') {
      const buffer = Buffer.from(await response.arrayBuffer())
      return { parsedBody: buffer.toString('base64'), encoding: 'base64' as const }
    }

    // 默认按 json 解析，失败时回退 text
    try {
      return { parsedBody: await response.json(), encoding: undefined }
    } catch (jsonError) {
      console.warn('Failed to parse response as JSON, falling back to text:', jsonError)
      return { parsedBody: await response.text(), encoding: 'utf-8' as const }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { parsedBody: null, encoding: undefined, error: message }
  }
}

function hasContentTypeHeader(headers: Record<string, string>) {
  return Object.keys(headers).some((key) => key.toLowerCase() === 'content-type')
}

function buildErrorResponse(message: string): NetFetchResponse {
  return {
    ok: false,
    status: 0,
    statusText: 'error',
    headers: {},
    body: null,
    responseType: 'text',
    encoding: undefined,
    error: message
  }
}
