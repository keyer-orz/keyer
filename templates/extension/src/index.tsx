import { IExtension, IExtensionStore } from "keyerext"
import React from "react"
export default class Ext implements IExtension {
    store?: IExtensionStore

    run(name: string): React.ReactElement | null {
        return null
    }
}