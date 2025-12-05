import { _IMainAPI } from '@/shared/main-api'
import fs from 'fs/promises'
import path from 'path'

export const fileHandler: _IMainAPI['file'] = {
  read: async (filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return content
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`)
    }
  },

  write: async (filePath: string, content: string) => {
    try {
      // 确保目录存在
      const dir = path.dirname(filePath)
      await fs.mkdir(dir, { recursive: true })
      
      await fs.writeFile(filePath, content, 'utf-8')
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error}`)
    }
  },

  selectDirectory: async () => {
    const { dialog, BrowserWindow } = require('electron')
    const mainWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
    
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    })
    return result.canceled ? undefined : result.filePaths[0]
  }
}

////////////////////////////////////////////////////////////////////////////////
