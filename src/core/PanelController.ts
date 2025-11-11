import { BrowserWindow } from 'electron'
import { IPanelController, IPanelConfig } from 'keyerext'

export class PanelController implements IPanelController {
  private mainWindow: BrowserWindow | null = null
  private currentExtensionId: string | null = null  // 跟踪当前扩展 ID

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
  }

  // 设置当前扩展 ID（在 executeAction 时调用）
  setCurrentExtension(extensionId: string) {
    this.currentExtensionId = extensionId
  }

  showPanel(config: IPanelConfig): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      // 发送可序列化的配置
      const serializableConfig = {
        title: config.title,
        component: config.component,
        extensionId: this.currentExtensionId,
        props: config.props
      }

      this.mainWindow.webContents.send('show-panel', serializableConfig)
    }
  }

  closePanel(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('close-panel')
    }
  }

  updatePanel(props: Record<string, any>): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update-panel', props)
    }
  }
}
