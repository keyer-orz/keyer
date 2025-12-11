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

    Keyer.command.preview("calculate", (input: string) => {
        if (input === '1+1=') {
            return <HStack style={{ paddingLeft: 20 }}><div style={{ fontSize: 36 }}>2</div></HStack>
        }
        return null
    })
}