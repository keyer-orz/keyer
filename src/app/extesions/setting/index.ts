import { WindowSize } from "keyerext";
import AppExt from "../types";
import SettingPanel from './SettingPanel';

export default {
    cmd: {
        name: "setting",
        title: "Setting",
        desc: "Open the setting page",
        icon: "⚙️",
        windowSize: WindowSize.Large,
        dir: "",
    },
    ext: SettingPanel
} as AppExt