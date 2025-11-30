import { APIType } from "@/shared/ipc"
import { app } from "electron"

export const appHandler: APIType["app"] = {
  getVersion: () => Promise.resolve(app.getVersion()),
  getName: () => Promise.resolve(app.getName()),
  async getFileIcon(appPath: string): Promise<string> {
    console.log(`[Main Process] Getting file icon for: ${appPath}`)
    try {
      // Ensure the path exists
      const fs = require('fs')
      if (!fs.existsSync(appPath)) {
        throw new Error(`Path does not exist: ${appPath}`)
      }
      
      // Get application icon using default size (large size may cause empty buffer on macOS)
      console.log(`[Main Process] Getting icon for: ${appPath}`)
      const icon = await app.getFileIcon(appPath)
      
      console.log(`[Main Process] Got icon object, isEmpty: ${icon.isEmpty()}`)
      
      if (icon && !icon.isEmpty()) {
        // Get icon dimensions for debugging
        const size = icon.getSize()
        console.log(`[Main Process] Icon size: ${size.width}x${size.height}`)
        
        const dataUrl = icon.toDataURL()
        console.log(`[Main Process] Generated dataURL length: ${dataUrl.length}`)
        return dataUrl
      } else {
        console.error(`[Main Process] Icon is empty for path: ${appPath}`)
        throw new Error(`No icon found for ${appPath}`)
      }
    } catch (err) {
      console.error('[Main Process] Error getting file icon:', err)
      throw err
    }
  }
}

////////////////////////////////////////////////////////////////////////////////