import { IExtension, ICommand, ExtensionResult } from 'keyerext'
import CreatePanel from './CreatePanel'
declare const React: any

/**
 * Create Plugin Extension
 * 创建插件扩展
 */
class CreateExtension implements IExtension {
    enabledPreview = false

    async onPrepare(): Promise<Partial<ICommand>[]> {
        // 返回创建插件命令
        return [{
            name: 'create',
            title: 'Create Plugin',
            desc: 'Create a new script or extension plugin',
            icon: '✨',
            windowSize: 'large'
        }]
    }

    doAction(_name: string): ExtensionResult {
        // Create 扩展的 doAction 返回创建面板
        return <CreatePanel />
    }

    doBack(): boolean {
        // Create 面板按 Esc 直接返回
        return true
    }
}

// 导出扩展实例（用于扩展系统）
export const CreateExtensionInstance = new CreateExtension()

// 导出组件
export default CreatePanel
