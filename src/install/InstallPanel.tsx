import { useState } from 'react'
import { Panel } from 'keyerext'
declare const React: any

interface PluginInfo {
    type: 'extension' | 'script'
    icon: string
    name: string
    title: string
    desc: string
    path: string
}

function InstallPanel() {
    const [selectedPath, setSelectedPath] = useState<string | null>(null)
    const [pluginInfo, setPluginInfo] = useState<PluginInfo | null>(null)
    const [isDetecting, setIsDetecting] = useState(false)
    const [isInstalling, setIsInstalling] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // 获取 Keyer API
    const keyer = (window as any).__keyer__

    // 处理选择目录
    const handleSelectDirectory = async () => {
        try {
            setError(null)
            const dir = await keyer.selectPluginDirectory()
            if (dir) {
                setSelectedPath(dir)

                // 自动检测插件
                setIsDetecting(true)
                try {
                    const info = await keyer.detectPlugin(dir)
                    if (info) {
                        setPluginInfo(info)
                    } else {
                        setError('No valid plugin found in the selected directory')
                        setPluginInfo(null)
                    }
                } catch (err: any) {
                    setError(`Failed to detect plugin: ${err.message}`)
                    setPluginInfo(null)
                } finally {
                    setIsDetecting(false)
                }
            }
        } catch (err: any) {
            setError(`Failed to select directory: ${err.message}`)
        }
    }

    // 处理安装插件
    const handleInstall = async () => {
        if (!pluginInfo) {
            return
        }

        setIsInstalling(true)
        setError(null)

        try {
            const result = await keyer.installPlugin(pluginInfo.path, pluginInfo.type)

            if (result.success) {
                setSuccess(true)

                // 显示成功提示
                await keyer.showToast(`Plugin installed successfully!`, 3000)

                // 重置表单
                setTimeout(() => {
                    setSelectedPath(null)
                    setPluginInfo(null)
                    setSuccess(false)
                }, 2000)
            }
        } catch (err: any) {
            setError(err.message || 'Failed to install plugin')
        } finally {
            setIsInstalling(false)
        }
    }

    return (
        <Panel>
            <div className="create-plugin-container">
                <div className="create-plugin-header">
                    <h2>📦 Install Plugin</h2>
                    <p className="subtitle">Install an existing plugin from a folder</p>
                </div>

                <div className="create-plugin-content">
                    {/* Directory Selection */}
                    <div className="form-group">
                        <label className="form-label">Plugin Location</label>
                        <div className="location-selector">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleSelectDirectory}
                                disabled={isDetecting || isInstalling}
                            >
                                📁 Select Plugin Folder
                            </button>
                            {selectedPath && (
                                <span className="selected-path">{selectedPath}</span>
                            )}
                        </div>
                    </div>

                    {/* Detecting Indicator */}
                    {isDetecting && (
                        <div className="message message-info">
                            🔍 Detecting plugin...
                        </div>
                    )}

                    {/* Plugin Info Display */}
                    {pluginInfo && !isDetecting && (
                        <div className="plugin-info-card">
                            <div className="plugin-info-header">
                                <span className="plugin-icon">{pluginInfo.icon}</span>
                                <div className="plugin-details">
                                    <h3>{pluginInfo.title}</h3>
                                    <p className="plugin-name">{pluginInfo.name}</p>
                                </div>
                                <span className="plugin-type-badge">
                                    {pluginInfo.type === 'extension' ? '🧩 Extension' : '📜 Script'}
                                </span>
                            </div>
                            <p className="plugin-desc">{pluginInfo.desc}</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="message message-error">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="message message-success">
                            ✅ Plugin installed successfully!
                        </div>
                    )}

                    {/* Install Button */}
                    {pluginInfo && !isDetecting && (
                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleInstall}
                                disabled={isInstalling}
                            >
                                {isInstalling ? 'Installing...' : '📦 Install Plugin'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Panel>
    )
}

export default InstallPanel
