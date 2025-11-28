import { APIType } from '@/shared/ipc'
import fs from 'fs/promises'
import path from 'path'

export const fileHandler: APIType['file'] = {
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
  }
}
