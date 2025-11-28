import { IExtensionStore } from 'keyerext'
import Store from 'electron-store'

/**
 * 扩展数据存储实现
 * 基于 electron-store，为每个扩展提供独立的数据存储空间
 * 存储路径：$userData/stores/$ext.name.json
 */
export class ExtensionStore implements IExtensionStore {
  private store: Store<Record<string, any>>

  constructor(extensionName: string) {
    // 使用 electron-store 创建扩展专用的存储实例
    // 文件将保存在 $userData/stores/$ext.name/store.json
    this.store = new Store<Record<string, any>>({
      name: `stores/${extensionName}/store`,
      defaults: {}
    })
  }

  /**
   * 获取数据
   */
  get<T = any>(key: string, defaultValue?: T): T {
    return this.store.get(key, defaultValue)
  }

  /**
   * 设置数据
   */
  set<T = any>(key: string, value: T): void {
    this.store.set(key, value)
  }

  /**
   * 删除数据
   */
  delete(key: string): void {
    this.store.delete(key)
  }

  /**
   * 检查键是否存在
   */
  has(key: string): boolean {
    return this.store.has(key)
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * 获取所有键名
   */
  keys(): string[] {
    return Object.keys(this.store.store)
  }

  /**
   * 保存到文件（electron-store 自动处理，保持接口兼容）
   */
  async save(): Promise<void> {
    // electron-store 会自动保存，这里不需要做任何操作
    // 保持接口兼容性
  }
}