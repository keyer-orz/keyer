import AppExt from "../types";
import MainPanel from "./MainPanel";

export default {
    cmd: {
        name: "main",
        title: "Main Page",
        desc: "Open the main page",
        icon: "🏠",
        ctx: {
            dir: "",
        }
    },
    ext: MainPanel
} as AppExt