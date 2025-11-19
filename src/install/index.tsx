import { IExtension, ICommand, ExtensionResult } from 'keyerext'
import InstallPanel from './InstallPanel'
declare const React: any

/**
 * Install Plugin Extension
 * 安装插件扩展
 */
class InstallExtension implements IExtension {
    enabledPreview = false

    async onPrepare(): Promise<Partial<ICommand>[]> {
        // 返回安装插件命令
        return [{
            name: 'install',
            title: 'Install Plugin',
            desc: 'Install an existing plugin from a folder',
            icon: '📦',
            windowSize: 'large'
        }]
    }

    doAction(_name: string): ExtensionResult {
        // Install 扩展的 doAction 返回安装面板
        return <InstallPanel />
    }

    doBack(): boolean {
        // Install 面板按 Esc 直接返回
        return true
    }
}

// 导出扩展实例（用于扩展系统）
export const InstallExtensionInstance = new InstallExtension()

// 导出组件
export default InstallPanel
