import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import { IStore } from 'keyerext'

export class ExtensionStore implements IStore {
  private extensionId: string
  private storePath: string
  private data: Record<string, any> = {}

  constructor(extensionId: string) {
    this.extensionId = extensionId

    // 存储路径：userData/extensions/{extensionId}/store.json
    const userDataPath = app.getPath('userData')
    const storeDir = path.join(userDataPath, 'extensions', extensionId)

    // 确保目录存在
    if (!fs.existsSync(storeDir)) {
      fs.mkdirSync(storeDir, { recursive: true })
    }

    this.storePath = path.join(storeDir, 'store.json')
    this.load()
  }

  // 从文件加载数据
  private load(): void {
    try {
      if (fs.existsSync(this.storePath)) {
        const content = fs.readFileSync(this.storePath, 'utf-8')
        this.data = JSON.parse(content)
        console.log(`[${this.extensionId}] Store loaded:`, Object.keys(this.data))
      }
    } catch (error) {
      console.error(`[${this.extensionId}] Failed to load store:`, error)
      this.data = {}
    }
  }

  // 保存数据到文件
  private save(): void {
    try {
      fs.writeFileSync(this.storePath, JSON.stringify(this.data, null, 2))
      console.log(`[${this.extensionId}] Store saved:`, Object.keys(this.data))
    } catch (error) {
      console.error(`[${this.extensionId}] Failed to save store:`, error)
    }
  }

  // 获取值
  get<T = any>(key: string): T | undefined
  get<T = any>(key: string, defaultValue: T): T
  get<T = any>(key: string, defaultValue?: T): T | undefined {
    if (key in this.data) {
      return this.data[key] as T
    }
    return defaultValue
  }

  // 设置值
  set(key: string, value: any): void {
    this.data[key] = value
    this.save()
  }

  // 删除值
  delete(key: string): void {
    delete this.data[key]
    this.save()
  }

  // 清空所有数据
  clear(): void {
    this.data = {}
    this.save()
  }

  // 获取所有键
  keys(): string[] {
    return Object.keys(this.data)
  }

  // 判断键是否存在
  has(key: string): boolean {
    return key in this.data
  }
}
