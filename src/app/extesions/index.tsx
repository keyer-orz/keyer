import { IExtension, WindowSize } from "keyerext";
import { ExtensionMeta } from '@/shared/extension';
import UIDemo from "./ui/ui";
import Main from "./main/ui";
import Setting from "./setting/ui";
import { StoreUI } from "./store/ui";
import { CreateExtensionUI } from "./create-ext/ui";

class Ext implements IExtension {
    run(name: string): React.ReactElement | null {
        console.log('Extension @system run with name:', name)
        if (name == 'main') return <Main />
        if (name == 'setting') return <Setting />
        if (name == 'ui') return <UIDemo />
        if (name == 'store') return <StoreUI />
        if (name == 'create_ext') return <CreateExtensionUI />
        return <div>none</div>
    }
}

export default new ExtensionMeta(
    {
        name: '@system',
        title: 'Keyer',
        desc: 'System built-in extensions',
        icon: '⚙️',
        version: '1.0.0',
        main: '',
        dir: '',
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
            },
            {
                name: 'create_ext',
                title: 'Create Extension',
                desc: 'Create a new extension from template',
                icon: '✨',
                windowSize: WindowSize.Normal
            }
        ]
    },
    new Ext(),
    'app'
);