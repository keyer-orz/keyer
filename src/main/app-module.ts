import { APIType } from "@/shared/ipc"
import { app } from "electron"

export const appHandler: APIType["app"] = {
  getVersion: () => Promise.resolve(app.getVersion()),
  getName: () => Promise.resolve(app.getName()),
  async getFileIcon(appPath: string): Promise<string> {
    console.log(`Getting file icon for: ${appPath}`)
    try {
      const icon = await app.getFileIcon(appPath)
      if (icon && !icon.isEmpty()) {
        const dataUrl = icon.toDataURL()
        console.log(`Got icon for ${appPath}: ${dataUrl}`)
        return dataUrl
      }
      throw new Error('No icon found')
    } catch (err) {
      console.error('Error getting file icon:', err)
      return ''
    }
  }
}

////////////////////////////////////////////////////////////////////////////////