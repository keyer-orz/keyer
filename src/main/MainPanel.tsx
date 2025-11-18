import { useState, useEffect, useCallback, useImperativeHandle, forwardRef, useRef } from 'react'
import { ICommand } from 'keyerext'
import { CommandManager } from '@/managers/CommandManager'
import { Input, List, Item, Panel, Text, ExtensionResult } from 'keyerext'
import type { ListItem, ListSection, InputHandle } from 'keyerext'
import { useNavigation } from '@/utils/NavigationContext'
import { executeCommand } from '@/utils/CommandExecutor'
import React from 'react'
export interface MainPanelHandle {
  isEmpty: () => boolean
  isFocused: () => boolean
  focus: () => void
  clear: () => void
}

const MainPanel = forwardRef<MainPanelHandle>((_props, ref) => {
  const [input, setInput] = useState('')
  const [sections, setSections] = useState<ListSection<ICommand>[]>([])
  const [previewElements, setPreviewElements] = useState<Array<ExtensionResult>>([])
  const [selectedCommand, setSelectedCommand] = useState<ICommand | null>(null)

  const inputRef = useRef<InputHandle>(null)
  const { navigateTo } = useNavigation()

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    isEmpty: () => inputRef.current?.isEmpty() ?? true,
    isFocused: () => inputRef.current?.isFocused() ?? false,
    focus: () => {
      inputRef.current?.focus()
    },
    clear: () => {
      inputRef.current?.clear()
    }
  }), [])

  // 搜索
  useEffect(() => {
    const searchCommands = async () => {
      if (!CommandManager.isReady()) return

      try {
        const commandManager = CommandManager.getInstance()

        // 获取预览元素和搜索结果（sections）
        const [previewElems, searchSections] = await Promise.all([
          commandManager.getPreview(input),
          commandManager.search(input)
        ])

        setPreviewElements(previewElems)
        setSections(searchSections)
      } catch (error) {
        console.error('Search error:', error)
      }
    }

    const debounce = setTimeout(searchCommands, 150)
    return () => clearTimeout(debounce)
  }, [input])

  // 执行命令 - 调用全局命令执行器
  const handleExecute = useCallback(async (command: ICommand) => {
    await executeCommand(command.ucid, { navigateTo })
  }, [navigateTo])

  // List 选中回调
  const handleSelect = useCallback((item: ListItem<ICommand>, _index: number) => {
    setSelectedCommand(item.data)
  }, [])

  // List Enter 回调
  const handleEnter = useCallback((item: ListItem<ICommand>) => {
    handleExecute(item.data)
  }, [handleExecute])

  // 获取图标
  const getIcon = (command: ICommand) => {
    if (command.type === 'System') {
      return '⚙️'
    } else if (command.type === 'Command') {
      return '⚡'
    }
    return '📦'
  }

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
        {previewElements.map((element, index) => (
          <React.Fragment key={`preview-${index}`}>{element}</React.Fragment>
        ))}

        {/* 统一的列表 */}
        <List
          sections={sections}
          onSelect={handleSelect}
          onEnter={handleEnter}
          initialSelectedIndex={0}
          renderItem={(item) => {
            const command = item.data
            return (
              <Item>
                <div className="result-icon">
                  {getIcon(command)}
                </div>
                <div className="result-content">
                  <div className="result-info">
                    <Text variant="title" ellipsis>{command.title}</Text>
                  </div>
                  <Text variant="label">{command.type || 'Extension'}</Text>
                </div>
              </Item>
            )
          }}
        />
      </div>

      <div className="footer">
        <div className="footer-desc">
          {selectedCommand?.desc || ''}
        </div>
        <div
          className="footer-settings"
          onClick={() => {
            executeCommand('@system#settings', { navigateTo })
          }}
        >
          ⚙️
        </div>
      </div>
    </Panel>
  )
})

MainPanel.displayName = 'MainPanel'

export default MainPanel
