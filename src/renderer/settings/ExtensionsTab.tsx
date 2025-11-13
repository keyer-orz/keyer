import { useState, useMemo, useEffect } from 'react'
import { Input } from 'keyerext'
import { CommandManager } from '../../shared/Commands'

interface CommandItem {
  id: string
  name: string
  desc?: string
  extensionId: string
  extensionTitle: string
  type: 'command'
}

interface ExtensionItem {
  id: string
  title: string
  description?: string
  version?: string
  type: 'extension'
  commands: CommandItem[]
  expanded: boolean
}

function ExtensionsTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [extensions, setExtensions] = useState<any[]>([])
  const [shortcuts, setShortcuts] = useState<Record<string, string>>({})
  const [enabledCommands, setEnabledCommands] = useState<Record<string, boolean>>({})
  const [expandedExtensions, setExpandedExtensions] = useState<Set<string>>(new Set())
  const [selectedItem, setSelectedItem] = useState<ExtensionItem | CommandItem | null>(null)

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      const { ipcRenderer } = window.require('electron')

      try {
        const commandManager = CommandManager.getInstance()
        const exts = commandManager.getExtensions()
        const savedShortcuts = await ipcRenderer.invoke('get-shortcuts') || {}
        const savedEnabled = await ipcRenderer.invoke('get-enabled-commands') || {}

        setExtensions(exts)
        setShortcuts(savedShortcuts)
        setEnabledCommands(savedEnabled)

        // 默认全部展开
        const allExtIds = exts.map((ext: any) => ext.id)
        setExpandedExtensions(new Set(allExtIds))
      } catch (error) {
        console.error('Failed to load extensions data:', error)
      }
    }
    loadData()
  }, [])

  // 保存快捷键
  const handleShortcutChange = async (commandId: string, shortcut: string) => {
    const newShortcuts = { ...shortcuts, [commandId]: shortcut }
    setShortcuts(newShortcuts)

    const { ipcRenderer } = window.require('electron')
    await ipcRenderer.invoke('save-shortcuts', newShortcuts)
  }

  // 切换启用状态
  const handleToggleEnabled = async (commandId: string, enabled: boolean) => {
    const newEnabled = { ...enabledCommands, [commandId]: enabled }
    setEnabledCommands(newEnabled)

    const { ipcRenderer } = window.require('electron')
    await ipcRenderer.invoke('save-enabled-commands', newEnabled)
  }

  // 构建扩展列表
  const allExtensions = useMemo((): ExtensionItem[] => {
    return extensions.map(ext => ({
      id: ext.id,
      title: ext.title || ext.id,
      description: ext.description,
      version: ext.version,
      type: 'extension' as const,
      commands: (ext.commands || []).map((cmd: any) => ({
        id: cmd.id,
        name: cmd.name,
        desc: cmd.desc,
        extensionId: ext.id,
        extensionTitle: ext.title || ext.id,
        type: 'command' as const
      })),
      expanded: expandedExtensions.has(ext.id)
    }))
  }, [extensions, expandedExtensions])

  // 搜索过滤
  const filteredItems = useMemo(() => {
    let items = allExtensions

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      items = items.map(ext => {
        const titleMatch = ext.title.toLowerCase().includes(query)
        const matchingCommands = ext.commands.filter(cmd =>
          cmd.name.toLowerCase().includes(query) ||
          cmd.desc?.toLowerCase().includes(query)
        )

        if (titleMatch || matchingCommands.length > 0) {
          return {
            ...ext,
            commands: titleMatch ? ext.commands : matchingCommands
          }
        }
        return null
      }).filter(Boolean) as ExtensionItem[]
    }

    return items
  }, [allExtensions, searchQuery])

  // 切换展开/收起
  const toggleExpand = (extId: string) => {
    const newExpanded = new Set(expandedExtensions)
    if (newExpanded.has(extId)) {
      newExpanded.delete(extId)
    } else {
      newExpanded.add(extId)
    }
    setExpandedExtensions(newExpanded)
  }

  return (
    <div className="extensions-tab-raycast">
      {/* 左侧：列表视图 */}
      <div className="extensions-list-panel">
        {/* 搜索框 */}
        <div className="extensions-search-box">
          <Input
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search..."
            autoFocus={false}
          />
        </div>

        {/* 表格头 */}
        <div className="extensions-table-header">
          <div className="col-name">Name</div>
          <div className="col-type">Type</div>
          <div className="col-hotkey">Hotkey</div>
          <div className="col-enabled">Enabled</div>
        </div>

        {/* 表格内容 */}
        <div className="extensions-table-body">
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              {searchQuery ? 'No matching items found' : 'No extensions found'}
            </div>
          ) : (
            filteredItems.map(ext => (
              <div key={ext.id}>
                {/* 扩展行 */}
                <div
                  className={`table-row extension-row ${selectedItem?.id === ext.id ? 'selected' : ''}`}
                  onClick={() => setSelectedItem(ext)}
                >
                  <div className="col-name">
                    <span
                      className="expand-arrow"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleExpand(ext.id)
                      }}
                    >
                      {ext.expanded ? '▼' : '▶'}
                    </span>
                    <span className="item-icon">🧩</span>
                    <span className="item-name">{ext.title}</span>
                  </div>
                  <div className="col-type">Extension</div>
                  <div className="col-hotkey">--</div>
                  <div className="col-enabled">
                    <input type="checkbox" defaultChecked />
                  </div>
                </div>

                {/* 命令行 */}
                {ext.expanded && ext.commands.map(cmd => (
                  <div
                    key={cmd.id}
                    className={`table-row command-row ${selectedItem?.id === cmd.id ? 'selected' : ''}`}
                    onClick={() => setSelectedItem(cmd)}
                  >
                    <div className="col-name">
                      <span className="indent"></span>
                      <span className="item-icon">⚡</span>
                      <span className="item-name">{cmd.name}</span>
                    </div>
                    <div className="col-type">Command</div>
                    <div className="col-hotkey">
                      <input
                        type="text"
                        className="hotkey-input"
                        placeholder="Record Hotkey"
                        value={shortcuts[cmd.id] || ''}
                        onChange={(e) => handleShortcutChange(cmd.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="col-enabled">
                      <input
                        type="checkbox"
                        checked={enabledCommands[cmd.id] !== false}
                        onChange={(e) => handleToggleEnabled(cmd.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 右侧：详情面板 */}
      <div className="extensions-detail-panel">
        {selectedItem ? (
          <div className="detail-content">
            <div className="detail-header">
              <span className="detail-icon">
                {selectedItem.type === 'extension' ? '🧩' : '⚡'}
              </span>
              <h2>{selectedItem.type === 'extension' ? selectedItem.title : selectedItem.name}</h2>
            </div>

            {selectedItem.type === 'extension' ? (
              <>
                <div className="detail-section">
                  <h3>Description</h3>
                  <p>{(selectedItem as ExtensionItem).description || 'No description available'}</p>
                </div>
                {(selectedItem as ExtensionItem).version && (
                  <div className="detail-section">
                    <h3>Version</h3>
                    <p>{(selectedItem as ExtensionItem).version}</p>
                  </div>
                )}
                <div className="detail-section">
                  <h3>Commands</h3>
                  <p>{(selectedItem as ExtensionItem).commands.length} command(s)</p>
                </div>
              </>
            ) : (
              <>
                <div className="detail-section">
                  <h3>Description</h3>
                  <p>{(selectedItem as CommandItem).desc || 'No description available'}</p>
                </div>
                <div className="detail-section">
                  <h3>Extension</h3>
                  <p>{(selectedItem as CommandItem).extensionTitle}</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="detail-empty">
            <p>Select an item to view details</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExtensionsTab
