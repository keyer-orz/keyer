// 测试新的图标获取功能
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// 直接复制核心函数来测试
async function getIconUsingNSWorkspace(appPath) {
  try {
    const tempDir = require('os').tmpdir()
    const appName = path.basename(appPath, '.app')
    const tempIconPath = path.join(tempDir, `keyer_nsworkspace_${appName}_${Date.now()}.png`)
    
    console.log(`[Test] Using NSWorkspace API for: ${appPath}`)
    
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
        
        console.log(`[Test] NSWorkspace API succeeded: ${iconBuffer.length} bytes`)
        return iconBuffer
      }
    }
    
    console.log(`[Test] NSWorkspace API failed`)
    return null
    
  } catch (error) {
    console.error(`[Test] NSWorkspace API error: ${error}`)
    return null
  }
}

async function testIconExtraction() {
  console.log('Testing icon extraction for Shottr app...');
  
  try {
    // 测试多个应用
    const apps = [
      '/Applications/Shottr.app',
      '/Applications/Safari.app',
      '/Applications/VSCode.app'
    ]
    
    for (const appPath of apps) {
      console.log(`\n--- Testing: ${path.basename(appPath)} ---`)
      const iconBuffer = await getIconUsingNSWorkspace(appPath);
      
      if (iconBuffer) {
        console.log(`✅ Success! Icon extracted, size: ${iconBuffer.length} bytes`)
        
        // 保存到临时文件
        const appName = path.basename(appPath, '.app').toLowerCase()
        const outputPath = `/tmp/${appName}-extracted.png`
        fs.writeFileSync(outputPath, iconBuffer)
        console.log(`Icon saved to: ${outputPath}`)
        
        // 验证文件
        const stats = fs.statSync(outputPath)
        console.log(`File size: ${stats.size} bytes`)
      } else {
        console.log('❌ Failed to extract icon')
      }
    }
    
    return // 跳过原来的单个测试
    
    if (iconBuffer) {
      console.log(`✅ Success! Icon extracted, size: ${iconBuffer.length} bytes`);
      
      // 保存到临时文件
      fs.writeFileSync('/tmp/shottr-extracted.png', iconBuffer);
      console.log('Icon saved to: /tmp/shottr-extracted.png');
      
      // 验证文件
      const stats = fs.statSync('/tmp/shottr-extracted.png');
      console.log(`File size: ${stats.size} bytes`);
      
    } else {
      console.log('❌ Failed to extract icon');
    }
  } catch (error) {
    console.error('Error during icon extraction:', error);
  }
}

testIconExtraction();