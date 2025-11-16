import { IExtension, ICommand, ExtensionResult } from 'keyerext'
import Store from './Store'
declare const React: any

/**
 * Store Extension
 * 插件商店扩展
 */
class StoreExtension implements IExtension {
  enabledPreview = false

  async onPrepare(): Promise<Partial<ICommand>[]> {
    // Store 扩展不提供命令，它是插件商店面板
    return []
  }

  doAction(name: string): ExtensionResult {
    // Store 扩展的 doAction 返回商店面板
    return <Store />
  }
}

// 导出扩展实例（用于扩展系统）
export const StoreExtensionInstance = new StoreExtension()

// 导出组件（用于 SystemCommands）
export default Store
