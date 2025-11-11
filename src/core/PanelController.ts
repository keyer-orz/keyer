import { BrowserWindow, ipcMain } from 'electron'
import { IPanelController, IPanelConfig, IListItem, IBoardItem } from 'keyerext'

export class PanelController implements IPanelController {
  private mainWindow: BrowserWindow | null = null
  private currentConfig: IPanelConfig | null = null

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.setupIpcHandlers()
  }

  private setupIpcHandlers(): void {
    // 处理来自渲染进程的搜索请求
    ipcMain.handle('panel-search', async (_event, query: string) => {
      if (this.currentConfig?.onSearch) {
        return await this.currentConfig.onSearch(query)
      }
      return []
    })

    // 处理来自渲染进程的动作请求
    ipcMain.handle('panel-action', async (_event, item: IListItem | IBoardItem) => {
      if (this.currentConfig?.onAction) {
        await this.currentConfig.onAction(item)
      }
    })
  }

  showPanel(config: IPanelConfig): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      // 保存配置（包含回调函数）
      this.currentConfig = config

      // 发送可序列化的配置（移除函数）
      const serializableConfig = {
        type: config.type,
        title: config.title,
        items: config.items,
        placeholder: config.placeholder,
        // 只标记是否有回调，不传递函数本身
        hasSearch: !!config.onSearch,
        hasAction: !!config.onAction
      }

      this.mainWindow.webContents.send('show-panel', serializableConfig)
    }
  }

  closePanel(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.currentConfig = null
      this.mainWindow.webContents.send('close-panel')
    }
  }

  updatePanel(items: IListItem[] | IBoardItem[]): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update-panel', items)
    }
  }
}
