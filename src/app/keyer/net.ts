/**
 * 渲染进程网络模块
 * 使用 Electron net 模块实现 HTTP 请求和文件下载
 */

import { _IRenderAPI } from '@/shared/render-api'

// 动态导入 electron，避免在主进程中加载
let electron: any
try {
  electron = window.require('electron')
} catch (e) {
  console.warn('net module is only available in renderer process')
}

export const netImpl: _IRenderAPI['net'] = {
  request: async (url, options = {}) => {
    return makeRequest(url, options)
  },

  download: async (url, savePath, options = {}) => {
    return downloadFile(url, savePath, options)
  }
}

////////////////////////////////////////////////////////////////////////////////

interface NetRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: string | Record<string, any>
  timeout?: number
}

interface NetResponse<T = any> {
  status: number
  statusText: string
  headers: Record<string, string>
  data: T
}

/**
 * 发起 HTTP 请求
 */
async function makeRequest<T = any>(
  url: string,
  options: NetRequestOptions = {}
): Promise<NetResponse<T>> {
  if (!electron) {
    throw new Error('net module is only available in renderer process')
  }

  const { net } = electron

  const {
    method = 'GET',
    headers = {},
    body,
    timeout = 30000
  } = options

  return new Promise((resolve, reject) => {
    const requestOptions: any = {
      url,
      method,
      redirect: 'follow'
    }

    const request = net.request(requestOptions)

    // 设置请求头
    const defaultHeaders: Record<string, string> = {
      'User-Agent': 'Keyer/1.0',
      ...headers
    }

    // 如果有 body，设置 Content-Type
    if (body) {
      if (typeof body === 'object') {
        defaultHeaders['Content-Type'] = 'application/json'
      } else if (!defaultHeaders['Content-Type']) {
        defaultHeaders['Content-Type'] = 'text/plain'
      }
    }

    Object.entries(defaultHeaders).forEach(([key, value]) => {
      request.setHeader(key, value)
    })

    // 设置超时
    let timeoutId: NodeJS.Timeout | undefined
    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        request.abort()
        reject(new Error(`Request timeout after ${timeout}ms`))
      }, timeout)
    }

    request.on('response', (response: any) => {
      const chunks: Buffer[] = []
      const responseHeaders: Record<string, string> = {}

      // 收集响应头
      Object.keys(response.headers).forEach(key => {
        const value = response.headers[key]
        responseHeaders[key] = Array.isArray(value) ? value.join(', ') : value
      })

      response.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })

      response.on('end', () => {
        if (timeoutId) clearTimeout(timeoutId)

        const buffer = Buffer.concat(chunks)
        const contentType = responseHeaders['content-type'] || ''
        
        let data: any = buffer.toString('utf-8')

        // 尝试解析 JSON
        if (contentType.includes('application/json')) {
          try {
            data = JSON.parse(data)
          } catch (e) {
            // 解析失败，保持字符串
          }
        }

        const result: NetResponse<T> = {
          status: response.statusCode,
          statusText: response.statusMessage || '',
          headers: responseHeaders,
          data
        }

        // 2xx 被认为是成功
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(result)
        } else {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage || 'Request failed'}`))
        }
      })

      response.on('error', (err: Error) => {
        if (timeoutId) clearTimeout(timeoutId)
        reject(err)
      })
    })

    request.on('error', (err: Error) => {
      if (timeoutId) clearTimeout(timeoutId)
      reject(err)
    })

    // 发送请求体
    if (body) {
      if (typeof body === 'object') {
        request.write(JSON.stringify(body))
      } else {
        request.write(body)
      }
    }

    request.end()
  })
}

interface DownloadOptions {
  headers?: Record<string, string>
  timeout?: number
  onProgress?: (downloaded: number, total: number, progress: number) => void
}

/**
 * 下载文件到指定路径
 */
async function downloadFile(
  url: string,
  savePath: string,
  options: DownloadOptions = {}
): Promise<boolean> {
  if (!electron) {
    throw new Error('net module is only available in renderer process')
  }

  const { net } = electron
  const fs = window.require('fs')
  const path = window.require('path')

  const {
    headers = {},
    timeout = 60000,
    onProgress
  } = options

  return new Promise((resolve, reject) => {
    // 确保目标目录存在
    const dir = path.dirname(savePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const request = net.request({
      url,
      method: 'GET',
      redirect: 'follow'
    })

    // 设置请求头
    const defaultHeaders: Record<string, string> = {
      'User-Agent': 'Keyer/1.0',
      ...headers
    }

    Object.entries(defaultHeaders).forEach(([key, value]) => {
      request.setHeader(key, value)
    })

    // 设置超时
    let timeoutId: NodeJS.Timeout | undefined
    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        request.abort()
        reject(new Error(`Download timeout after ${timeout}ms`))
      }, timeout)
    }

    request.on('response', (response: any) => {
      if (response.statusCode !== 200) {
        if (timeoutId) clearTimeout(timeoutId)
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage || 'Download failed'}`))
        return
      }

      const fileStream = fs.createWriteStream(savePath)
      let downloadedBytes = 0
      const totalBytes = parseInt(response.headers['content-length'] || '0', 10)

      response.on('data', (chunk: Buffer) => {
        downloadedBytes += chunk.length
        fileStream.write(chunk)

        // 触发进度回调
        if (onProgress && totalBytes > 0) {
          const progress = (downloadedBytes / totalBytes) * 100
          onProgress(downloadedBytes, totalBytes, Math.round(progress * 100) / 100)
        }
      })

      response.on('end', () => {
        if (timeoutId) clearTimeout(timeoutId)
        fileStream.end()
        
        // 验证文件是否存在
        if (fs.existsSync(savePath)) {
          const stats = fs.statSync(savePath)
          if (stats.size > 0) {
            resolve(true)
          } else {
            reject(new Error('Downloaded file is empty'))
          }
        } else {
          reject(new Error('Download failed: file not created'))
        }
      })

      response.on('error', (err: Error) => {
        if (timeoutId) clearTimeout(timeoutId)
        fileStream.close()
        if (fs.existsSync(savePath)) {
          fs.unlinkSync(savePath)
        }
        reject(err)
      })
    })

    request.on('error', (err: Error) => {
      if (timeoutId) clearTimeout(timeoutId)
      if (fs.existsSync(savePath)) {
        fs.unlinkSync(savePath)
      }
      reject(err)
    })

    request.end()
  })
}
