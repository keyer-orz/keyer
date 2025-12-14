import { ExtensionContextType, ICommand, IMainAPI } from "keyerext";

export type CommandData = {
  ext: ExtensionContextType
} & ICommand

interface _WindowAPI {
  create: (command: CommandData) => Promise<void>
}

interface _ShortcutAPI {
  unregisterAll: () => Promise<void>
}

export interface _IMainAPI extends IMainAPI {
    window: IMainAPI['window'] & _WindowAPI
    shortcuts: IMainAPI['shortcuts'] & _ShortcutAPI
}
