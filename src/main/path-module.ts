import { _IMainAPI } from "@/shared/main-api";
import { app } from "electron";
import * as path from "path";

export const pathHandler: _IMainAPI['path'] = {
    userData: async (...dirs: string[]) => {
        return Promise.resolve(path.join(app.getPath('userData'), ...dirs))
    },
    appPath: async (...dirs: string[]) => {
        return Promise.resolve(path.join(app.getAppPath(), ...dirs))
    }
}