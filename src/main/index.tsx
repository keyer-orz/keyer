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
    // Main 扩展不提供命令，它本身就是主面板
    return []
  }

  doAction(name: string): ExtensionResult {
    // Main 扩展的 doAction 返回主面板
    // name 参数在这里不使用，因为 Main 只有一个功能：显示主面板
    return <MainPanel />
  }
}

// 导出扩展实例（用于扩展系统）
export const MainExtension = new Main()

// 导出组件（用于 SystemCommands）
export default MainPanel
