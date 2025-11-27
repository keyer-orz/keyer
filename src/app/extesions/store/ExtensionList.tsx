import { VStack, HStack, Text, List, Button, Loading } from 'keyerext'
import type { StoreExtension, ExtensionStatus } from './types'

interface ExtensionListProps {
    extensions: StoreExtension[]
    extensionStatus: Record<string, ExtensionStatus>
    selectedExtension: StoreExtension | null
    onSelectExtension: (extension: StoreExtension) => void
    loading: boolean
    error: string | null
    onRetry: () => void
}

export function ExtensionList({
    extensions,
    extensionStatus,
    selectedExtension,
    onSelectExtension,
    loading,
    error,
    onRetry
}: ExtensionListProps) {
    if (loading) {
        return (
            <VStack spacing={20} style={{ padding: '40px', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                <Loading size="large" text="Loading extensions..." />
            </VStack>
        )
    }

    if (error) {
        return (
            <VStack spacing={20} style={{ padding: '40px', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                <Text color="title" size="medium">Failed to load store</Text>
                <Text color="subtitle" size="small">{error}</Text>
                <Button onClick={onRetry} type="primary">
                    Retry
                </Button>
            </VStack>
        )
    }

    if (extensions.length === 0) {
        return (
            <VStack spacing={8} style={{ padding: '40px', alignItems: 'center' }}>
                <Text color="subtitle" size="medium">No extensions found</Text>
                <Text color="subtitle" size="small">Try a different search query</Text>
            </VStack>
        )
    }

    const listGroups = [{
        items: extensions.map(ext => ({
            id: ext.name,
            data: ext
        }))
    }]

    const renderExtensionItem = (item: { id: string; data: StoreExtension }) => {
        const ext = item.data
        return (
            <HStack spacing={12} style={{ alignItems: 'flex-start' }}>
                <div style={{ fontSize: '24px', marginTop: '2px' }}>
                    {ext.icon || '📦'}
                </div>
                <VStack spacing={4} style={{ alignItems: 'flex-start', flex: 1 }}>
                    <HStack spacing={8} style={{ alignItems: 'center', width: '100%' }}>
                        <Text color="title" size="medium" style={{ fontWeight: 600 }}>
                            {ext.title}
                        </Text>
                        <div style={{ flex: 1 }} />
                        <Text color="subtitle" size="small">v{ext.version}</Text>
                    </HStack>
                    <Text color="subtitle" size="small" style={{ lineHeight: 1.4 }}>
                        {ext.description}
                    </Text>
                    <HStack spacing={8} style={{ marginTop: 4 }}>
                        <Text color="subtitle" size="small">by {ext.author}</Text>
                        {extensionStatus[ext.name]?.isInstalled && (
                            <span style={{
                                padding: '2px 6px',
                                backgroundColor: 'var(--color-accent)',
                                color: 'white',
                                borderRadius: 3,
                                fontSize: '10px'
                            }}>
                                INSTALLED
                            </span>
                        )}
                        {extensionStatus[ext.name]?.canUpgrade && (
                            <span style={{
                                padding: '2px 6px',
                                backgroundColor: 'var(--color-warning, #ff9500)',
                                color: 'white',
                                borderRadius: 3,
                                fontSize: '10px'
                            }}>
                                UPDATE
                            </span>
                        )}
                    </HStack>
                </VStack>
            </HStack>
        )
    }

    return (
        <div style={{ flex: 1, overflowY: 'auto' }}>
            <List
                groups={listGroups}
                selectedId={selectedExtension?.name}
                onEnter={(_, data) => onSelectExtension(data)}
                renderItem={renderExtensionItem}
            />
        </div>
    )
}
