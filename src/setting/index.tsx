import { IExtension, ICommand, ExtensionResult } from 'keyerext'
import Settings from './Settings'
declare const React: any

/**
 * Settings Extension
 * 设置面板扩展
 */
class SettingsExtension implements IExtension {
  enabledPreview = false

  async onPrepare(): Promise<Partial<ICommand>[]> {
    // 返回设置面板命令
    return [{
      name: 'settings',
      title: 'Settings',
      desc: 'Open settings panel',
      icon: '⚙️',
      windowSize: 'large'
    }]
  }

  doAction(_name: string): ExtensionResult {
    // Settings 扩展的 doAction 返回设置面板
    return <Settings />
  }

  doBack(): boolean {
    // Settings 面板按 Esc 直接返回
    return true
  }
}

// 导出扩展实例（用于扩展系统）
export const SettingsExtensionInstance = new SettingsExtension()

// 导出组件（用于 SystemCommands）
export default Settings
