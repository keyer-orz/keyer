import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { IAction } from '../../shared/types'
import { CommandManager } from '../../shared/Commands'
import { Input, InputHandle, List, Item, Panel, Text } from 'keyerext'
import type { ListItem, ListSection } from 'keyerext'

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
  const handleSelect = useCallback((item: ListItem<IAction>) => {
    setSelectedAction(item.data)
  }, [])

  // List Enter 回调
  const handleEnter = useCallback((item: ListItem<IAction>) => {
    // 如果是 Settings，调用 onOpenSettings
    if (item.data.id === 'system:settings') {
      onOpenSettings()
      return
    }
    onExecute(item.data)
  }, [onOpenSettings, onExecute])

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
  const settingsAction: IAction = useMemo(() => ({
    id: 'system:settings',
    key: 'settings',
    name: 'Settings',
    desc: 'Open settings panel',
    typeLabel: 'System'
  }), [])

  // 构建 Section 列表
  const sections = useMemo(() => {
    const sections: ListSection<IAction>[] = []

    // 添加 Commands 部分
    if (results.length > 0) {
      sections.push({
        header: 'Commands',
        items: results.map(action => ({ id: action.id, data: action }))
      })
    }

    // 添加 Suggestions 部分
    sections.push({
      header: 'Suggestions',
      items: [{ id: settingsAction.id, data: settingsAction }]
    })

    return sections
  }, [results, settingsAction])

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

        {/* 统一的列表 */}
        <List
          sections={sections}
          onSelect={handleSelect}
          onEnter={handleEnter}
          autoHide={false}
          initialSelectedIndex={0}
          renderItem={(item) => {
            const action = item.data
            return (
              <Item>
                <div className="result-icon">
                  {getIcon(action)}
                </div>
                <div className="result-content">
                  <div className="result-info">
                    <Text variant="title" ellipsis>{action.name}</Text>
                  </div>
                  <Text variant="label">{action.typeLabel || 'Extension'}</Text>
                </div>
              </Item>
            )
          }}
        />
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
