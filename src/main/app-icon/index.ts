import { protocol, app } from 'electron'
import path from 'path'
import fs from 'fs'
import { getAppIcon } from './mac-icon-reader'

/**
 * 注册 keyer-app:// 协议用于访问应用图标（带缓存）
 */
export function registerAppProtocol() {
  protocol.registerBufferProtocol('asset', async (request, callback) => {
    try {
      const assertPath = decodeURIComponent(request.url.replace('asset://', ''))
      if (fs.existsSync(assertPath)) {
        const buffer = fs.readFileSync(assertPath)
        callback({ mimeType: 'image/png', data: buffer })
        return 
      } else {
        callback({ error: -6 })
      }
    } catch (error) {
      console.log('error:', error)
      callback({ error: -2 })
    }
  })
  protocol.registerBufferProtocol('app', async (request, callback) => {
    try {
      const appPath = decodeURIComponent(request.url.replace('app://', ''))
      // 检查应用文件是否存在
      if (!fs.existsSync(appPath)) {
        console.error(`[AppIcon] App not found: ${appPath}`)
        callback({ error: -6 }) // FILE_NOT_FOUND
        return
      }
      
      // 生成缓存文件名
      const crypto = require('crypto')
      const hash = crypto.createHash('md5').update(appPath).digest('hex')
      const cacheFileName = `${hash}.png`
      const cachePath = path.join(app.getPath('userData'), 'img-cache', cacheFileName)
      
      if (fs.existsSync(cachePath)) {
        const buffer = fs.readFileSync(cachePath)
        callback({ mimeType: 'image/png', data: buffer })
        return 
      }
      
      // 获取新图标
      const iconBuffer = await getAppIcon(appPath)
      if (iconBuffer && iconBuffer.length > 0) {
        // 确保缓存目录存在
        const cacheDir = path.dirname(cachePath)
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true })
        }
        // 保存到缓存
        fs.writeFileSync(cachePath, iconBuffer)
        
        callback({ mimeType: 'image/png', data: iconBuffer })
      } else {
        callback({ error: -6 })
      }
    } catch (error) {
      callback({ error: -2 })
    }
  })
}