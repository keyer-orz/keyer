export interface StoreExtension {
    name: string
    title: string
    description: string
    version: string
    author: string
    icon?: string
    tags?: string[]
    downloadUrl?: string
}

export interface ExtensionStatus {
    isInstalled: boolean
    canUpgrade: boolean
    installedVersion?: string
}

export interface StoreState {
    searchQuery: string
    extensions: StoreExtension[]
    selectedExtension: StoreExtension | null
    extensionStatus: Record<string, ExtensionStatus>
    loading: boolean
    error: string | null
}
