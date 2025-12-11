import { activeUIDemo } from './ui/UIDemoPanel'
import { activeMain } from './main/MainPanel';
import { activeSetting } from './setting/SettingPanel';
import { activeStore } from './store/StorePanel';
import { activeInstallExtension } from './install/InstallExtension';
import { activeCreateExtension } from './create-ext/CreateExtPanel';

export default function active() {
    activeMain()
    activeUIDemo()
    activeSetting()
    activeStore()
    activeInstallExtension()
    activeCreateExtension()
}
