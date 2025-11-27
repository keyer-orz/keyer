import { useState, useEffect } from 'react'
import { VStack, HStack, Text, Input, useEscapeHandler } from 'keyerext'

interface StoreExtension {
  name: string
  title: string
  description: string
  version: string
  author: string
  icon?: string
  tags?: string[]
  downloadUrl?: string
}

interface ExtensionStatus {
  isInstalled: boolean
  canUpgrade: boolean
  installedVersion?: string
}

export function StoreUI() {
  const [searchQuery, setSearchQuery] = useState('')
  const [extensions, setExtensions] = useState<StoreExtension[]>([])
  const [selectedExtension, setSelectedExtension] = useState<StoreExtension | null>(null)
  const [extensionStatus, setExtensionStatus] = useState<Record<string, ExtensionStatus>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEscapeHandler(() => {
    if (selectedExtension) {
      setSelectedExtension(null)
      return true
    }
    return false
  })

  // 加载插件商店数据
  useEffect(() => {
    fetchStoreData()
  }, [])

  const fetchStoreData = async () => {
    try {
      setLoading(true)
      
      // 开发环境使用本地测试数据，生产环境使用远程 API
      const isDev = process.env.NODE_ENV === 'development'
      const url = isDev 
        ? '/store-demo.json'
        : 'https://keyer-orz.github.io/store/app.json'
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setExtensions(data.extensions || [])
      
      // 检查已安装插件状态
      const status: Record<string, ExtensionStatus> = {}
      for (const ext of data.extensions || []) {
        status[ext.name] = checkExtensionStatus(ext)
      }
      setExtensionStatus(status)
    } catch (err) {
      console.error('Failed to fetch store data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load store data')
    } finally {
      setLoading(false)
    }
  }

  const checkExtensionStatus = (_extension: StoreExtension): ExtensionStatus => {
    // TODO: 实现检查本地已安装插件的逻辑
    // 这里需要与 CommandManager 或 ExtensionLoader 集成
    return {
      isInstalled: false,
      canUpgrade: false
    }
  }

  const handleInstall = async (extension: StoreExtension) => {
    console.log('Installing:', extension.name)
    // TODO: 实现安装逻辑
  }

  const handleUpgrade = async (extension: StoreExtension) => {
    console.log('Upgrading:', extension.name)
    // TODO: 实现升级逻辑
  }

  const handleUninstall = async (extension: StoreExtension) => {
    console.log('Uninstalling:', extension.name)
    // TODO: 实现卸载逻辑
  }

  const filteredExtensions = extensions.filter(ext => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return ext.name.toLowerCase().includes(query) ||
           ext.title.toLowerCase().includes(query) ||
           ext.description.toLowerCase().includes(query) ||
           ext.tags?.some(tag => tag.toLowerCase().includes(query))
  })

  const renderActionButton = (extension: StoreExtension) => {
    const status = extensionStatus[extension.name]
    if (!status) return null

    if (status.isInstalled) {
      if (status.canUpgrade) {
        return (
          <HStack spacing={8}>
            <button 
              onClick={() => handleUpgrade(extension)}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Upgrade
            </button>
            <button 
              onClick={() => handleUninstall(extension)}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--color-danger, #ff4444)',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Uninstall
            </button>
          </HStack>
        )
      } else {
        return (
          <button 
            onClick={() => handleUninstall(extension)}
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--color-danger, #ff4444)',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Uninstall
          </button>
        )
      }
    } else {
      return (
        <button 
          onClick={() => handleInstall(extension)}
          style={{
            padding: '6px 12px',
            backgroundColor: 'var(--color-accent)',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Install
        </button>
      )
    }
  }

  if (loading) {
    return (
      <VStack spacing={20} style={{ padding: '40px', alignItems: 'center' }}>
        <Text color="title" size="medium">Loading Extensions Store...</Text>
      </VStack>
    )
  }

  if (error) {
    return (
      <VStack spacing={20} style={{ padding: '40px', alignItems: 'center' }}>
        <Text color="title" size="medium">Failed to load store</Text>
        <Text color="subtitle" size="small">{error}</Text>
        <button onClick={fetchStoreData} style={{
          padding: '8px 16px',
          backgroundColor: 'var(--color-accent)',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer'
        }}>
          Retry
        </button>
      </VStack>
    )
  }

  return (
    <HStack spacing={0} style={{ width: '100%', height: '100%' }}>
      {/* Left Panel - Extension List */}
      <VStack 
        spacing={16} 
        style={{ 
          flex: selectedExtension ? 1 : 2, 
          padding: '24px',
          borderRight: selectedExtension ? '1px solid var(--color-border)' : 'none',
          maxHeight: '100%',
          overflow: 'hidden'
        }}
      >
        {/* Search */}
        <Input
          placeholder="Search extensions..."
          value={searchQuery}
          onChange={setSearchQuery}
        />

        {/* Extension List */}
        <VStack 
          spacing={0} 
          style={{ 
            alignItems: 'stretch', 
            flex: 1, 
            overflowY: 'auto',
            paddingRight: 8
          }}
        >
          {filteredExtensions.map((ext) => (
            <div
              key={ext.name}
              onClick={() => setSelectedExtension(ext)}
              style={{
                padding: '16px',
                borderBottom: '1px solid var(--color-border)',
                cursor: 'pointer',
                backgroundColor: selectedExtension?.name === ext.name 
                  ? 'var(--color-bg-hover)' 
                  : 'transparent',
                transition: 'background-color 0.15s'
              }}
            >
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
            </div>
          ))}

          {filteredExtensions.length === 0 && (
            <VStack spacing={8} style={{ padding: '40px', alignItems: 'center' }}>
              <Text color="subtitle" size="medium">No extensions found</Text>
              {searchQuery && (
                <Text color="subtitle" size="small">Try a different search query</Text>
              )}
            </VStack>
          )}
        </VStack>
      </VStack>

      {/* Right Panel - Extension Details */}
      {selectedExtension && (
        <VStack 
          spacing={20} 
          style={{ 
            flex: 1, 
            padding: '24px',
            maxHeight: '100%',
            overflow: 'auto'
          }}
        >
          {/* Header */}
          <HStack spacing={12} style={{ alignItems: 'flex-start' }}>
            <div style={{ fontSize: '48px' }}>
              {selectedExtension.icon || '📦'}
            </div>
            <VStack spacing={8} style={{ alignItems: 'flex-start', flex: 1 }}>
              <Text color="title" size="large" style={{ fontWeight: 700 }}>
                {selectedExtension.title}
              </Text>
              <Text color="subtitle" size="medium">
                by {selectedExtension.author}
              </Text>
              <Text color="subtitle" size="small">
                Version {selectedExtension.version}
              </Text>
            </VStack>
            <button
              onClick={() => setSelectedExtension(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: 'var(--color-subtitle)'
              }}
            >
              ✕
            </button>
          </HStack>

          {/* Description */}
          <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
            <Text color="title" size="medium" style={{ fontWeight: 600 }}>
              Description
            </Text>
            <Text color="subtitle" size="medium" style={{ lineHeight: 1.5 }}>
              {selectedExtension.description}
            </Text>
          </VStack>

          {/* Tags */}
          {selectedExtension.tags && selectedExtension.tags.length > 0 && (
            <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
              <Text color="title" size="medium" style={{ fontWeight: 600 }}>
                Tags
              </Text>
              <HStack spacing={8} style={{ flexWrap: 'wrap' }}>
                {selectedExtension.tags.map(tag => (
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
          <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
            {renderActionButton(selectedExtension)}
          </div>
        </VStack>
      )}
    </HStack>
  )
}