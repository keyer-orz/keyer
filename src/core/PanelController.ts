import { BrowserWindow } from 'electron'
import { IPanelController, IPanelConfig, IListItem, IBoardItem } from 'keyerext'

export class PanelController implements IPanelController {
  private mainWindow: BrowserWindow | null = null

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
  }

  showPanel(config: IPanelConfig): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('show-panel', config)
    }
  }

  closePanel(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('close-panel')
    }
  }

  updatePanel(items: IListItem[] | IBoardItem[]): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update-panel', items)
    }
  }
}
