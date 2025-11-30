import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * macOS应用图标读取器
 * 直接从.app包中读取.icns文件并转换为PNG
 */

/**
 * 查找.app包中的图标文件
 * @param appPath .app应用包路径
 * @returns .icns文件路径或null
 */
function findIconFile(appPath: string): string | null {
  try {
    const infoPlistPath = path.join(appPath, 'Contents', 'Info.plist')
    const resourcesPath = path.join(appPath, 'Contents', 'Resources')
    
    // 检查Resources目录是否存在
    if (!fs.existsSync(resourcesPath)) {
      console.log(`[MacIconReader] Resources directory not found: ${resourcesPath}`)
      return null
    }
    
    let iconFileName: string | null = null
    
    // 1. 尝试从Info.plist读取图标文件名
    if (fs.existsSync(infoPlistPath)) {
      try {
        const plistContent = fs.readFileSync(infoPlistPath, 'utf8')
        
        // 查找CFBundleIconFile或CFBundleIconName
        const iconFileMatch = plistContent.match(/<key>CFBundleIconFile<\/key>\\s*<string>([^<]+)<\/string>/)
        const iconNameMatch = plistContent.match(/<key>CFBundleIconName<\/key>\\s*<string>([^<]+)<\/string>/)
        
        if (iconFileMatch) {
          iconFileName = iconFileMatch[1]
        } else if (iconNameMatch) {
          iconFileName = iconNameMatch[1]
        }
        
        console.log(`[MacIconReader] Found icon name in plist: ${iconFileName}`)
      } catch (error) {
        console.log(`[MacIconReader] Error reading Info.plist: ${error}`)
      }
    }
    
    // 2. 如果从plist中找到了图标名，尝试定位文件
    if (iconFileName) {
      // 确保文件名有.icns扩展名
      if (!iconFileName.endsWith('.icns')) {
        iconFileName += '.icns'
      }
      
      const iconPath = path.join(resourcesPath, iconFileName)
      if (fs.existsSync(iconPath)) {
        console.log(`[MacIconReader] Found icon file: ${iconPath}`)
        return iconPath
      }
    }
    
    // 3. 如果plist方法失败，扫描Resources目录查找.icns文件
    console.log(`[MacIconReader] Scanning Resources directory for .icns files`)
    const files = fs.readdirSync(resourcesPath)
    const icnsFiles = files.filter(file => file.toLowerCase().endsWith('.icns'))
    
    if (icnsFiles.length > 0) {
      // 优先选择与应用名称匹配的图标文件
      const appName = path.basename(appPath, '.app')
      const matchingIcon = icnsFiles.find(file => 
        file.toLowerCase().includes(appName.toLowerCase()) ||
        file.toLowerCase().includes('app') ||
        file.toLowerCase().includes('icon')
      )
      
      const selectedIcon = matchingIcon || icnsFiles[0]
      const iconPath = path.join(resourcesPath, selectedIcon)
      console.log(`[MacIconReader] Found .icns file: ${iconPath}`)
      return iconPath
    }
    
    console.log(`[MacIconReader] No .icns files found in ${resourcesPath}`)
    return null
    
  } catch (error) {
    console.error(`[MacIconReader] Error finding icon file: ${error}`)
    return null
  }
}

/**
 * 使用sips命令将.icns转换为PNG
 * @param icnsPath .icns文件路径
 * @param outputPath 输出PNG文件路径
 * @returns 是否成功转换
 */
async function convertIcnsToPng(icnsPath: string, outputPath: string): Promise<boolean> {
  try {
    // 使用sips命令转换图标，指定最大尺寸为256x256
    const command = `sips -s format png -Z 256 "${icnsPath}" --out "${outputPath}"`
    console.log(`[MacIconReader] Converting with command: ${command}`)
    
    const { stdout, stderr } = await execAsync(command)
    
    if (stderr && !stderr.includes('Warning')) {
      console.error(`[MacIconReader] Conversion error: ${stderr}`)
      return false
    }
    
    // 检查输出文件是否存在且有内容
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath)
      if (stats.size > 0) {
        console.log(`[MacIconReader] Converted successfully: ${stats.size} bytes`)
        return true
      }
    }
    
    return false
  } catch (error) {
    console.error(`[MacIconReader] Conversion failed: ${error}`)
    return false
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
    
    // 查找图标文件
    const icnsPath = findIconFile(appPath)
    if (!icnsPath) {
      console.log(`[MacIconReader] No icon file found for: ${appPath}`)
      return null
    }
    
    // 创建临时PNG文件路径
    const tempDir = require('os').tmpdir()
    const tempPngPath = path.join(tempDir, `keyer_icon_${Date.now()}.png`)
    
    try {
      // 转换.icns到PNG
      const success = await convertIcnsToPng(icnsPath, tempPngPath)
      
      if (success && fs.existsSync(tempPngPath)) {
        // 读取PNG数据
        const pngBuffer = fs.readFileSync(tempPngPath)
        
        // 清理临时文件
        try { fs.unlinkSync(tempPngPath) } catch {}
        
        console.log(`[MacIconReader] Successfully extracted icon: ${pngBuffer.length} bytes`)
        return pngBuffer
      } else {
        console.log(`[MacIconReader] Conversion failed or no output file`)
        return null
      }
    } catch (error) {
      // 清理临时文件
      try { fs.unlinkSync(tempPngPath) } catch {}
      throw error
    }
    
  } catch (error) {
    console.error(`[MacIconReader] Error getting app icon: ${error}`)
    return null
  }
}