import type { StoreExtension, ExtensionStatus } from './types'

export const fetchStoreData = async (): Promise<StoreExtension[]> => {
    // 开发环境使用本地测试数据，生产环境使用远程 API
    const isDev = process.env.NODE_ENV === 'development'
    const url = isDev
        ? '/store-demo.json'
        : 'https://keyer-orz.github.io/store/app.json'

    await new Promise(resolve => setTimeout(resolve, 500)) // 模拟网络延迟
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.extensions || []
}

export const checkExtensionStatus = (_extension: StoreExtension): ExtensionStatus => {
    // TODO: 实现检查本地已安装插件的逻辑
    // 这里需要与 CommandManager 或 ExtensionLoader 集成
    return {
        isInstalled: false,
        canUpgrade: false
    }
}

export const handleInstall = async (extension: StoreExtension) => {
    console.log('Installing:', extension.name)
    // TODO: 实现安装逻辑
}

export const handleUpgrade = async (extension: StoreExtension) => {
    console.log('Upgrading:', extension.name)
    // TODO: 实现升级逻辑
}

export const handleUninstall = async (extension: StoreExtension) => {
    console.log('Uninstalling:', extension.name)
    // TODO: 实现卸载逻辑
}
