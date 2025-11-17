import { IExtension, ICommand, ExtensionResult } from 'keyerext'
import MainPanel, { MainPanelHandle } from './MainPanel'

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
    // 创建新的 ref 对象
    this.panelRef = { current: null }
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

    console.log('[Main] Panel state:', { isFocused, isEmpty })

    // 如果输入框未聚焦，先聚焦
    if (!isFocused) {
      console.log('[Main] Input not focused, focusing...')
      panel.focus()
      return false
    }

    // 如果有内容，先清空
    if (!isEmpty) {
      console.log('[Main] Input not empty, clearing...')
      panel.clear()
      return false
    }

    // 都满足条件，允许关闭
    console.log('[Main] Allowing close')
    return true
  }
}

// 导出扩展实例（用于扩展系统）
export const MainExtensionInstance = new Main()

// 导出组件（用于 SystemCommands）
export default MainPanel
