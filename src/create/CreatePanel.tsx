import { useState } from 'react'
import { Panel } from 'keyerext'
declare const React: any

interface PluginMetadata {
    icon: string
    name: string
    title: string
    desc: string
}

function CreatePanel() {
    const [pluginType, setPluginType] = useState<'script' | 'extension'>('extension')
    const [metadata, setMetadata] = useState<PluginMetadata>({
        icon: '🎨',
        name: '',
        title: '',
        desc: ''
    })
    const [selectedDir, setSelectedDir] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // 获取 Keyer API
    const keyer = (window as any).__keyer__

    // 处理选择目录
    const handleSelectDirectory = async () => {
        try {
            const dir = await keyer.selectDirectory()
            if (dir) {
                setSelectedDir(dir)
                setError(null)
            }
        } catch (err: any) {
            setError(`Failed to select directory: ${err.message}`)
        }
    }

    // 处理创建插件
    const handleCreate = async () => {
        // 验证表单
        if (!metadata.name.trim()) {
            setError('Plugin name is required')
            return
        }
        if (!metadata.title.trim()) {
            setError('Plugin title is required')
            return
        }
        if (!metadata.desc.trim()) {
            setError('Plugin description is required')
            return
        }
        if (!selectedDir) {
            setError('Please select a location for the plugin')
            return
        }

        // 验证 name 格式（只允许小写字母、数字和连字符）
        if (!/^[a-z0-9-]+$/.test(metadata.name)) {
            setError('Plugin name must contain only lowercase letters, numbers, and hyphens')
            return
        }

        setIsCreating(true)
        setError(null)

        try {
            const result = await keyer.generatePlugin(pluginType, metadata, selectedDir)

            if (result.success && result.path) {
                setSuccess(true)

                // 显示成功提示
                await keyer.showToast(`Plugin created successfully!`, 3000)

                // 打开 Finder
                await keyer.openFinder(result.path)

                // 重置表单
                setTimeout(() => {
                    setMetadata({
                        icon: '🎨',
                        name: '',
                        title: '',
                        desc: ''
                    })
                    setSelectedDir(null)
                    setSuccess(false)
                }, 2000)
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create plugin')
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <Panel>
            <div className="create-plugin-container">
                <div className="create-plugin-header">
                    <h2>✨ Create Plugin</h2>
                    <p className="subtitle">Create a new script or extension plugin</p>
                </div>

                <div className="create-plugin-content">
                    {/* Plugin Type Selection */}
                    <div className="form-group">
                        <label className="form-label">Plugin Type</label>
                        <div className="radio-group">
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="pluginType"
                                    value="extension"
                                    checked={pluginType === 'extension'}
                                    onChange={(e) => setPluginType(e.target.value as 'extension')}
                                />
                                <span className="radio-text">
                                    <span className="radio-icon">🧩</span>
                                    <span>Extension</span>
                                    <span className="radio-desc">Full-featured plugin with UI</span>
                                </span>
                            </label>
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="pluginType"
                                    value="script"
                                    checked={pluginType === 'script'}
                                    onChange={(e) => setPluginType(e.target.value as 'script')}
                                />
                                <span className="radio-text">
                                    <span className="radio-icon">📜</span>
                                    <span>Script</span>
                                    <span className="radio-desc">Simple shell script</span>
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Icon */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="plugin-icon">
                            Icon (Emoji)
                        </label>
                        <input
                            id="plugin-icon"
                            type="text"
                            className="form-input icon-input"
                            value={metadata.icon}
                            onChange={(e) => setMetadata({ ...metadata, icon: e.target.value })}
                            placeholder="🎨"
                            maxLength={2}
                        />
                    </div>

                    {/* Name */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="plugin-name">
                            Name *
                        </label>
                        <input
                            id="plugin-name"
                            type="text"
                            className="form-input"
                            value={metadata.name}
                            onChange={(e) => setMetadata({ ...metadata, name: e.target.value.toLowerCase() })}
                            placeholder="my-awesome-plugin"
                        />
                        <span className="form-hint">Lowercase letters, numbers, and hyphens only</span>
                    </div>

                    {/* Title */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="plugin-title">
                            Title *
                        </label>
                        <input
                            id="plugin-title"
                            type="text"
                            className="form-input"
                            value={metadata.title}
                            onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                            placeholder="My Awesome Plugin"
                        />
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="plugin-desc">
                            Description *
                        </label>
                        <textarea
                            id="plugin-desc"
                            className="form-textarea"
                            value={metadata.desc}
                            onChange={(e) => setMetadata({ ...metadata, desc: e.target.value })}
                            placeholder="A brief description of what your plugin does"
                            rows={3}
                        />
                    </div>

                    {/* Location Selection */}
                    <div className="form-group">
                        <label className="form-label">Save Location</label>
                        <div className="location-selector">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleSelectDirectory}
                                disabled={isCreating}
                            >
                                📁 Choose Location
                            </button>
                            {selectedDir && (
                                <span className="selected-path">{selectedDir}</span>
                            )}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="message message-error">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="message message-success">
                            ✅ Plugin created successfully!
                        </div>
                    )}

                    {/* Create Button */}
                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleCreate}
                            disabled={isCreating || !metadata.name || !metadata.title || !metadata.desc || !selectedDir}
                        >
                            {isCreating ? 'Creating...' : '✨ Create Plugin'}
                        </button>
                    </div>
                </div>
            </div>
        </Panel>
    )
}

export default CreatePanel
