import { APIType } from '@/shared/ipc'
import { extensionManager } from './ext-manager'
import { VITE_DEV_SERVER_URL } from './window-manager'

export const extensionsHandler: APIType['extensions'] = {
  scan: async () => {
    try {
      const devDir = VITE_DEV_SERVER_URL ? process.env.APP_ROOT : undefined
      const extensions = await extensionManager.scanExtensions(devDir)
      console.log(`📦 Scanned ${extensions.length} extensions`)
      return extensions
    } catch (error) {
      console.error('❌ Failed to scan extensions:', error)
      return []
    }
  },

  getPath: async (extensionMain: string) => {
    const devDir = VITE_DEV_SERVER_URL ? process.env.APP_ROOT : undefined
    return extensionManager.getExtensionPath(devDir, extensionMain)
  }
}
