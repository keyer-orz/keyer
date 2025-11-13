import { useState, useMemo, useEffect } from 'react'
import { Input } from 'keyerext'
import { CommandManager } from '../../shared/Commands'
import type { InstalledExtension, InstallMessage } from './types'

interface ExtensionWithMeta {
  id: string
  title: string
  description?: string
  version?: string
  isInstalled: boolean
  commands: any[]
}

function ExtensionsTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedExtensions, setExpandedExtensions] = useState<Set<string>>(new Set())
  const [extensions, setExtensions] = useState<any[]>([])
  const [installedExtensions, setInstalledExtensions] = useState<InstalledExtension[]>([])
  const [installMessage, setInstallMessage] = useState<InstallMessage | null>(null)

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      const { ipcRenderer } = window.require('electron')

      try {
        const commandManager = CommandManager.getInstance()
        const exts = commandManager.getExtensions()
        const installed = await ipcRenderer.invoke('list-installed-extensions')

        setExtensions(exts)
        setInstalledExtensions(installed || [])
      } catch (error) {
        console.error('Failed to load extensions data:', error)
      }
    }
    loadData()
  }, [])

  const handleInstall = async () => {
    const { ipcRenderer } = window.require('electron')

    try {
      const zipPath = await ipcRenderer.invoke('select-extension-file')

      if (!zipPath) {
        return
      }

      const result = await ipcRenderer.invoke('install-extension', zipPath)

      if (result.success) {
        setInstallMessage({
          type: 'success',
          text: `Extension "${result.extensionName}" installed successfully. Please restart the app to load it.`
        })

        const installed = await ipcRenderer.invoke('list-installed-extensions')
        setInstalledExtensions(installed || [])
      } else {
        setInstallMessage({
          type: 'error',
          text: `Installation failed: ${result.error}`
        })
      }

      setTimeout(() => setInstallMessage(null), 5000)
    } catch (error) {
      console.error('Failed to install extension:', error)
      setInstallMessage({
        type: 'error',
        text: `Installation failed: ${error}`
      })
      setTimeout(() => setInstallMessage(null), 5000)
    }
  }

  const handleUninstall = async (extensionName: string) => {
    const { ipcRenderer } = window.require('electron')

    if (!confirm(`Are you sure you want to uninstall "${extensionName}"?`)) {
      return
    }

    try {
      const result = await ipcRenderer.invoke('uninstall-extension', extensionName)

      if (result.success) {
        setInstallMessage({
          type: 'success',
          text: `Extension "${extensionName}" uninstalled successfully. Please restart the app.`
        })

        const installed = await ipcRenderer.invoke('list-installed-extensions')
        setInstalledExtensions(installed || [])
      } else {
        setInstallMessage({
          type: 'error',
          text: `Uninstall failed: ${result.error}`
        })
      }

      setTimeout(() => setInstallMessage(null), 5000)
    } catch (error) {
      console.error('Failed to uninstall extension:', error)
      setInstallMessage({
        type: 'error',
        text: `Uninstall failed: ${error}`
      })
      setTimeout(() => setInstallMessage(null), 5000)
    }
  }

  // 合并 extensions 和 installedExtensions 为统一列表
  const allExtensions = useMemo(() => {
    const extensionMap = new Map<string, ExtensionWithMeta>()

    // 添加已加载的扩展
    extensions.forEach(ext => {
      extensionMap.set(ext.id, {
        id: ext.id,
        title: ext.id,
        description: undefined,
        version: undefined,
        isInstalled: false,
        commands: ext.commands || []
      })
    })

    // 添加已安装的扩展信息（可能覆盖已加载的）
    installedExtensions.forEach(ext => {
      const existing = extensionMap.get(ext.pkg.id)
      extensionMap.set(ext.pkg.id, {
        id: ext.pkg.id,
        title: ext.pkg.title || ext.pkg.name,
        description: ext.pkg.description,
        version: ext.pkg.version,
        isInstalled: true,
        commands: existing?.commands || []
      })
    })

    return Array.from(extensionMap.values())
  }, [extensions, installedExtensions])

  // 按 command 过滤
  const filteredExtensions = useMemo(() => {
    if (!searchQuery) return allExtensions

    const query = searchQuery.toLowerCase()

    return allExtensions.filter(ext => {
      // 检查扩展标题
      if (ext.title.toLowerCase().includes(query)) return true

      // 检查命令名称和描述
      return ext.commands.some(cmd =>
        cmd.name?.toLowerCase().includes(query) ||
        cmd.desc?.toLowerCase().includes(query)
      )
    }).map(ext => {
      // 如果是通过命令搜索到的，只显示匹配的命令
      const matchingCommands = ext.commands.filter(cmd =>
        cmd.name?.toLowerCase().includes(query) ||
        cmd.desc?.toLowerCase().includes(query)
      )

      // 如果扩展标题匹配，显示所有命令；否则只显示匹配的命令
      const titleMatches = ext.title.toLowerCase().includes(query)

      return {
        ...ext,
        commands: titleMatches ? ext.commands : matchingCommands
      }
    })
  }, [allExtensions, searchQuery])

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
    <div className="extensions-tab-single">
      {/* 顶部操作栏 */}
      <div className="extensions-header">
        <div className="extensions-search-bar">
          <Input
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by command name..."
            autoFocus={false}
          />
        </div>
        <button className="install-button" onClick={handleInstall}>
          📦 Install from ZIP
        </button>
      </div>

      {/* 消息提示 */}
      {installMessage && (
        <div className={`install-message ${installMessage.type}`}>
          {installMessage.text}
        </div>
      )}

      {/* 扩展列表 */}
      <div className="extensions-list">
        {filteredExtensions.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? 'No matching commands found' : 'No extensions found'}
          </div>
        ) : (
          filteredExtensions.map(ext => (
            <div key={ext.id} className="extension-item-expandable">
              {/* 一级：扩展标题 */}
              <div
                className="extension-header-expandable"
                onClick={() => toggleExpand(ext.id)}
              >
                <div className="extension-header-left">
                  <span className="extension-arrow">
                    {expandedExtensions.has(ext.id) ? '▼' : '▶'}
                  </span>
                  <div className="extension-title-info">
                    <span className="extension-title-text">{ext.title}</span>
                    {ext.version && (
                      <span className="extension-version-badge">v{ext.version}</span>
                    )}
                  </div>
                </div>
                <div className="extension-header-right">
                  {ext.isInstalled && (
                    <span className="extension-installed-badge">Installed</span>
                  )}
                  <span className="extension-command-count">
                    {ext.commands.length} {ext.commands.length === 1 ? 'command' : 'commands'}
                  </span>
                </div>
              </div>

              {/* 二级：命令列表 */}
              {expandedExtensions.has(ext.id) && (
                <div className="extension-commands-list">
                  {ext.description && (
                    <div className="extension-description-inline">
                      {ext.description}
                    </div>
                  )}

                  {ext.commands.length > 0 ? (
                    ext.commands.map((cmd: any) => (
                      <div key={cmd.id} className="command-item-expandable">
                        <div className="command-main-info">
                          <div className="command-name">{cmd.name}</div>
                          {cmd.desc && (
                            <div className="command-desc">{cmd.desc}</div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-commands">No commands available</div>
                  )}

                  {ext.isInstalled && (
                    <div className="extension-actions-inline">
                      <button
                        className="uninstall-button-inline"
                        onClick={() => handleUninstall(ext.id)}
                      >
                        Uninstall
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ExtensionsTab
