import AppExt from "../types";
import { WindowSize } from 'keyerext';
import UIDemo from "./UIDemoPanel";

export default {
    cmd: {
        name: 'demo_ui',
        title: 'UI Demo',
        desc: 'UI demo panel',
        icon: '✨',
        windowSize: WindowSize.Normal,
        ctx: {
            dir: "",
        }
    },
    ext: UIDemo
} as AppExt