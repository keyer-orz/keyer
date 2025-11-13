import { useState, useEffect } from 'react'
import './Settings.css'
import { CommandManager } from '../../shared/Commands'
import { Panel } from 'keyerext'

type TabType = 'general' | 'extensions' | 'scripts'

interface InstalledExtension {
  name: string
  pkg: {
    id: string
    name: string
    title?: string
    version: string
    description?: string
  }
}

function Settings() {
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [extensions, setExtensions] = useState<any[]>([])
  const [scripts, setScripts] = useState<any[]>([])
  const [expandedExt, setExpandedExt] = useState<string | null>(null)
  const [config, setConfig] = useState<any>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [installedExtensions, setInstalledExtensions] = useState<InstalledExtension[]>([])
  const [installMessage, setInstallMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const { ipcRenderer } = window.require('electron')

      try {
        const commandManager = CommandManager.getInstance()
        const exts = commandManager.getExtensions()
        const scrs = commandManager.getScripts()
        const cfg = await ipcRenderer.invoke('get-config')
        const installed = await ipcRenderer.invoke('list-installed-extensions')

        console.log('Loaded extensions:', exts)
        console.log('Loaded scripts:', scrs)
        console.log('Loaded config:', cfg)
        console.log('Installed extensions:', installed)

        setExtensions(exts)
        setScripts(scrs)
        setConfig(cfg)
        setInstalledExtensions(installed || [])

        if (cfg && cfg.theme) {
          setTheme(cfg.theme)
        }
      } catch (error) {
        console.error('Failed to load settings data:', error)
      }
    }
    loadData()
  }, [])

  const handleThemeChange = async (newTheme: 'dark' | 'light') => {
    setTheme(newTheme)
    const { ipcRenderer } = window.require('electron')
    await ipcRenderer.invoke('update-config', { theme: newTheme })
  }

  const handleInstallExtension = async () => {
    const { ipcRenderer } = window.require('electron')

    try {
      // Show file picker
      const zipPath = await ipcRenderer.invoke('select-extension-file')

      if (!zipPath) {
        return // User cancelled
      }

      // Install extension
      const result = await ipcRenderer.invoke('install-extension', zipPath)

      if (result.success) {
        setInstallMessage({
          type: 'success',
          text: `Extension "${result.extensionName}" installed successfully. Please restart the app to load it.`
        })

        // Reload installed extensions list
        const installed = await ipcRenderer.invoke('list-installed-extensions')
        setInstalledExtensions(installed || [])
      } else {
        setInstallMessage({
          type: 'error',
          text: `Installation failed: ${result.error}`
        })
      }

      // Clear message after 5 seconds
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

  const handleUninstallExtension = async (extensionName: string) => {
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

        // Reload installed extensions list
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

  return (
    <Panel>
      <div className="settings-header">
          <div className="settings-tabs">
            <div
              className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <span className="tab-icon">⚙️</span>
              General
            </div>
            <div
              className={`settings-tab ${activeTab === 'extensions' ? 'active' : ''}`}
              onClick={() => setActiveTab('extensions')}
            >
              <span className="tab-icon">🧩</span>
              Extensions
            </div>
            <div
              className={`settings-tab ${activeTab === 'scripts' ? 'active' : ''}`}
              onClick={() => setActiveTab('scripts')}
            >
              <span className="tab-icon">📜</span>
              Scripts
            </div>
          </div>
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <div className="setting-item">
                <div className="setting-label">主题</div>
                <div className="setting-control">
                  <select
                    className="setting-select"
                    value={theme}
                    onChange={(e) => handleThemeChange(e.target.value as 'dark' | 'light')}
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-label">全局快捷键</div>
                <div className="setting-control">
                  <input
                    type="text"
                    className="setting-input"
                    value={config?.globalShortcut || 'Shift+Space'}
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'extensions' && (
            <div className="settings-section">
              {/* Install message */}
              {installMessage && (
                <div className={`install-message ${installMessage.type}`}>
                  {installMessage.text}
                </div>
              )}

              {/* Install button */}
              <div className="extension-install-section">
                <button className="install-button" onClick={handleInstallExtension}>
                  📦 本地安装
                </button>
              </div>

              {/* Installed extensions list */}
              {installedExtensions.length > 0 && (
                <div className="installed-extensions">
                  <h3>已安装的插件</h3>
                  {installedExtensions.map(ext => (
                    <div key={ext.pkg.id} className="installed-extension-item">
                      <div className="installed-extension-info">
                        <div className="installed-extension-name">
                          {ext.pkg.title || ext.pkg.name}
                        </div>
                        <div className="installed-extension-version">
                          v{ext.pkg.version}
                        </div>
                        {ext.pkg.description && (
                          <div className="installed-extension-desc">
                            {ext.pkg.description}
                          </div>
                        )}
                      </div>
                      <button
                        className="uninstall-button"
                        onClick={() => handleUninstallExtension(ext.name)}
                      >
                        卸载
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Loaded extensions (from CommandManager) */}
              {extensions.length === 0 ? (
                <p>没有找到扩展。请在 extensions 目录中添加扩展。</p>
              ) : (
                extensions.map(ext => (
                  <div key={ext.id} className="extension-item">
                    <div className="extension-header" onClick={() => setExpandedExt(expandedExt === ext.id ? null : ext.id)}>
                      <div className="extension-title">
                        <span className="extension-arrow">{expandedExt === ext.id ? '▼' : '▶'}</span>
                        <span>{ext.id}</span>
                      </div>
                      <label className="checkbox-label">
                        <input type="checkbox" defaultChecked />
                        <span>启用</span>
                      </label>
                    </div>
                    {expandedExt === ext.id && ext.commands && ext.commands.length > 0 && (
                      <div className="commands-list">
                        {ext.commands.map((cmd: any) => (
                          <div key={cmd.id} className="command-item">
                            <div className="command-info">
                              <div className="command-name">{cmd.name}</div>
                              <div className="command-desc">{cmd.desc}</div>
                            </div>
                            <input
                              type="text"
                              className="command-shortcut"
                              placeholder="快捷键"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'scripts' && (
            <div className="settings-section">
              {scripts.length === 0 ? (
                <p>没有找到脚本。请在 scripts 目录中添加脚本文件。</p>
              ) : (
                scripts.map(script => (
                  <div key={script.id} className="script-item">
                    <div className="script-info">
                      <div className="script-name">{script.name}</div>
                      <div className="script-desc">{script.desc}</div>
                    </div>
                    <div className="script-controls">
                      <input
                        type="text"
                        className="command-shortcut"
                        placeholder="快捷键"
                      />
                      <label className="checkbox-label">
                        <input type="checkbox" defaultChecked />
                        <span>启用</span>
                      </label>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
    </Panel>
  )
}

export default Settings
