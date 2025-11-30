import { app, BrowserWindow, ipcMain, protocol } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import Store from 'electron-store'
import fs from 'fs'
import { createMainWindow, clearMainWindow } from './window-module'
import { registerShortcuts, unregisterAllShortcuts } from './shortcuts-module'
import { appHandler } from './app-module'
import { fileHandler } from './file-module'
import { windowHandler } from './window-module'
import { extensionsHandler } from './extensions-module'
import { shortcutsHandler } from './shortcuts-module'
import { execHandler } from './exec-module'

// 设置应用根目录
const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.APP_ROOT = path.join(__dirname, '..')

const modules = {
  app: appHandler,
  file: fileHandler,
  window: windowHandler,
  extensions: extensionsHandler,
  shortcuts: shortcutsHandler,
  exec: execHandler,
}

export function registerIPC() {
  for (const namespace of Object.keys(modules)) {
    const methods = modules[namespace as keyof typeof modules]!
    for (const method of Object.keys(methods)) {
      const channel = `${namespace}.${method}`
      ipcMain.handle(channel, (_, ...args: any[]) => {
        return (methods as any)[method](...args)
      })
    }
  }
}

export function registerCustomProtocols() {
  // 注册 keyer-cache:// 协议用于访问缓存文件
  protocol.registerFileProtocol('keyer-cache', (request, callback) => {
    try {
      const url = request.url.replace('keyer-cache://', '')
      const cachePath = path.join(app.getPath('userData'), 'img-cache', url)
      
      console.log(`[Protocol] Serving cache file: ${url} -> ${cachePath}`)
      
      // 检查文件是否存在
      if (fs.existsSync(cachePath)) {
        callback({ path: cachePath })
      } else {
        console.error(`[Protocol] Cache file not found: ${cachePath}`)
        callback({ error: -6 }) // FILE_NOT_FOUND
      }
    } catch (error) {
      console.error('[Protocol] Error serving cache file:', error)
      callback({ error: -2 }) // FAILED
    }
  })

  // 注册 keyer-app:// 协议用于访问应用图标（带缓存）
  protocol.registerBufferProtocol('keyer-app', async (request, callback) => {
    try {
      const appPath = decodeURIComponent(request.url.replace('keyer-app://', ''))
      console.log(`[Protocol] Getting app icon for: ${appPath}`)
      
      // 生成缓存文件名（使用路径的hash）
      const crypto = require('crypto')
      const hash = crypto.createHash('md5').update(appPath).digest('hex')
      const cacheFileName = `${hash}.png`
      const cachePath = path.join(app.getPath('userData'), 'img-cache', cacheFileName)
      
      // 检查缓存是否存在
      if (fs.existsSync(cachePath)) {
        console.log(`[Protocol] Using cached icon: ${cacheFileName}`)
        const buffer = fs.readFileSync(cachePath)
        callback({ mimeType: 'image/png', data: buffer })
        return
      }
      
      // 缓存不存在，获取图标并缓存
      console.log(`[Protocol] Fetching new icon for: ${appPath}`)
      const icon = await app.getFileIcon(appPath)
      
      if (icon && !icon.isEmpty()) {
        const buffer = icon.toPNG()
        
        // 确保缓存目录存在
        const cacheDir = path.dirname(cachePath)
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true })
        }
        
        // 保存到缓存
        fs.writeFileSync(cachePath, buffer)
        console.log(`[Protocol] Cached icon: ${cacheFileName}`)
        
        callback({ mimeType: 'image/png', data: buffer })
      } else {
        console.error(`[Protocol] No icon found for: ${appPath}`)
        callback({ error: -6 })
      }
    } catch (error) {
      console.error('[Protocol] Error getting app icon:', error)
      callback({ error: -2 })
    }
  })
}

// 应用生命周期事件
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    clearMainWindow()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})

app.on('will-quit', () => {
  // 注销所有快捷键
  unregisterAllShortcuts()
})

// 应用启动
app.whenReady().then(() => {
  // 初始化 electron-store 以供渲染进程使用
  Store.initRenderer()

  // 注册自定义协议
  registerCustomProtocols()

  // 注册新的模块化 IPC 处理器
  registerIPC()

  // 创建主窗口
  createMainWindow()

  // 注册全局快捷键
  registerShortcuts()

  console.log('user data:', app.getPath('userData'))
})

