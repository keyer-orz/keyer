import { _IMainAPI } from '@/shared/main-api'
import { NetRequestOptions, NetResponse, DownloadOptions } from 'keyerext'
import { net } from 'electron'
import fs from 'fs'
import path from 'path'

export const netHandler: _IMainAPI['net'] = {
  request: async <T = any>(url: string, options: NetRequestOptions = {}): Promise<NetResponse<T>> => {
    return makeRequest<T>(url, options)
  },

  download: async (url: string, savePath: string, options: DownloadOptions = {}): Promise<boolean> => {
    return downloadFile(url, savePath, options)
  }
}

////////////////////////////////////////////////////////////////////////////////

/**
 * 发起 HTTP 请求
 */
async function makeRequest<T = any>(
  url: string,
  options: NetRequestOptions = {}
): Promise<NetResponse<T>> {
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

/**
 * 下载文件到指定路径
 */
async function downloadFile(
  url: string,
  savePath: string,
  options: DownloadOptions = {}
): Promise<boolean> {
  const {
    headers = {},
    timeout = 60000
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

      response.on('data', (chunk: Buffer) => {
        fileStream.write(chunk)
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
