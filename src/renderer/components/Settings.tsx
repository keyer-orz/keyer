import { useState } from 'react'
import './Settings.css'
import { Panel } from 'keyerext'
import GeneralTab from '../settings/GeneralTab'
import ExtensionsTab from '../settings/ExtensionsTab'
import ScriptsTab from '../settings/ScriptsTab'
import type { TabType } from '../settings/types'

function Settings() {
  const [activeTab, setActiveTab] = useState<TabType>('general')

  return (
    <Panel direction="horizontal">
      {/* 左侧：标签列表 */}
      <div className="settings-sidebar">
        <div
          className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <span className="tab-icon">⚙️</span>
          <span className="tab-label">General</span>
        </div>
        <div
          className={`settings-tab ${activeTab === 'extensions' ? 'active' : ''}`}
          onClick={() => setActiveTab('extensions')}
        >
          <span className="tab-icon">🧩</span>
          <span className="tab-label">Extensions</span>
        </div>
        <div
          className={`settings-tab ${activeTab === 'scripts' ? 'active' : ''}`}
          onClick={() => setActiveTab('scripts')}
        >
          <span className="tab-icon">📜</span>
          <span className="tab-label">Scripts</span>
        </div>
      </div>

      {/* 右侧：内容区域 */}
      <div className="settings-content">
        {activeTab === 'general' && <GeneralTab />}
        {activeTab === 'extensions' && <ExtensionsTab />}
        {activeTab === 'scripts' && <ScriptsTab />}
      </div>
    </Panel>
  )
}

export default Settings
