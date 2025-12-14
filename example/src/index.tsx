import { Image, Keyer } from "keyerext"

// 启动激活
export function active() {
    Keyer.command.register({ 
        icon: '🧪',
        name: 're_cmd_simple',
        title: 're_cmd_simple',
        desc: 'This is a test command',
    }, () => {
        console.log('Hello from test extension!')
        return null
    })

    Keyer.command.register({ 
        icon: '🧪',
        name: 're_cmd_view',
        title: 're_cmd_view',
        desc: 'This is a test view command',
    }, () => {
        return <Image src="assets/icon.png" />
    })
}