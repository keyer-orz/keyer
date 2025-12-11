import { ICommand, ExtensionContextType, CommandResult } from 'keyerext'
import { ExtensionPackageInfo } from '@/shared/render-api'
import { configManager, ExtensionConfig } from '@/app/utils/config';

export type Context = {
    dir: string // ext dir
}

// 扩展属性
export type Command = ICommand & {
    id?: string
    ctx: ExtensionContextType
    extTitle: string
    handler?: () => CommandResult

    disabled?: boolean
    shortcut?: string;
};

export type Preview = {
    id?: string
    handler: (input: string) => React.ReactElement | null
};

export class Extension {
    name: string = ""
    title?: string
    desc?: string
    icon?: string
    version?: string
    main: string = ""
    type?: "store" | "local" | "app" | "dev"

    dir: string = ""
    commands: Command[] = []

    private _active?: () => void;
    private _deactive?: () => void;

    constructor(pkg: ExtensionPackageInfo, active: () => void, deactive: () => void) {
        Object.assign(this, pkg)
        this._active = active
        this._deactive = deactive
    }

    private _config?: ExtensionConfig
    get config(): ExtensionConfig | undefined {
        if (!this._config) {
            this._config = configManager.getExtesionConfig(this.name)
        }
        return this._config
    }

    addCommand(cmd: Command) {
        if (this.commands.find(c => c.id === cmd.id)) {
            return
        }
        cmd = {
            ...cmd,
            ...this.config?.commands?.[cmd.id || '']
        }
        this.commands.push(cmd)
    }

    active() {
        this._active?.()
    }

    deactive() {
        this._deactive?.()
    }
}
