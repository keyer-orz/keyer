import AppExt from "../types";
import StorePanel from "./StorePanel";

export default {
    cmd: {
        name: 'store',
        title: 'Extensions Store',
        desc: 'Browse and install extensions',
        icon: '🏪',
        ctx: {
            dir: "",
        }
    },
    ext: StorePanel
} as AppExt