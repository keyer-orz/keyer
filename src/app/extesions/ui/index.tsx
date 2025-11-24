import React from 'react'
import { IExtension } from 'keyerext'
import UIDemo from './ui'

class UIExtension implements IExtension {
    run(): React.ReactElement | null {
        return <UIDemo />
    }
}

const uiExt = {
    name: '@sysetem#ui',
    ext: UIExtension
}

export default uiExt
