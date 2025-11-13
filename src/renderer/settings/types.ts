export type TabType = 'general' | 'extensions' | 'scripts'

export interface InstalledExtension {
  name: string
  pkg: {
    id: string
    name: string
    title?: string
    version: string
    description?: string
  }
}

export interface InstallMessage {
  type: 'success' | 'error'
  text: string
}
