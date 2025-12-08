import { _IMainAPI } from "@/shared/main-api";
import { app } from "electron";

export const pathHandler: _IMainAPI['path'] = {
    userData: (dir?: string): string => {
        if (dir) {
            return app.getPath('userData') + '/' + dir
        }
        return app.getPath('userData')
    },
    appPath: (dir?: string): string => {
        if (dir) {
            return app.getAppPath() + '/' + dir
        }
        return app.getAppPath()
    }
}