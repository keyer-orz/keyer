/**
 * Store Panel
 * 插件商店面板，显示可安装的插件
 */
import React, { useState, useEffect, useMemo } from 'react'
import type { StorePlugin } from './StoreManager'

interface StorePanelProps {
  storeManager: any
  onClose: () => void
}

export const StorePanel: React.FC<StorePanelProps> = ({ storeManager, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [plugins, setPlugins] = useState<StorePlugin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [installing, setInstalling] = useState<string | null>(null)

  // 加载插件数据
  useEffect(() => {
    loadPlugins()
  }, [])

  const loadPlugins = async () => {
    setLoading(true)
    setError(null)
    try {
      await storeManager.refresh()
      setPlugins(storeManager.getAllPlugins())
      setError(storeManager.getError())
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  // 搜索过滤
  const filteredPlugins = useMemo(() => {
    return storeManager.searchPlugins(searchQuery)
  }, [searchQuery, plugins])

  // 安装插件
  const handleInstall = async (plugin: StorePlugin) => {
    setInstalling(plugin.name)
    try {
      await storeManager.installPlugin(plugin)
      // 显示成功提示
      alert(`Plugin "${plugin.title}" installation started. Please restart the app after installation completes.`)
    } catch (err) {
      alert(`Failed to install plugin: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setInstalling(null)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Plugin Store</h2>
        <button onClick={onClose} style={styles.closeButton}>
          ✕
        </button>
      </div>

      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search plugins..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
          autoFocus
        />
      </div>

      <div style={styles.content}>
        {loading && (
          <div style={styles.message}>Loading plugins...</div>
        )}

        {error && (
          <div style={styles.error}>
            <p>Failed to load store data:</p>
            <p>{error}</p>
            <button onClick={loadPlugins} style={styles.retryButton}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filteredPlugins.length === 0 && (
          <div style={styles.message}>
            {searchQuery ? 'No plugins found matching your search.' : 'No plugins available.'}
          </div>
        )}

        {!loading && !error && filteredPlugins.length > 0 && (
          <div style={styles.pluginList}>
            {filteredPlugins.map((plugin: StorePlugin) => (
              <div key={plugin.name} style={styles.pluginCard}>
                <div style={styles.pluginIcon}>{plugin.icon || '📦'}</div>
                <div style={styles.pluginInfo}>
                  <h3 style={styles.pluginTitle}>{plugin.title}</h3>
                  <p style={styles.pluginDesc}>{plugin.desc || 'No description'}</p>
                  <div style={styles.pluginMeta}>
                    <span style={styles.pluginVersion}>v{plugin.version || '1.0.0'}</span>
                    <span style={styles.pluginName}>{plugin.name}</span>
                  </div>
                </div>
                <div style={styles.pluginActions}>
                  <button
                    onClick={() => handleInstall(plugin)}
                    disabled={installing === plugin.name}
                    style={{
                      ...styles.installButton,
                      ...(installing === plugin.name ? styles.installButtonDisabled : {})
                    }}
                  >
                    {installing === plugin.name ? 'Installing...' : 'Install'}
                  </button>
                  {plugin.repo && (
                    <a
                      href={plugin.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.repoLink}
                      onClick={(e) => {
                        e.preventDefault()
                        window.require('electron').shell.openExternal(plugin.repo)
                      }}
                    >
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1e1e1e',
    color: '#e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #333'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#e0e0e0',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px'
  },
  searchContainer: {
    padding: '16px 20px'
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '6px',
    color: '#e0e0e0',
    fontSize: '14px',
    outline: 'none'
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 20px 20px'
  },
  message: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#888'
  },
  error: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#ff6b6b'
  },
  retryButton: {
    marginTop: '16px',
    padding: '8px 16px',
    backgroundColor: '#007acc',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  pluginList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  pluginCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
    border: '1px solid #333'
  },
  pluginIcon: {
    fontSize: '32px',
    flexShrink: 0
  },
  pluginInfo: {
    flex: 1,
    minWidth: 0
  },
  pluginTitle: {
    margin: '0 0 6px 0',
    fontSize: '16px',
    fontWeight: 600
  },
  pluginDesc: {
    margin: '0 0 8px 0',
    fontSize: '13px',
    color: '#aaa',
    lineHeight: 1.4
  },
  pluginMeta: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px',
    color: '#666'
  },
  pluginVersion: {
    color: '#007acc'
  },
  pluginName: {
    fontFamily: 'monospace'
  },
  pluginActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'flex-end'
  },
  installButton: {
    padding: '8px 16px',
    backgroundColor: '#007acc',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    whiteSpace: 'nowrap'
  },
  installButtonDisabled: {
    backgroundColor: '#555',
    cursor: 'not-allowed'
  },
  repoLink: {
    fontSize: '12px',
    color: '#007acc',
    textDecoration: 'none'
  }
}
