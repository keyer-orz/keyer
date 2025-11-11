import React, { useEffect } from 'react'
import './Panel.css'
import { uiExtensionLoader } from '../core/UIExtensionLoader'

// 可序列化的 Panel 配置
interface SerializablePanelConfig {
  title: string
  component: string
  extensionId: string
  props?: Record<string, any>
}

interface PanelProps {
  config: SerializablePanelConfig
  onClose: () => void
}

function Panel({ config, onClose }: PanelProps) {
  // 监听 Esc 键关闭面板
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // 获取并渲染组件
  const Component = uiExtensionLoader.getComponent(config.extensionId, config.component)

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">{config.title}</div>
        <div className="panel-close" onClick={onClose}>✕</div>
      </div>

      <div className="panel-content">
        {Component ? (
          <Component {...(config.props || {})} />
        ) : (
          <div className="panel-error">
            组件未找到: {config.component}
            <p>Extension ID: {config.extensionId}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Panel
