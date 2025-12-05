import type { StoreExtension, ExtensionStatus } from './types'
import { Keyer } from '@/app/keyer'

export const fetchStoreData = async (): Promise<StoreExtension[]> => {
    const url = 'https://keyer-orz.github.io/store/app.json?t=' + Date.now()
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }
    const datas = Object.values(await response.json()) as StoreExtension[]
    return datas.map(e=>{
        e.downloadUrl = `${e.repo}/releases/download/${e.version}/release.tar.gz`
        return e as StoreExtension
    }) || []
}

export const checkExtensionStatus = async (extension: StoreExtension): Promise<ExtensionStatus> => {
    try {
        const installed = await Keyer.extensions.getInstalledExtensions()
        const found = installed.find(ext => ext.name === extension.name)
        
        if (!found) {
            return {
                isInstalled: false,
                canUpgrade: false
            }
        }

        const canUpgrade = found.version !== extension.version
        
        return {
            isInstalled: true,
            canUpgrade,
            installedVersion: found.version
        }
    } catch (error) {
        console.error('Failed to check extension status:', error)
        return {
            isInstalled: false,
            canUpgrade: false
        }
    }
}

export const handleInstall = async (extension: StoreExtension): Promise<boolean> => {
    try {
        if (!extension.downloadUrl) {
            throw new Error('Download URL not available')
        }
        
        console.log('Installing:', extension.name, 'from', extension.downloadUrl)
        const success = await Keyer.extensions.downloadAndInstall(extension.downloadUrl, extension.name)
        
        if (success) {
            console.log('✅ Extension installed successfully')
        }
        
        return success
    } catch (error) {
        console.error('❌ Failed to install extension:', error)
        throw error
    }
}

export const handleUpgrade = async (extension: StoreExtension): Promise<boolean> => {
    try {
        console.log('Upgrading:', extension.name)
        
        // 先卸载旧版本
        await Keyer.extensions.uninstallUserExtension(extension.name)
        
        // 安装新版本
        return await handleInstall(extension)
    } catch (error) {
        console.error('❌ Failed to upgrade extension:', error)
        throw error
    }
}

export const handleUninstall = async (extension: StoreExtension): Promise<boolean> => {
    try {
        console.log('Uninstalling:', extension.name)
        const success = await Keyer.extensions.uninstallUserExtension(extension.name)
        
        if (success) {
            console.log('✅ Extension uninstalled successfully')
        }
        
        return success
    } catch (error) {
        console.error('❌ Failed to uninstall extension:', error)
        throw error
    }
}
