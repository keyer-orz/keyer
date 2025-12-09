import AppExt from "../types";
import { InstallExtension } from "./InstallExtension";

export default {
    cmd: {
        name: "install",
        title: "安装插件",
        desc: "从本地路径安装插件",
        icon: "📦",
        ctx: {
            dir: "",
        }
    },
    ext: InstallExtension
} as AppExt
