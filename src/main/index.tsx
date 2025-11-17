import { IExtension, ICommand, ExtensionResult } from 'keyerext'
import MainPanel, { MainPanelHandle } from './MainPanel'
declare const React: any

/**
 * Main Extension
 * 主搜索面板扩展
 */
class Main implements IExtension {
  enabledPreview = false
  private panelRef: { current: MainPanelHandle | null } | null = null

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
    console.log('[Main] doAction called with name:', name)
    // 创建新的 ref
    this.panelRef = { current: null }
    // Main 扩展的 doAction 返回主面板
    return <MainPanel ref={this.panelRef} />
  }

  doBack(): boolean {
    console.log('[Main] doBack called')
    if (!this.panelRef?.current) {
      console.log('[Main] No panel ref, returning true')
      return true
    }

    const panel = this.panelRef.current
    const isFocused = panel.isFocused()
    const isEmpty = panel.isEmpty()

    console.log('[Main] Panel state - isFocused:', isFocused, 'isEmpty:', isEmpty)

    // 1. 未聚焦：聚焦，return false
    if (!isFocused) {
      console.log('[Main] Input not focused, focusing now')
      panel.focus()
      return false
    }

    // 2. 聚焦：
    //    a. 不为空，清空 return false
    if (!isEmpty) {
      console.log('[Main] Input not empty, clearing now')
      panel.clear()
      return false
    }

    //    b. 为空 return true
    console.log('[Main] Input empty, returning true to close')
    return true
  }
}

// 导出扩展实例（用于扩展系统）
export const MainExtensionInstance = new Main()

// 导出组件（用于 SystemCommands）
export default MainPanel
