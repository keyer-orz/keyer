import { IExtension } from "keyerext";
import { Extension } from '@/shared/extension';
import Setting from './setting'
import Store from './store'
import Main from './main'
import CreateExt from './create-ext'
import UIDemo from './ui'
import Install from './install'

class Ext implements IExtension {
    run(name: string): React.ReactElement | null {
        let Ext = exts.find(e => e.cmd.name === name)?.ext 
        return Ext ? <Ext /> : <div>not registered</div>
    }
} 

const exts = [
    Main,
    Setting,
    Store,
    CreateExt,
    UIDemo,
    Install
]

export default new Extension(
    {
        name: '@system',
        title: 'Keyer',
        desc: 'System built-in extensions',
        icon: '⚙️',
        version: '1.0.0',
        main: '',
        dir: "",
        type: 'app',
        commands: exts.map(e => e.cmd)
    },
    new Ext()
);
