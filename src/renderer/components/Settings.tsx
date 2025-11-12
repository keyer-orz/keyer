import { useState, useEffect } from 'react'
import './Settings.css'
import { CommandManager } from '../../shared/CommandManager'

interface SettingsProps {
  onClose: () => void
}

type TabType = 'general' | 'extensions' | 'scripts'

function Settings({ onClose }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [extensions, setExtensions] = useState<any[]>([])
  const [scripts, setScripts] = useState<any[]>([])
  const [expandedExt, setExpandedExt] = useState<string | null>(null)
  const [config, setConfig] = useState<any>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const loadData = async () => {
      const { ipcRenderer } = window.require('electron')

      try {
        const commandManager = CommandManager.getInstance()
        const exts = commandManager.getExtensions()
        const scrs = commandManager.getScripts()
        const cfg = await ipcRenderer.invoke('get-config')

        console.log('Loaded extensions:', exts)
        console.log('Loaded scripts:', scrs)
        console.log('Loaded config:', cfg)

        setExtensions(exts)
        setScripts(scrs)
        setConfig(cfg)

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
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
          <div className="settings-close" onClick={onClose}>
            ✕
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
      </div>
    </div>
  )
}

export default Settings
