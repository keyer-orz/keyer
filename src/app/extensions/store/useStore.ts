import { useState, useEffect } from 'react'
import type { StoreExtension, ExtensionStatus, StoreState } from './types'
import { fetchStoreData as fetchStoreDataAPI } from './api'
import { Keyer } from '@/app/keyer'
import { commandManager } from '@/app/managers/CommandManager'

export function useStore() {
    const [state, setState] = useState<StoreState>({
        searchQuery: '',
        extensions: [],
        selectedExtension: null,
        extensionStatus: {},
        loading: true,
        error: null
    })

    const setSearchQuery = (query: string) => {
        setState(prev => ({ ...prev, searchQuery: query }))
    }

    const setSelectedExtension = (extension: StoreExtension | null) => {
        setState(prev => ({ ...prev, selectedExtension: extension }))
    }

    const fetchStoreData = async () => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }))
            
            const extensions = await fetchStoreDataAPI()
            
            // 检查已安装插件状态
            const status: Record<string, ExtensionStatus> = {}
            
            setState(prev => ({
                ...prev,
                extensions,
                extensionStatus: status,
                loading: false
            }))
        } catch (err) {
            console.error('Failed to fetch store data:', err)
            setState(prev => ({
                ...prev,
                error: err instanceof Error ? err.message : 'Failed to load store data',
                loading: false
            }))
        }
    }

    const filteredExtensions = state.extensions.filter(ext => {
        if (!state.searchQuery.trim()) return true
        const query = state.searchQuery.toLowerCase()
        return ext.name.toLowerCase().includes(query) ||
            ext.title.toLowerCase().includes(query) ||
            ext.description.toLowerCase().includes(query) ||
            ext.tags?.some(tag => tag.toLowerCase().includes(query))
    })

    // 初始化加载数据
    useEffect(() => {
        fetchStoreData()
    }, [])

    return {
        ...state,
        filteredExtensions,
        setSearchQuery,
        setSelectedExtension,
        fetchStoreData
    }
}
