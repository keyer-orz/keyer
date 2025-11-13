import { useState } from 'react'
import type { InstalledExtension, InstallMessage } from './types'

interface ExtensionsTabProps {
  extensions: any[]
  installedExtensions: InstalledExtension[]
  installMessage: InstallMessage | null
  onInstall: () => void
  onUninstall: (extensionName: string) => void
}

function ExtensionsTab({
  extensions,
  installedExtensions,
  installMessage,
  onInstall,
  onUninstall
}: ExtensionsTabProps) {
  const [expandedExt, setExpandedExt] = useState<string | null>(null)

  return (
    <div className="settings-section">
      {/* Install message */}
      {installMessage && (
        <div className={`install-message ${installMessage.type}`}>
          {installMessage.text}
        </div>
      )}

      {/* Install button */}
      <div className="extension-install-section">
        <button className="install-button" onClick={onInstall}>
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
                onClick={() => onUninstall(ext.name)}
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
  )
}

export default ExtensionsTab
