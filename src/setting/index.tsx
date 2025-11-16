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
    // Settings 扩展不提供命令，它是系统设置面板
    return []
  }

  doAction(name: string): ExtensionResult {
    // Settings 扩展的 doAction 返回设置面板
    return <Settings />
  }
}

// 导出扩展实例（用于扩展系统）
export const SettingsExtensionInstance = new SettingsExtension()

// 导出组件（用于 SystemCommands）
export default Settings
