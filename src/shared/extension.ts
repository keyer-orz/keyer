import { IExtension, ICommand, ExtensionContextType } from 'keyerext'
import { ExtensionPackageInfo } from './render-api'
import { ExtensionConfig } from '@/app/utils/config';

export type Context = {
    dir: string // ext dir
}

// 扩展属性
export type Command = ICommand & {
  ctx: ExtensionContextType
  shortcut?: string
  disabled?: boolean
};

export class Extension {
    // 基础信息
    name: string
    // 包信息（来自 package.json）
    pkg: ExtensionPackageInfo
    // 扩展实例（加载后的运行时实例）
    ext?: IExtension

    config?:ExtensionConfig

    commands: Command[]

    constructor(
        pkg: ExtensionPackageInfo,
        ext?: IExtension,
    ) {
        this.name = pkg.name
        this.pkg = pkg
        this.ext = ext

        this.commands = [...this.pkg.commands || [], ...(this.ext?.load?.() || [])].map(cmd => ({
            ...cmd,
            id: `${this.name}#${cmd.name}`,
            type: cmd.type || 'Command',
            ctx: {
                dir: this.pkg.dir
            }
        }))
    }
}
