import { IExtension } from "keyerext"
import React from "react"

export default class Ext implements IExtension {
    run(name: string): React.ReactElement | null {
        return <div>none</div>
    }
}