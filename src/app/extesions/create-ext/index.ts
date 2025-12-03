import AppExt from "../types";
import { WindowSize } from 'keyerext';
import CreateExtPanel from "./CreateExtPanel";

export default {
    cmd: {
        name: 'create_ext',
        title: 'Create Extension',
        desc: 'Create a new extension from template',
        icon: '✨',
        windowSize: WindowSize.Normal,
        dir: ""
    },
    ext: CreateExtPanel
} as AppExt