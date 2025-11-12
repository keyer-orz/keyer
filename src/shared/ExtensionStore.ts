import { IStore } from 'keyerext'

// 扩展 Window 类型以支持 ipcRenderer
declare global {
  interface Window {
    require: NodeRequire
  }
}

export class ExtensionStore implements IStore {
  private extensionId: string
  private ipcRenderer: any

  constructor(extensionId: string) {
    this.extensionId = extensionId

    // 获取 ipcRenderer
    try {
      const { ipcRenderer } = window.require('electron')
      this.ipcRenderer = ipcRenderer
    } catch (error) {
      console.error(`[${this.extensionId}] Failed to get ipcRenderer:`, error)
      throw new Error('ExtensionStore requires Electron environment')
    }
  }

  // 获取值
  get<T = any>(key: string): T | undefined
  get<T = any>(key: string, defaultValue: T): T
  get<T = any>(key: string, defaultValue?: T): T | undefined {
    try {
      // 同步 IPC 调用不支持，但我们可以使用 invoke 的同步版本
      // 注意：这里实际上是异步的，但我们用同步的方式包装
      // 在实际使用中，扩展应该使用异步方式
      const result = this.ipcRenderer.sendSync('extension-store-get-sync', this.extensionId, key, defaultValue)
      return result as T
    } catch (error) {
      console.error(`[${this.extensionId}] Failed to get value:`, error)
      return defaultValue
    }
  }

  // 设置值
  set(key: string, value: any): void {
    try {
      this.ipcRenderer.sendSync('extension-store-set-sync', this.extensionId, key, value)
    } catch (error) {
      console.error(`[${this.extensionId}] Failed to set value:`, error)
    }
  }

  // 删除值
  delete(key: string): void {
    try {
      this.ipcRenderer.sendSync('extension-store-delete-sync', this.extensionId, key)
    } catch (error) {
      console.error(`[${this.extensionId}] Failed to delete value:`, error)
    }
  }

  // 清空所有数据
  clear(): void {
    try {
      const keys = this.keys()
      keys.forEach(key => this.delete(key))
    } catch (error) {
      console.error(`[${this.extensionId}] Failed to clear store:`, error)
    }
  }

  // 获取所有键
  keys(): string[] {
    try {
      return this.ipcRenderer.sendSync('extension-store-keys-sync', this.extensionId)
    } catch (error) {
      console.error(`[${this.extensionId}] Failed to get keys:`, error)
      return []
    }
  }

  // 判断键是否存在
  has(key: string): boolean {
    return this.keys().includes(key)
  }
}
