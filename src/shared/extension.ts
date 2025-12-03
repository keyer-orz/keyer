import { IExtension, ICommand } from 'keyerext'
import { ExtensionPackageInfo } from './ipc'

export class ExtensionMeta {
    // 基础信息
    name: string                    // 扩展名称
    title: string                   // 展示名称
    type: 'store' | 'local' | 'app' // 插件类型

    // 包信息（来自 package.json）
    pkg: ExtensionPackageInfo

    // 扩展实例（加载后的运行时实例）
    ext?: IExtension

    constructor(
        pkg: ExtensionPackageInfo,
        ext?: IExtension,
        type: 'store' | 'local' | 'app' = 'local'
    ) {
        this.name = pkg.name
        this.title = pkg.title || pkg.name
        this.type = type
        this.pkg = pkg
        this.ext = ext
    }

    // 方法：获取所有命令（静态 + 动态）
    allCommands(): ICommand[] {
        const allCommands: ICommand[] = []

        // 1. 静态命令（package.json 中记录的）
        if (this.pkg.commands) {
            this.pkg.commands.forEach(cmd => {
                allCommands.push({
                    ...cmd,
                    id: `${this.name}#${cmd.name}`,
                    extTitle: this.title,
                    type: cmd.type || 'Command'
                })
            })
        }

        // 2. 动态命令（ext.load() 返回的）
        if (this.ext && typeof this.ext.load === 'function') {
            try {
                const loaded = this.ext.load()
                if (Array.isArray(loaded)) {
                    loaded.forEach(cmd => {
                        allCommands.push({
                            ...cmd,
                            id: `${this.name}#${cmd.name}`,
                            extTitle: this.title,
                            type: cmd.type || 'Command'
                        })
                    })
                }
            } catch (e) {
                console.error(`Failed to load commands from ${this.name}:`, e)
            }
        }

        return allCommands
    }
}
