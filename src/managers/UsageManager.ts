import Store from 'electron-store'

interface UsageRecord {
  ucid: string
  count: number
  lastUsed: number // timestamp
}

/**
 * UsageManager 管理命令使用统计
 */
export class UsageManager {
  private static instance: UsageManager | null = null
  private store: Store<{ usage: UsageRecord[] }>

  private constructor() {
    this.store = new Store<{ usage: UsageRecord[] }>({
      name: 'command-usage',
      defaults: {
        usage: []
      }
    })
  }

  static getInstance(): UsageManager {
    if (!UsageManager.instance) {
      UsageManager.instance = new UsageManager()
    }
    return UsageManager.instance
  }

  /**
   * 记录命令使用
   */
  recordUsage(ucid: string): void {
    const usage = this.store.get('usage', [])
    const now = Date.now()

    const existingIndex = usage.findIndex(record => record.ucid === ucid)

    if (existingIndex >= 0) {
      // 更新已有记录
      usage[existingIndex].count++
      usage[existingIndex].lastUsed = now
    } else {
      // 添加新记录
      usage.push({
        ucid,
        count: 1,
        lastUsed: now
      })
    }

    this.store.set('usage', usage)
  }

  /**
   * 获取最近使用的命令（按最后使用时间排序）
   */
  getRecentCommands(limit: number = 5): string[] {
    const usage = this.store.get('usage', [])

    return usage
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, limit)
      .map(record => record.ucid)
  }

  /**
   * 获取最常用的命令（按使用次数排序）
   */
  getFrequentCommands(limit: number = 5): string[] {
    const usage = this.store.get('usage', [])

    return usage
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(record => record.ucid)
  }

  /**
   * 清空使用记录
   */
  clear(): void {
    this.store.set('usage', [])
  }
}
