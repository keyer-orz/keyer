import { VStack, HStack, Text, Drawer, Button } from 'keyerext'
import type { StoreExtension, ExtensionStatus } from './types'
import { handleInstall, handleUpgrade, handleUninstall } from './api'

interface ExtensionDetailProps {
    extension: StoreExtension | null
    extensionStatus: Record<string, ExtensionStatus>
    onClose: () => void
}

export function ExtensionDetail({ extension, extensionStatus, onClose }: ExtensionDetailProps) {
    const renderActionButton = (ext: StoreExtension) => {
        const status = extensionStatus[ext.name]
        if (!status) return null

        if (status.isInstalled) {
            if (status.canUpgrade) {
                return (
                    <HStack spacing={8}>
                        <Button
                            onClick={() => handleUpgrade(ext)}
                            type="primary"
                            size="small"
                        >
                            Upgrade
                        </Button>
                        <Button
                            onClick={() => handleUninstall(ext)}
                            type="danger"
                            size="small"
                        >
                            Uninstall
                        </Button>
                    </HStack>
                )
            } else {
                return (
                    <Button
                        onClick={() => handleUninstall(ext)}
                        type="danger"
                        size="small"
                    >
                        Uninstall
                    </Button>
                )
            }
        } else {
            return (
                <Button
                    onClick={() => handleInstall(ext)}
                    type="primary"
                    size="small"
                >
                    Install
                </Button>
            )
        }
    }

    return (
        <Drawer
            open={extension !== null}
            onClose={onClose}
            placement="right"
            width={500}
            showCloseButton={true}
            maskClosable={true}
        >
            {extension && (
                <VStack spacing={20} style={{ padding: '24px' }}>
                    {/* Header */}
                    <HStack spacing={12} style={{ alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '48px' }}>
                            {extension.icon || '📦'}
                        </div>
                        <VStack spacing={8} style={{ alignItems: 'flex-start', flex: 1 }}>
                            <Text color="title" size="large" style={{ fontWeight: 700 }}>
                                {extension.title}
                            </Text>
                            <Text color="subtitle" size="medium">
                                by {extension.author}
                            </Text>
                            <Text color="subtitle" size="small">
                                Version {extension.version}
                            </Text>
                        </VStack>
                    </HStack>

                    {/* Description */}
                    <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
                        <Text color="title" size="medium" style={{ fontWeight: 600 }}>
                            Description
                        </Text>
                        <Text color="subtitle" size="medium" style={{ lineHeight: 1.5 }}>
                            {extension.description}
                        </Text>
                    </VStack>

                    {/* Tags */}
                    {extension.tags && extension.tags.length > 0 && (
                        <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
                            <Text color="title" size="medium" style={{ fontWeight: 600 }}>
                                Tags
                            </Text>
                            <HStack spacing={8} style={{ flexWrap: 'wrap' }}>
                                {extension.tags.map(tag => (
                                    <span
                                        key={tag}
                                        style={{
                                            padding: '4px 8px',
                                            backgroundColor: 'var(--color-bg-secondary)',
                                            borderRadius: 4,
                                            fontSize: '12px',
                                            color: 'var(--color-subtitle)'
                                        }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </HStack>
                        </VStack>
                    )}

                    {/* Actions */}
                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
                        {renderActionButton(extension)}
                    </div>
                </VStack>
            )}
        </Drawer>
    )
}
