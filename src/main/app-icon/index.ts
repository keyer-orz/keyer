import { protocol, app } from 'electron'
import path from 'path'
import fs from 'fs'
import { getAppIcon } from './mac-icon-reader'

/**
 * 注册 keyer-app:// 协议用于访问应用图标（带缓存）
 */
export function registerAppIconProtocol() {
  protocol.registerBufferProtocol('keyer-app', async (request, callback) => {
    try {
      const appPath = decodeURIComponent(request.url.replace('keyer-app://', ''))
      console.log(`[AppIcon] Request for: ${appPath}`)
      
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
      
      // 检查缓存是否存在且未过期
      if (fs.existsSync(cachePath)) {
        const stats = fs.statSync(cachePath)
        const cacheAge = Date.now() - stats.mtime.getTime()
        const maxAge = 24 * 60 * 60 * 1000 // 1天
        
        if (cacheAge < maxAge) {
          console.log(`[AppIcon] Using cached icon: ${cacheFileName}`)
          const buffer = fs.readFileSync(cachePath)
          callback({ mimeType: 'image/png', data: buffer })
          return
        } else {
          console.log(`[AppIcon] Cache expired, removing: ${cacheFileName}`)
          try { fs.unlinkSync(cachePath) } catch {}
        }
      }
      
      // 获取新图标
      console.log(`[AppIcon] Fetching new icon for: ${appPath}`)
      const iconBuffer = await getAppIcon(appPath)
      
      if (iconBuffer && iconBuffer.length > 0) {
        console.log(`[AppIcon] Got icon buffer: ${iconBuffer.length} bytes`)
        
        // 确保缓存目录存在
        const cacheDir = path.dirname(cachePath)
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true })
        }
        
        // 保存到缓存
        fs.writeFileSync(cachePath, iconBuffer)
        console.log(`[AppIcon] Cached new icon: ${cacheFileName}`)
        
        callback({ mimeType: 'image/png', data: iconBuffer })
      } else {
        console.error(`[AppIcon] Failed to get icon for: ${appPath}`)
        callback({ error: -6 })
      }
    } catch (error) {
      console.error('[AppIcon] Error processing app icon request:', error)
      callback({ error: -2 })
    }
  })
}

/**
 * 清理图标缓存
 */
export function clearAppIconCache(): void {
  const cacheDir = path.join(app.getPath('userData'), 'img-cache')
  
  try {
    if (fs.existsSync(cacheDir)) {
      const files = fs.readdirSync(cacheDir)
      for (const file of files) {
        fs.unlinkSync(path.join(cacheDir, file))
      }
      console.log('[AppIcon] Cache cleared')
    }
  } catch (error) {
    console.error('[AppIcon] Error clearing cache:', error)
    throw error
  }
}