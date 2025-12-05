import { HStack, ICommand, IExtension, IExtensionStore, Text, Keyer, useExtensionContext, VStack } from "keyerext"
import React from "react"
import { DemoUI } from "./DemoUI";

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
            },
            {
                icon: '📋',
                name: 'context',
                title: 'Extension Context Demo',
                desc: 'Show extension context information',
            }
        ]
    }

    preview(input: string): React.ReactElement | null {
        if (input === '1+1=') {
            return <HStack style={{ paddingLeft: 20 }}><div style={{ fontSize: 36 }}>2</div></HStack>
        }
        return null
    }

    run(name: string): React.ReactElement | null {
        console.log('run command:', name)
        if (name == 'hello') {
            Keyer.clipboard.writeText("hello")
        }
        if (name == 'cmd-window') {
            Keyer.exec.window('ping www.baidu.com')
            return null
        }
        if (name == 'cmd-shell') {
            Keyer.exec.terminal('ping www.baidu.com')
            return null
        }
        if (name == 'context') {
            return <DemoUI />
        }
        this.store?.set('last-run-command', name)
        return <div>11</div>
    }
}