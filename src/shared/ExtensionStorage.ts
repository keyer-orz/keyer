import Store from 'electron-store'
import { IStore } from 'keyerext'

export class ExtensionStorage implements IStore {
  private store: Store

  constructor(extensionId: string) {
    // 为每个扩展创建独立的存储实例
    this.store = new Store({
      name: `store`,
      cwd: `extensions/${extensionId}`, // 存储在 userData/extensions 目录下
      clearInvalidConfig: true, // 如果配置文件损坏，自动清除
    })
  }

  // 获取值
  get<T = any>(key: string): T | undefined
  get<T = any>(key: string, defaultValue: T): T
  get<T = any>(key: string, defaultValue?: T): T | undefined {
    return this.store.get(key, defaultValue) as T
  }

  // 设置值
  set(key: string, value: any): void {
    this.store.set(key, value)
  }

  // 删除值
  delete(key: string): void {
    this.store.delete(key)
  }

  // 清空所有数据
  clear(): void {
    this.store.clear()
  }

  // 获取所有键
  keys(): string[] {
    // electron-store 没有直接的 keys() 方法，需要通过 store 属性获取
    const data = this.store.store
    return Object.keys(data)
  }

  // 判断键是否存在
  has(key: string): boolean {
    return this.store.has(key)
  }
}
