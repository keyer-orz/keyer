import { useState, useEffect, useRef } from 'react'
import { IAction } from '../../shared/types'
import { CommandManager } from '../../shared/CommandManager'
import { Input, InputHandle, List, Item, Panel, Text } from 'keyerext'
import type { ListItem } from 'keyerext'

interface MainViewProps {
  onExecute: (action: IAction) => Promise<void>
  onOpenSettings: () => void
  commandManagerReady: boolean
}

function MainView({ onExecute, onOpenSettings, commandManagerReady }: MainViewProps) {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<IAction[]>([])
  const [previewElements, setPreviewElements] = useState<Array<import('keyerext').ExtensionUIResult>>([])
  const [selectedAction, setSelectedAction] = useState<IAction | null>(null)

  const inputRef = useRef<InputHandle>(null)

  // 自动聚焦输入框
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // 搜索
  useEffect(() => {
    const searchCommands = async () => {
      if (!commandManagerReady) return

      try {
        const commandManager = CommandManager.getInstance()

        // 获取预览元素和搜索结果
        const [previewElems, searchActions] = await Promise.all([
          commandManager.getPreview(input),
          commandManager.search(input)
        ])

        setPreviewElements(previewElems)
        setResults(searchActions)
      } catch (error) {
        console.error('Search error:', error)
      }
    }

    const debounce = setTimeout(searchCommands, 150)
    return () => clearTimeout(debounce)
  }, [input, commandManagerReady])

  // List 选中回调
  const handleSelect = (item: ListItem<IAction>) => {
    setSelectedAction(item.data)
  }

  // List Enter 回调
  const handleEnter = (item: ListItem<IAction>) => {
    // 如果是 Settings，调用 onOpenSettings
    if (item.data.id === 'system:settings') {
      onOpenSettings()
      return
    }
    onExecute(item.data)
  }

  // 获取图标
  const getIcon = (action: IAction) => {
    if (action.typeLabel === 'System') {
      return '⚙️'
    } else if (action.typeLabel === 'Command') {
      return '⚡'
    }
    return '📦'
  }

  // 创建常驻的 Suggestions 列表
  const settingsAction: IAction = {
    id: 'system:settings',
    key: 'settings',
    name: 'Settings',
    desc: 'Open settings panel',
    typeLabel: 'System'
  }

  const suggestionItems: ListItem<IAction>[] = [
    {
      id: settingsAction.id,
      data: settingsAction
    }
  ]

  // 搜索结果列表
  const commandItems: ListItem<IAction>[] = results.map(action => ({
    id: action.id,
    data: action
  }))

  return (
    <Panel>
      <div className="search-container">
        <Input
          ref={inputRef}
          value={input}
          onChange={setInput}
          placeholder="Search for apps and commands..."
          autoFocus={true}
        />
      </div>

      <div className="results-container">
        {/* Render preview elements at the top */}
        {previewElements}

        {/* Commands 列表 */}
        {commandItems.length > 0 && (
          <div className="list-section">
            <div className="section-header">Commands</div>
            <List
              items={commandItems}
              onSelect={handleSelect}
              onEnter={handleEnter}
              autoHide={false}
              renderItem={(item) => {
                // 只渲染 commands
                if (!commandItems.find(ci => ci.id === item.id)) {
                  return null
                }
                return (
                  <Item>
                    <div className="result-icon">
                      {getIcon(item.data)}
                    </div>
                    <div className="result-content">
                      <div className="result-info">
                        <Text variant="title" ellipsis>{item.data.name}</Text>
                      </div>
                      <Text variant="label">{item.data.typeLabel || 'Extension'}</Text>
                    </div>
                  </Item>
                )
              }}
            />
          </div>
        )}

        {/* Suggestions 列表 */}
        <div className="list-section">
          <div className="section-header">Suggestions</div>
          <List
            items={suggestionItems}
            onSelect={handleSelect}
            onEnter={handleEnter}
            autoHide={false}
            renderItem={(item) => {
              // 只渲染 suggestions
              if (!suggestionItems.find(si => si.id === item.id)) {
                return null
              }
              return (
                <Item>
                  <div className="result-icon">
                    {getIcon(item.data)}
                  </div>
                  <div className="result-content">
                    <div className="result-info">
                      <Text variant="title" ellipsis>{item.data.name}</Text>
                    </div>
                    <Text variant="label">{item.data.typeLabel || 'Extension'}</Text>
                  </div>
                </Item>
              )
            }}
          />
        </div>
      </div>

      <div className="footer">
        <div className="footer-desc">
          {selectedAction?.desc || ''}
        </div>
        <div className="footer-settings" onClick={onOpenSettings}>
          ⚙️
        </div>
      </div>
    </Panel>
  )
}

export default MainView
