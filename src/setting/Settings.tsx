import { useState, useMemo } from 'react'
import { Panel, List, Item, type ListItem, type ListSection } from 'keyerext'
import GeneralTab from './GeneralTab'
import ExtensionsTab from './ExtensionsTab'
import ScriptsTab from './ScriptsTab'
import type { TabType } from './types'

interface TabData {
  id: TabType
  icon: string
  label: string
}

function Settings() {
  const [activeTab, setActiveTab] = useState<TabType>('general')

  // 构建标签列表
  const tabSections = useMemo((): ListSection<TabData>[] => {
    const tabs: Array<{ id: TabType; icon: string; label: string }> = [
      { id: 'general', icon: '⚙️', label: 'General' },
      { id: 'extensions', icon: '🧩', label: 'Extensions' },
      { id: 'scripts', icon: '📜', label: 'Scripts' }
    ]

    return [{
      header: '',
      items: tabs.map(tab => ({
        id: tab.id,
        data: tab
      }))
    }]
  }, [])

  // 渲染标签项
  const renderTabItem = (item: ListItem<TabData>) => {
    return (
      <Item style={{ padding: '10px 16px' }}>
        <div className="settings-tab-content">
          <span className="tab-icon">{item.data.icon}</span>
          <span className="tab-label">{item.data.label}</span>
        </div>
      </Item>
    )
  }

  // 处理标签选择（方向键移动时）
  const handleTabSelect = (item: ListItem<TabData>, _index: number) => {
    setActiveTab(item.data.id)
  }

  // 处理标签确认（Enter 键）
  const handleTabEnter = (item: ListItem<TabData>) => {
    setActiveTab(item.data.id)
  }

  return (
    <Panel direction="horizontal">
      {/* 左侧：标签列表 */}
      <div className="settings-sidebar">
        <List
          sections={tabSections}
          renderItem={renderTabItem}
          onSelect={handleTabSelect}
          onEnter={handleTabEnter}
        />
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
