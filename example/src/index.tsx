import { HStack, Keyer } from "keyerext"

export function active() {
    Keyer.command.register({
        icon: '🧪',
        name: 'test1',
        title: 'Test Command',
        desc: 'This is a test command',
    }, () => {
        console.log('Hello from test extension!')
        return null
    })
}