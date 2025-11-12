import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

export class Store {
  private stores: Map<string, Record<string, any>> = new Map()

  // 获取扩展的 store 文件路径
  private getStorePath(extensionId: string): string {
    const userDataPath = app.getPath('userData')
    const storeDir = path.join(userDataPath, 'extensions', extensionId)

    // 确保目录存在
    if (!fs.existsSync(storeDir)) {
      fs.mkdirSync(storeDir, { recursive: true })
    }

    return path.join(storeDir, 'store.json')
  }

  // 加载扩展的 store 数据
  private loadStore(extensionId: string): Record<string, any> {
    if (this.stores.has(extensionId)) {
      return this.stores.get(extensionId)!
    }

    const storePath = this.getStorePath(extensionId)
    let data: Record<string, any> = {}

    try {
      if (fs.existsSync(storePath)) {
        const content = fs.readFileSync(storePath, 'utf-8')
        data = JSON.parse(content)
        console.log(`[${extensionId}] Store loaded:`, Object.keys(data))
      }
    } catch (error) {
      console.error(`[${extensionId}] Failed to load store:`, error)
      data = {}
    }

    this.stores.set(extensionId, data)
    return data
  }

  // 保存扩展的 store 数据
  private saveStore(extensionId: string): void {
    const data = this.stores.get(extensionId)
    if (!data) return

    const storePath = this.getStorePath(extensionId)

    try {
      // 使用原子写入
      const tempPath = storePath + '.tmp'
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), { mode: 0o644 })
      fs.renameSync(tempPath, storePath)
      console.log(`[${extensionId}] Store saved:`, Object.keys(data))
    } catch (error: any) {
      // 只记录错误，不抛出异常
      if (error?.code === 'EPERM') {
        console.warn(`[${extensionId}] Store save failed due to permissions - running in memory-only mode`)
      } else {
        console.error(`[${extensionId}] Failed to save store:`, error)
      }

      // 清理临时文件
      try {
        const tempPath = storePath + '.tmp'
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath)
        }
      } catch (cleanupError) {
        // 忽略清理错误
      }
    }
  }

  // 获取值
  get(extensionId: string, key: string, defaultValue?: any): any {
    const data = this.loadStore(extensionId)
    if (key in data) {
      return data[key]
    }
    return defaultValue
  }

  // 设置值
  set(extensionId: string, key: string, value: any): boolean {
    try {
      const data = this.loadStore(extensionId)
      data[key] = value
      this.stores.set(extensionId, data)
      this.saveStore(extensionId)
      return true
    } catch (error) {
      console.error(`[${extensionId}] Failed to set value:`, error)
      return false
    }
  }

  // 删除值
  delete(extensionId: string, key: string): boolean {
    try {
      const data = this.loadStore(extensionId)
      delete data[key]
      this.stores.set(extensionId, data)
      this.saveStore(extensionId)
      return true
    } catch (error) {
      console.error(`[${extensionId}] Failed to delete value:`, error)
      return false
    }
  }

  // 获取所有键
  keys(extensionId: string): string[] {
    const data = this.loadStore(extensionId)
    return Object.keys(data)
  }
}
