import { HStack, ICommand, IExtension, IExtensionStore, Image, Keyer } from "keyerext"
import path from "path";
import React from "react"
import * as fs from 'fs';

export default class Ext implements IExtension {
    store?: IExtensionStore;
    enabledPreview = true;

    load(): ICommand[] {
        return [
            {
                icon: '😂',
                name: 'test',
                title: 'Test Command',
                desc: 'This is a test command',
            }
        ]
    }

    preview(input: string): React.ReactElement | null {
        if (input === '1+1=') {
            return <HStack style={{ paddingLeft: 20 }}><div style={{ fontSize: 36 }}>2</div></HStack>
        }
        return null
    }

    private getIconUrl(iconName: string): string {
        // 优先使用内置图标
        console.log(__dirname)
        const builtinIconPath = path.join(__dirname, '../assets', `${iconName}.png`)
        console.log(`${builtinIconPath}`)
        if (fs.existsSync(builtinIconPath)) {
            return `asset://${builtinIconPath}`
        }
        return ""
    }

    run(name: string): React.ReactElement | null {
        console.log('run command:', name)
        if (name == 'hello') {
            Keyer.clipboard.writeText("hello")
        }
        if (name == 'cmd-window') {
            Keyer.exec('ping www.baidu.com', {
                mode: 'window'
            })
            return null
        }
        if (name == 'cmd-shell') {
            Keyer.exec('ping www.baidu.com', {
                mode: 'terminal'
            })
            return null
        }
        this.store?.set('last-run-command', name)
        return <div><Image ctx={this} src="asset://shottr.png" /></div>
    }
}