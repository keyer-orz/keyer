import AppExt from "../types";
import { WindowSize, CommandResult } from 'keyerext';
import UIDemo from "./UIDemoPanel";
import { Keyer } from "@/app/keyer";


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

Keyer.command.register('@system#uidemo', (): CommandResult => {
    return <UIDemo />
})