import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { IAction } from '../../shared/types'
import { CommandManager } from '../../shared/Commands'
import { Input, InputHandle, List, Item, Panel, Text } from 'keyerext'
import type { ListItem, ListSection } from 'keyerext'
import { useNavigation } from '../contexts/NavigationContext'
import { executeSystemCommand, getAllSystemActions } from '../utils/SystemCommands'

interface MainViewProps {
  commandManagerReady: boolean
}

function MainView({ commandManagerReady }: MainViewProps) {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<IAction[]>([])
  const [previewElements, setPreviewElements] = useState<Array<import('keyerext').ExtensionUIResult>>([])
  const [selectedAction, setSelectedAction] = useState<IAction | null>(null)

  const inputRef = useRef<InputHandle>(null)
  const { navigateTo } = useNavigation()

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

  // 执行命令
  const handleExecute = useCallback(async (action: IAction) => {
    try {
      // 检查是否是系统命令
      const isSystemCmd = await executeSystemCommand(action.id, navigateTo)
      if (isSystemCmd) return

      // 执行扩展命令
      const commandManager = CommandManager.getInstance()
      const result = await commandManager.execute(action)

      // 处理返回值
      if (result === null) {
        // null: 关闭主面板
        const { ipcRenderer } = window.require('electron')
        await ipcRenderer.invoke('hide-window')
      } else if (typeof result === 'function') {
        // React.ComponentType: 切换至插件的二级面板
        navigateTo({
          type: 'extension',
          extensionComponent: result
        })
      } else if (React.isValidElement(result)) {
        // React.ReactElement: 直接显示 React 元素
        navigateTo({
          type: 'extension',
          extensionElement: result
        })
      }
    } catch (error) {
      console.error('Execute error:', error)
    }
  }, [navigateTo])

  // List 选中回调
  const handleSelect = useCallback((item: ListItem<IAction>) => {
    setSelectedAction(item.data)
  }, [])

  // List Enter 回调
  const handleEnter = useCallback((item: ListItem<IAction>) => {
    handleExecute(item.data)
  }, [handleExecute])

  // 监听快捷键触发的命令执行
  useEffect(() => {
    const { ipcRenderer } = window.require('electron')

    const handleExecuteCommandFromShortcut = async (_: any, commandId: string) => {
      console.log('Executing command from shortcut:', commandId)

      if (!commandManagerReady) {
        console.warn('CommandManager not ready')
        return
      }

      // 查找命令
      const commandManager = CommandManager.getInstance()
      const allCommands = await commandManager.search('')

      const command = allCommands.find(cmd => cmd.id === commandId)
      if (command) {
        await handleExecute(command)
      } else {
        console.warn('Command not found:', commandId)
      }
    }

    ipcRenderer.on('execute-command', handleExecuteCommandFromShortcut)

    return () => {
      ipcRenderer.removeListener('execute-command', handleExecuteCommandFromShortcut)
    }
  }, [commandManagerReady, handleExecute])

  // 获取图标
  const getIcon = (action: IAction) => {
    if (action.typeLabel === 'System') {
      return '⚙️'
    } else if (action.typeLabel === 'Command') {
      return '⚡'
    }
    return '📦'
  }

  // 获取系统命令
  const systemActions = useMemo(() => getAllSystemActions(), [])

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

    // 添加 Suggestions 部分（系统命令）
    if (systemActions.length > 0) {
      sections.push({
        header: 'Suggestions',
        items: systemActions.map(action => ({ id: action.id, data: action }))
      })
    }

    return sections
  }, [results, systemActions])

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
        <div
          className="footer-settings"
          onClick={() => executeSystemCommand('system:settings', navigateTo)}
        >
          ⚙️
        </div>
      </div>
    </Panel>
  )
}

export default MainView
