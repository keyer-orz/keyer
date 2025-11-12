import React, { useState, useEffect, useRef } from 'react'
import { IAction } from '../../shared/types'
import { CommandManager } from '../../shared/CommandManager'
import { Input, InputHandle, List, Item } from 'keyerext'
import type { ListItem } from 'keyerext'

interface MainViewProps {
  onExecute: (action: IAction) => Promise<void>
  onOpenSettings: () => void
  commandManagerReady: boolean
}

function MainView({ onExecute, onOpenSettings, commandManagerReady }: MainViewProps) {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<IAction[]>([])
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
        const actions = await commandManager.search(input)
        setResults(actions)
      } catch (error) {
        console.error('Search error:', error)
      }
    }

    const debounce = setTimeout(searchCommands, 150)
    return () => clearTimeout(debounce)
  }, [input, commandManagerReady])

  // 键盘事件处理（仅处理 Input 层面的事件）
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      const { ipcRenderer } = window.require('electron')
      ipcRenderer.invoke('hide-window')
    }
  }

  // List 选中回调
  const handleSelect = (item: ListItem<IAction>) => {
    setSelectedAction(item.data)
  }

  // List Enter 回调
  const handleEnter = (item: ListItem<IAction>) => {
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

  // 转换为 ListItem 格式
  const listItems: ListItem<IAction>[] = results.map(action => ({
    id: action.id,
    data: action
  }))

  return (
    <>
      <div className="search-container">
        <Input
          ref={inputRef}
          value={input}
          onChange={setInput}
          onKeyDown={handleKeyDown}
          placeholder="Search for apps and commands..."
          autoFocus={true}
          className="search-input"
        />
      </div>

      <div className="results-container">
        <List
          items={listItems}
          onSelect={handleSelect}
          onEnter={handleEnter}
          autoFocus={false}
          className="results-list"
          selectedClassName="selected"
          renderItem={(item) => (
            <Item style={{
              padding: '4px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              minHeight: '32px'
            }}>
              <div className="result-icon">
                {getIcon(item.data)}
              </div>
              <div className="result-content">
                <div className="result-info">
                  <div className="result-name">{item.data.name}</div>
                </div>
                <div className="result-tag">{item.data.typeLabel || 'Extension'}</div>
              </div>
            </Item>
          )}
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
    </>
  )
}

export default MainView
