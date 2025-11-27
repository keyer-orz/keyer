import { useState, useEffect } from 'react'
import { VStack, HStack, Text, Divider, Input } from 'keyerext'
import { commandManager } from '../../../managers/CommandManager'
import { ExtensionMeta, ICommand } from 'keyerext'

interface ExtensionItem {
  meta: ExtensionMeta
  commands: ICommand[]
}

export function ExtensionsSettings() {
  const [searchQuery, setSearchQuery] = useState('')
  const [extensions, setExtensions] = useState<ExtensionItem[]>([])
  const [expandedExtensions, setExpandedExtensions] = useState<Set<string>>(new Set())

  useEffect(() => {
    // 从 commandManager 获取所有命令
    const allCommands = commandManager.getAllCommands()

    // 按扩展分组
    const extensionMap = new Map<string, ExtensionItem>()

    allCommands.forEach(cmd => {
      if (!cmd.id) return

      const [extName] = cmd.id.split('#')

      if (!extensionMap.has(extName)) {
        extensionMap.set(extName, {
          meta: {
            name: extName,
            title: cmd.extTitle || extName,
            type: 'local',
            main: '',
            version: '1.0.0'
          },
          commands: []
        })
      }

      extensionMap.get(extName)!.commands.push(cmd)
    })

    setExtensions(Array.from(extensionMap.values()))
  }, [])

  const toggleExtension = (extName: string) => {
    const newExpanded = new Set(expandedExtensions)
    if (newExpanded.has(extName)) {
      newExpanded.delete(extName)
    } else {
      newExpanded.add(extName)
    }
    setExpandedExtensions(newExpanded)
  }

  const filteredExtensions = extensions.filter(ext => {
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase()
    const nameMatch = ext.meta.name.toLowerCase().includes(query)
    const titleMatch = ext.meta.title?.toLowerCase().includes(query)
    const commandMatch = ext.commands.some(cmd =>
      cmd.title?.toLowerCase().includes(query) ||
      cmd.name?.toLowerCase().includes(query)
    )

    return nameMatch || titleMatch || commandMatch
  })

  return (
    <VStack spacing={24} style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
      {/* Search Bar */}
      <Input
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e)}
      />

      {/* Extension List Header */}
      <HStack
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--color-border)',
          fontWeight: 500,
          fontSize: '13px',
          color: 'var(--color-text-secondary)'
        }}
      >
        <div style={{ flex: 2 }}>Name</div>
        <div style={{ flex: 1 }}>Type</div>
        <div style={{ flex: 1 }}>Hotkey</div>
        <div style={{ width: '80px', textAlign: 'center' }}>Enabled</div>
      </HStack>

      {/* Extension List */}
      <VStack spacing={0} style={{ alignItems: 'stretch', overflow: 'auto' }}>
        {filteredExtensions.map((ext) => (
          <VStack
            key={ext.meta.name}
            spacing={0}
            style={{
              alignItems: 'stretch',
              borderBottom: '1px solid var(--color-border)'
            }}
          >
            {/* Extension Row */}
            <div
              style={{
                padding: '12px',
                cursor: 'pointer',
                backgroundColor: expandedExtensions.has(ext.meta.name)
                  ? 'var(--color-bg-hover)'
                  : 'transparent',
                transition: 'background-color 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onClick={() => toggleExtension(ext.meta.name)}
            >
              <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '12px',
                  transition: 'transform 0.2s',
                  transform: expandedExtensions.has(ext.meta.name) ? 'rotate(90deg)' : 'rotate(0deg)'
                }}>
                  ▶
                </span>
                <VStack spacing={2} style={{ alignItems: 'flex-start' }}>
                  <Text color="title" size="small">{ext.meta.title || ext.meta.name}</Text>
                  <Text color="subtitle" size="small" style={{ fontSize: '12px' }}>
                    {ext.commands.length} command{ext.commands.length !== 1 ? 's' : ''}
                  </Text>
                </VStack>
              </div>
              <div style={{ flex: 1 }}>
                <Text color="subtitle" size="small">{ext.meta.type}</Text>
              </div>
              <div style={{ flex: 1 }}>
                <Text color="subtitle" size="small">-</Text>
              </div>
              <div style={{ width: '80px', textAlign: 'center' }}>
                <Text color="subtitle" size="small">-</Text>
              </div>
            </div>

            {/* Expanded Commands */}
            {expandedExtensions.has(ext.meta.name) && (
              <VStack
                spacing={0}
                style={{
                  alignItems: 'stretch',
                  backgroundColor: 'var(--color-bg-secondary)',
                  paddingLeft: '40px'
                }}
              >
                {ext.commands.map((cmd) => (
                  <HStack
                    key={cmd.id}
                    style={{
                      padding: '10px 12px',
                      borderTop: '1px solid var(--color-border-subtle)'
                    }}
                  >
                    <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px' }}>{cmd.icon || '📦'}</span>
                      <VStack spacing={2} style={{ alignItems: 'flex-start' }}>
                        <Text color="title" size="small">{cmd.title || cmd.name}</Text>
                      </VStack>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text color="subtitle" size="small">{cmd.type}</Text>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text color="subtitle" size="small">-</Text>
                    </div>
                    <div style={{ width: '80px' }}>
                      {/* Placeholder for future functionality */}
                    </div>
                  </HStack>
                ))}
              </VStack>
            )}
          </VStack>
        ))}
      </VStack>

      {filteredExtensions.length === 0 && (
        <VStack spacing={8} style={{ padding: '40px', alignItems: 'center' }}>
          <Text color="subtitle" size="medium">No extensions found</Text>
          {searchQuery && (
            <Text color="subtitle" size="small">Try a different search query</Text>
          )}
        </VStack>
      )}
    </VStack>
  )
}
