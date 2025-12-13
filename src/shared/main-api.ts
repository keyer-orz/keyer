import { IMainAPI } from "keyerext";

interface _WindowAPI {
  create: (commandScriptPath: string) => Promise<void>
}
export interface _IMainAPI extends IMainAPI {
    window: IMainAPI['window'] & _WindowAPI
}
