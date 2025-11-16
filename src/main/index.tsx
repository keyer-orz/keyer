import { IExtension, ICommand, ExtensionResult } from 'keyerext'
import MainPanel from './MainPanel'
declare const React: any

/**
 * Main Extension
 * 主搜索面板扩展
 */
class Main implements IExtension {
  enabledPreview = false

  async onPrepare(): Promise<Partial<ICommand>[]> {
    // 返回主面板命令
    return [{
      name: 'main',
      title: 'Main',
      desc: 'Main search panel',
      icon: '🏠',
      windowSize: 'normal'
    }]
  }

  doAction(name: string): ExtensionResult {
    // Main 扩展的 doAction 返回主面板
    return <MainPanel />
  }

  doBack(): boolean {
    // Main 面板的 Esc 行为由内部处理（Input 清空等）
    // 暂时返回 true，让系统处理
    return true
  }
}

// 导出扩展实例（用于扩展系统）
export const MainExtension = new Main()

// 导出组件（用于 SystemCommands）
export default MainPanel
