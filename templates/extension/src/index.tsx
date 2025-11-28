import { HStack, ICommand, IExtension, IExtensionStore, Keyer } from "keyerext"
import React from "react"

export default class Ext implements IExtension {
    store?: IExtensionStore
    load?(): ICommand[] {
        // return daynamic commands if needed, delete to use static commands (package.json commands field)
        throw new Error("Method not implemented.")
    }
    run(name: string): React.ReactElement | null {
        // implement your command execution logic here
        throw new Error("Method not implemented.")
    }
}