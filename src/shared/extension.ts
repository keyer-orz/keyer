import { IExtension, ICommand, ExtensionContextType } from 'keyerext'
import { ExtensionPackageInfo } from './render-api'

export type Context = {
    dir: string // ext dir
}

// 扩展属性
export type Command = ICommand & {
  ctx: ExtensionContextType
};

export class Extension {
    // 基础信息
    name: string                    // 扩展名称
    // 包信息（来自 package.json）
    pkg: ExtensionPackageInfo
    // 扩展实例（加载后的运行时实例）
    ext?: IExtension

    constructor(
        pkg: ExtensionPackageInfo,
        ext?: IExtension,
    ) {
        this.name = pkg.name
        this.pkg = pkg
        this.ext = ext
    }

    allCommands(): Command[] {
        return [...this.pkg.commands || [], ...(this.ext?.load?.() || [])].map(cmd => ({
            ...cmd,
            id: `${this.name}#${cmd.name}`,
            type: cmd.type || 'Command',
            ctx: {
                dir: this.pkg.dir
            }
        }))
    }
}
