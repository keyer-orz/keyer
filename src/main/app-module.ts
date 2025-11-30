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
      
      const icon = await app.getFileIcon(appPath)
      console.log(`[Main Process] Got icon object, isEmpty: ${icon.isEmpty()}`)
      
      if (icon && !icon.isEmpty()) {
        const dataUrl = icon.toDataURL()
        console.log(`[Main Process] Generated dataURL: ${dataUrl.substring(0, 100)}...`)
        return dataUrl
      } else {
        console.error(`[Main Process] Icon is empty for path: ${appPath}`)
        throw new Error(`No icon found for ${appPath}`)
      }
    } catch (err) {
      console.error('[Main Process] Error getting file icon:', err)
      // Don't return empty string, throw error so renderer can handle it properly
      throw err
    }
  }
}

////////////////////////////////////////////////////////////////////////////////