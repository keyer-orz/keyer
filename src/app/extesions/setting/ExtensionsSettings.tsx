import { useState, useEffect } from 'react'
import { VStack, HStack, Text, Input, Image, Checkbox } from 'keyerext'
import { commandManager } from '@/app/managers/CommandManager'
import { configManager } from '@/app/utils/config'
import { ShortcutRecorder } from '@/app/components/ShortcutRecorder'
import { Extension } from '@/shared/extension'
import { VscDiffRemoved, VscDiffAdded } from "react-icons/vsc";
import { Keyer } from '@/app/keyer'
import { ExtensionProvider } from '@/app/contexts/ExtensionContext'

const contentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flex: 1,
}

export function ExtensionsSettings() {
  const [searchQuery, setSearchQuery] = useState('')
  const [extensions, setExtensions] = useState<Extension[]>([])
  const [expandedExtensions, setExpandedExtensions] = useState<Set<string>>(new Set())
  const [cmdShortcuts, setCmdShortcuts] = useState<Record<string, string>>({})
  const [cmdDisabled, setCmdDisabled] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const allExtensions = commandManager.getAllExtensions()
    setExtensions(allExtensions)
  }, [])

  // 禁用/启用命令
  const handleDisabledChange = async (cmdId: string, checked: boolean) => {
    setCmdDisabled(prev => ({ ...prev, [cmdId]: !checked }))
    configManager.setCmdConfig(cmdId, { disabled: !checked })
    await Keyer.shortcuts.updateCommand(cmdId, !checked ? undefined : cmdShortcuts[cmdId] || '')
  }

  const toggleExtension = (extName: string) => {
    const newExpanded = new Set(expandedExtensions)
    if (newExpanded.has(extName)) {
      newExpanded.delete(extName)
    } else {
      newExpanded.add(extName)
    }
    setExpandedExtensions(newExpanded)
  }

  const handleShortcutChange = async (cmdId: string, newShortcut: string) => {
    // 更新本地状态
    setCmdShortcuts(prev => ({
      ...prev,
      [cmdId]: newShortcut
    }))

    // 保存到配置
    configManager.setCmdConfig(cmdId, { shortcut: newShortcut })

    // 通知主进程更新快捷键注册
    const success = await Keyer.shortcuts.updateCommand(cmdId, newShortcut || undefined)

    if (!success) {
      console.error(`Failed to update shortcut for ${cmdId}`)
      // 可以在这里添加用户提示
    }
  }

  const filteredExtensions = extensions.filter(ext => {
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase()
    const nameMatch = ext.name.toLowerCase().includes(query)
    const titleMatch = ext.pkg.title?.toLowerCase().includes(query)
    const commandMatch = ext.commands.some(cmd =>
      cmd.title?.toLowerCase().includes(query) ||
      cmd.name?.toLowerCase().includes(query)
    )

    return nameMatch || titleMatch || commandMatch
  })

  return (
    <VStack spacing={24} style={{ padding: '24px', flex: 1, overflow: 'overlay' }}>
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
        <div style={{ flex: 2, alignItems: 'center' }}>Name</div>
        <div style={contentStyle}>Type</div>
        <div style={contentStyle}>Hotkey</div>
        <div style={contentStyle}>Enabled</div>
      </HStack>

      {/* Extension List */}
      <VStack spacing={0} style={{ alignItems: 'stretch', overflow: 'auto' }}>
        {filteredExtensions.map((ext) => (
          <VStack
            key={ext.name}
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
                backgroundColor: expandedExtensions.has(ext.name)
                  ? 'var(--color-bg-hover)'
                  : 'transparent',
                transition: 'background-color 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onClick={() => toggleExtension(ext.name)}
            >
              <div style={{ flex: 2, display: 'flex', alignItems: 'center' }}>
                {expandedExtensions.has(ext.name) ? <VscDiffRemoved /> : <VscDiffAdded />}
                <VStack spacing={2} style={{ alignItems: 'flex-start', marginLeft: 12 }}>
                  <Text color="title" size="small">{ext.pkg.title || ext.name}</Text>
                  <Text color="subtitle" size="small" style={{ fontSize: '12px' }}>
                    {ext.commands.length} command{ext.commands.length !== 1 ? 's' : ''}
                  </Text>
                </VStack>
              </div>
              <div style={contentStyle}>
                <Text color="subtitle" size="small">{ext.pkg.type}</Text>
              </div>
              <div style={contentStyle}>
                <Text color="subtitle" size="small">-</Text>
              </div>
              <div style={contentStyle}>
                <Text color="subtitle" size="small">-</Text>
              </div>
            </div>

            {/* Expanded Commands */}
            {expandedExtensions.has(ext.name) && (
              <VStack
                style={{
                  alignItems: 'stretch',
                  backgroundColor: 'var(--color-bg-secondary)',
                }}
              >
                {ext.commands.filter(cmd => cmd.title?.toLowerCase().includes(searchQuery)).map((cmd) => (
                  <div
                    key={cmd.id}
                    style={{
                      padding: '10px 12px',
                      borderTop: '1px solid var(--color-border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ExtensionProvider ctx={cmd.ctx!}>
                        <Image src={cmd.icon || ""} width={32} height={32} style={{ marginLeft: 20 }} />
                      </ExtensionProvider>
                      <VStack spacing={2} style={{ alignItems: 'flex-start' }}>
                        <Text color="title" size="small">{cmd.title || cmd.name}</Text>

                      </VStack>
                    </div>
                    <div style={contentStyle}>
                      <Text color="subtitle" size="small">{cmd.type}</Text>
                    </div>
                    <div style={contentStyle}>
                      <ShortcutRecorder
                        value={cmdShortcuts[cmd.id!] || ''}
                        onChange={(shortcut) => handleShortcutChange(cmd.id!, shortcut)}
                        placeholder="No shortcut"
                        disabled={!!cmdDisabled[cmd.id!]}
                      />
                    </div>
                    <div style={contentStyle}>
                      <Checkbox
                        checked={!cmdDisabled[cmd.id!]}
                        onChange={checked => handleDisabledChange(cmd.id!, checked)}
                      />
                    </div>
                  </div>
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

