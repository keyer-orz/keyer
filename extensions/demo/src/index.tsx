import { ICommand, IExtension } from "keyerext"
import React from "react"

export default class Ext implements IExtension {
    enabledPreview = true;

    load(): ICommand[] {
        return [
            {
                icon: '😂',
                name: 'test',
                title: 'Test Command',
                desc: 'This is a test command',
                type: 'command',
            }
        ]
    }

    preview(input: string): React.ReactElement | null {
        if (input === '1+1=') {
            return <div>2</div>
        }
        return null
    }

    run(name: string): React.ReactElement | null {
        return <div>none</div>
    }
}