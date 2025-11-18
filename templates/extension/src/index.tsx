import React from 'react'
import { IExtension, IStore, ExtensionResult, ICommand, Keyer } from 'keyerext'

// ============ Extension Class ============

class Extension implements IExtension {
  store?: IStore
  enabledPreview = false
  async onPrepare(): Promise<ICommand[]> {
    return []
  }

  doAction(name: string): ExtensionResult {
    return null
  }

  doBack(): boolean {
    return true
  } 
}

export default new Extension()
