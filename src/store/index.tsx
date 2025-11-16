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
    // 返回插件商店命令
    return [{
      name: 'store',
      title: 'Plugin Store',
      desc: 'Browse and install plugins',
      icon: '🏪',
      windowSize: 'large'
    }]
  }

  doAction(name: string): ExtensionResult {
    // Store 扩展的 doAction 返回商店面板
    return <Store />
  }

  doBack(): boolean {
    // Store 面板按 Esc 直接返回
    return true
  }
}

// 导出扩展实例（用于扩展系统）
export const StoreExtensionInstance = new StoreExtension()

// 导出组件（用于 SystemCommands）
export default Store
