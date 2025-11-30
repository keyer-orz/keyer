import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * macOS应用图标读取器
 * 支持多种图标获取方式：
 * 1. NSWorkspace API（最可靠，适用于所有应用类型）
 */

/**
 * 使用NSWorkspace API获取应用图标（最可靠的方法）
 * @param appPath .app应用包路径
 * @returns PNG图标Buffer或null
 */
async function getIconUsingNSWorkspace(appPath: string): Promise<Buffer | null> {
  try {
    const tempDir = require('os').tmpdir()
    const appName = path.basename(appPath, '.app')
    const tempIconPath = path.join(tempDir, `keyer_nsworkspace_${appName}_${Date.now()}.png`)
    
    console.log(`[MacIconReader] Using NSWorkspace API for: ${appPath}`)
    
    // 创建临时JXA脚本文件
    const tempScriptPath = path.join(tempDir, `keyer_script_${Date.now()}.js`)
    const jxaScript = `ObjC.import('AppKit')

function saveAppIcon(appPath, savePath) {
  try {
    const ws = $.NSWorkspace.sharedWorkspace
    const img = ws.iconForFile(appPath)
    
    const tiff = img.TIFFRepresentation
    if (!tiff) return false
    
    const bitmap = $.NSBitmapImageRep.imageRepWithData(tiff)
    const pngData = bitmap.representationUsingTypeProperties($.NSBitmapImageFileTypePNG, $())
    
    return pngData.writeToFileAtomically(savePath, true)
  } catch (error) {
    return false
  }
}

const result = saveAppIcon("${appPath}", "${tempIconPath}")
result`

    fs.writeFileSync(tempScriptPath, jxaScript)
    
    // 执行JXA脚本文件
    const command = `osascript -l JavaScript "${tempScriptPath}"`
    const { stdout } = await execAsync(command)
    
    if (stdout.trim() === 'true' && fs.existsSync(tempIconPath)) {
      const stats = fs.statSync(tempIconPath)
      if (stats.size > 0) {
        const iconBuffer = fs.readFileSync(tempIconPath)
        
        // 清理临时文件
        try { 
          fs.unlinkSync(tempIconPath)
          fs.unlinkSync(tempScriptPath) 
        } catch {}
        
        console.log(`[MacIconReader] NSWorkspace API succeeded: ${iconBuffer.length} bytes`)
        return iconBuffer
      }
    }
    
    // 清理临时脚本文件
    try { fs.unlinkSync(tempScriptPath) } catch {}
    
    console.log(`[MacIconReader] NSWorkspace API failed`)
    return null
    
  } catch (error) {
    console.error(`[MacIconReader] NSWorkspace API error: ${error}`)
    return null
  }
}
/**
 * 获取应用图标
 * @param appPath .app应用包路径
 * @returns PNG图标数据Buffer或null
 */
export async function getAppIcon(appPath: string): Promise<Buffer | null> {
  try {
    console.log(`[MacIconReader] Getting icon for: ${appPath}`)
    
    // 检查是否为macOS应用包
    if (!appPath.endsWith('.app')) {
      console.log(`[MacIconReader] Not a macOS app bundle: ${appPath}`)
      return null
    }
    
    // 方法1: 优先使用NSWorkspace API（最可靠）
    console.log(`[MacIconReader] Trying NSWorkspace API first...`)
    const nsWorkspaceIcon = await getIconUsingNSWorkspace(appPath)
    if (nsWorkspaceIcon) {
      return nsWorkspaceIcon
    }
    return null
  } catch (error) {
    console.error(`[MacIconReader] Error getting app icon: ${error}`)
    return null
  }
}