import { ICommand, CommandResult, ExtensionContextType } from 'keyerext'
import { ExtensionPackageInfo } from '@/shared/render-api'
import { configManager, ExtensionConfig } from '@/app/utils/config';
import { activeExtension } from './ExtensionLoader';

export type Context = {
    dir: string // ext dir
}

// 扩展属性
export type Command = ICommand & {
    id?: string
    ext: ExtensionContextType

    handler?: () => CommandResult

    disabled?: boolean
    shortcut?: string;

    code?: any
};

export class Extension {
    name: string = ""
    title?: string
    desc?: string
    icon?: string
    version?: string
    main: string = ""
    private commands: ICommand[] = []
    type?: "store" | "local" | "app" | "dev"

    dir: string = ""
    allCommands: Command[] = []

    constructor(pkg: ExtensionPackageInfo) {
        Object.assign(this, pkg)

        this.commands.forEach(cmd => {
            this.addCommand({
                ...cmd,
                id: `${this.name}#${cmd.name}`,
                ext: {
                    dir: this.dir,
                    name: this.name,
                    title: this.title || ""
                }
            })
        })
    }

    private _config?: ExtensionConfig
    get config(): ExtensionConfig | undefined {
        if (!this._config) {
            this._config = configManager.getExtesionConfig(this.name)
        }
        return this._config
    }

    addCommand(cmd: Command) {
        console.log("Register command:", cmd)
        if (this.allCommands.find(c => c.id === cmd.id)) {
            return
        }
        cmd = {
            ...cmd,
            ...this.config?.commands?.[cmd.id || '']
        }
        this.allCommands.push(cmd)
    }

    active() {
        activeExtension(this)
    }
}
