import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ICommand } from '../../shared/types'
import { CommandManager } from '../../shared/Commands'
import { Input, InputHandle, List, Item, Panel, Text, ExtensionResult } from 'keyerext'
import type { ListItem, ListSection } from 'keyerext'
import { useNavigation } from '../contexts/NavigationContext'
import { executeSystemCommand, getAllSystemCommands } from '../utils/SystemCommands'

interface MainViewProps {
  commandManagerReady: boolean
}

function MainView({ commandManagerReady }: MainViewProps) {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<ICommand[]>([])
  const [previewElements, setPreviewElements] = useState<Array<ExtensionResult>>([])
  const [selectedCommand, setSelectedCommand] = useState<ICommand | null>(null)

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
  const handleExecute = useCallback(async (command: ICommand) => {
    try {
      // 检查是否是系统命令
      const systemCommand = executeSystemCommand(command.ucid)
      if (systemCommand) {
        // 系统命令：直接导航到绑定的组件
        navigateTo({
          type: 'system',
          extensionComponent: systemCommand.component,
          windowSize: systemCommand.windowSize
        })
        return
      }

      // 执行扩展命令
      const commandManager = CommandManager.getInstance()
      const result = await commandManager.execute(command)

      // 处理返回值 (ExtensionResult = null | React.ReactElement | boolean)
      if (result === null || result === false) {
        // null/false: 关闭主面板
        const { ipcRenderer } = window.require('electron')
        await ipcRenderer.invoke('hide-window')
      } else if (result === true) {
        // true: 保持窗口打开，不做任何操作
        return
      } else if (React.isValidElement(result)) {
        // React.ReactElement: 切换至扩展的二级面板
        navigateTo({
          type: 'extension',
          extensionElement: result,
          windowSize: 'normal' // 扩展视图使用大窗口
        })
      }
    } catch (error) {
      console.error('Execute error:', error)
    }
  }, [navigateTo])

  // List 选中回调
  const handleSelect = useCallback((item: ListItem<ICommand>) => {
    setSelectedCommand(item.data)
  }, [])

  // List Enter 回调
  const handleEnter = useCallback((item: ListItem<ICommand>) => {
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

      const command = allCommands.find(cmd => cmd.ucid === commandId)
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
  const getIcon = (command: ICommand) => {
    if (command.type === 'System') {
      return '⚙️'
    } else if (command.type === 'Command') {
      return '⚡'
    }
    return '📦'
  }

  // 获取系统命令
  const systemCommands = useMemo(() => getAllSystemCommands(), [])

  // 构建 Section 列表
  const sections = useMemo(() => {
    const sections: ListSection<ICommand>[] = []

    // 添加 Commands 部分
    if (results.length > 0) {
      sections.push({
        header: 'Commands',
        items: results.map(command => ({ id: command.ucid, data: command }))
      })
    }

    // 添加 Suggestions 部分（系统命令）
    if (systemCommands.length > 0) {
      sections.push({
        header: 'Suggestions',
        items: systemCommands.map(command => ({ id: command.ucid, data: command }))
      })
    }

    return sections
  }, [results, systemCommands])

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
            const systemCommand = executeSystemCommand('@system#settings')
            if (systemCommand) {
              navigateTo({
                type: 'system',
                extensionComponent: systemCommand.component,
                windowSize: systemCommand.windowSize
              })
            }
          }}
        >
          ⚙️
        </div>
      </div>
    </Panel>
  )
}

export default MainView
