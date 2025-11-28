import { useRef } from 'react'
import { VStack, Input, useAutoFocusOnVisible, useEscapeHandler, type InputRef } from 'keyerext'
import { useStore } from './useStore'
import { ExtensionList } from './ExtensionList'
import { ExtensionDetail } from './ExtensionDetail'

export function StoreUI() {
    const inputRef = useRef<InputRef>(null)
    const {
        searchQuery,
        filteredExtensions,
        selectedExtension,
        extensionStatus,
        loading,
        error,
        setSearchQuery,
        setSelectedExtension,
        fetchStoreData
    } = useStore()

    useAutoFocusOnVisible(inputRef)

    useEscapeHandler(() => {
        if (selectedExtension) {
            setSelectedExtension(null)
            return false
        }
        if (inputRef.current && !inputRef.current.isFocused()) {
            inputRef.current.focus()
            return false
        }
        if (inputRef.current && !inputRef.current.isEmpty()) {
            setSearchQuery('')
            return false
        }
        return true
    })

    return (
        <VStack className='plugin'>
            {/* Search */}
            <Input
                ref={inputRef}
                placeholder="Search extensions..."
                value={searchQuery}
                onChange={setSearchQuery}
            />

            {/* Extension List */}
            <ExtensionList
                extensions={filteredExtensions}
                extensionStatus={extensionStatus}
                selectedExtension={selectedExtension}
                onSelectExtension={setSelectedExtension}
                loading={loading}
                error={error}
                onRetry={fetchStoreData}
            />

            {/* Extension Details Drawer */}
            <ExtensionDetail
                extension={selectedExtension}
                extensionStatus={extensionStatus}
                onClose={() => setSelectedExtension(null)}
            />
        </VStack>
    )
}