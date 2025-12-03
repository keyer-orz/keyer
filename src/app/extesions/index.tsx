import { IExtension } from "keyerext";
import { ExtensionMeta } from '@/shared/extension';
import Setting from './setting'
import Store from './store'
import Main from './main'
import CreateExt from './create-ext'
import UIDemo from './ui'

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
    UIDemo
]

export default new ExtensionMeta(
    {
        name: '@system',
        title: 'Keyer',
        desc: 'System built-in extensions',
        icon: '⚙️',
        version: '1.0.0',
        main: '',
        dir: '',
        commands: exts.map(e => e.cmd)
    },
    new Ext(),
    'app'
);
