import { IExtension, ExtensionMeta } from "keyerext";
import UIDemo from "./ui/ui";
import Main from "./main/ui";
import Setting from "./setting/ui";

class Ext implements IExtension {
    run(name: string): React.ReactElement | null {
        console.log('Extension @system run with name:', name)
        if (name == 'main') return <Main />
        if (name == 'setting') return <Setting />
        if (name == 'ui') return <UIDemo />
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
            icon: "⚙️"
        },
        {
            name: 'ui',
            title: 'UI Components Demo',
            desc: 'Showcase all UI components',
            icon: '🎨'
        }
    ]
} as ExtensionMeta;