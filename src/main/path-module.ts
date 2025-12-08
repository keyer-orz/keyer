import { _IMainAPI } from "@/shared/main-api";
import { app } from "electron";
import * as path from "path";

export const pathHandler: _IMainAPI['path'] = {
    userData: (...dirs: string[]): string => {
        if (dirs.length > 0) {
            return path.join(app.getPath('userData'), ...dirs)
        }
        return app.getPath('userData')
    },
    appPath: (...dirs: string[]): string => {
        if (dirs.length > 0) {
            return path.join(app.getAppPath(), ...dirs)
        }
        return app.getAppPath()
    }
}