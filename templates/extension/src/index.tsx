import { IExtension, IStore, ExtensionResult, ICommand, Keyer } from 'keyerext'

// ============ Extension Class ============

export default class Extension implements IExtension {
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