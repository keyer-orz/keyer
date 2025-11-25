import { HStack, ICommand, IExtension } from "keyerext"
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
            },
            {
                icon: '😂',
                name: 'test2',
                title: 'Test Command',
                desc: 'This is a test command',
            },{
                icon: '😂',
                name: 'test3',
                title: 'Test Command',
                desc: 'This is a test command',
            },{
                icon: '😂',
                name: 'test4',
                title: 'Test Command',
                desc: 'This is a test command',
            },{
                icon: '😂',
                name: 'test5',
                title: 'Test Command',
                desc: 'This is a test command',
            },{
                icon: '😂',
                name: 'test6',
                title: 'Test Command',
                desc: 'This is a test command',
            },{
                icon: '😂',
                name: 'test7',
                title: 'Test Command',
                desc: 'This is a test command',
            }

        ]
    }

    preview(input: string): React.ReactElement | null {
        if (input === '1+1=') {
            return <HStack style={{paddingLeft: 20}}><div style={{fontSize: 36}}>2</div></HStack>
        }
        return null
    }

    run(name: string): React.ReactElement | null {
        return <div>none</div>
    }
}