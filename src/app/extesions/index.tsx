import { IExtension, ExtensionMeta, WindowSize } from "keyerext";
import UIDemo from "./ui/ui";
import Main from "./main/ui";
import Setting from "./setting/ui";
import { StoreUI } from "./store/ui";

class Ext implements IExtension {
    run(name: string): React.ReactElement | null {
        console.log('Extension @system run with name:', name)
        if (name == 'main') return <Main />
        if (name == 'setting') return <Setting />
        if (name == 'ui') return <UIDemo />
        if (name == 'store') return <StoreUI />
        return <div>none</div>
    }
}

export default {
    name: '@system',
    title: 'Keyer',
    type: 'app',
    ext: new Ext(),
    commands: [
        {
            name: "main",
            title: "Main Page",
            desc: "Open the main page",
            icon: "🏠"
        },
        {
            name: "setting",
            title: "Setting",
            desc: "Open the setting page",
            icon: "⚙️",
            windowSize: WindowSize.Large
        },
        {
            name: 'ui',
            title: 'UI Components Demo',
            desc: 'Showcase all UI components',
            icon: '🎨'
        },
        {
            name: 'store',
            title: 'Extensions Store',
            desc: 'Browse and install extensions',
            icon: '🏪',
        }
    ]
} as ExtensionMeta;