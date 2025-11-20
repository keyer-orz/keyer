import { useState, useEffect, useCallback, useImperativeHandle, forwardRef, useRef } from 'react'
import { ICommand } from 'keyerext'
import { CommandManager } from '@/managers/CommandManager'
import { Panel, ExtensionResult, ViewList } from 'keyerext'
import type { ListSection } from 'keyerext'
import { useNavigation } from '@/utils/NavigationContext'
import { executeCommand } from '@/utils/CommandExecutor'
import { Input, VStack, Box, Text, HStack } from 'keyerext'

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

  const inputRef = useRef<HTMLInputElement>(null)
  const { navigateTo } = useNavigation()

  // 扁平化所有命令用于键盘导航
  const allCommands = sections.flatMap(section => section.items.map(item => item.data))

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    isEmpty: () => !input || input.trim() === '',
    isFocused: () => document.activeElement === inputRef.current,
    focus: () => {
      inputRef.current?.focus()
    },
    clear: () => {
      setInput('')
      inputRef.current?.focus()
    }
  }), [input])

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

  // 键盘导航


  // 获取图标
  const getIcon = (command: ICommand) => {
    if (command.icon) return command.icon
    if (command.type === 'System') return '⚙️'
    if (command.type === 'Command') return '⚡'
    return '📦'
  }

  return (
    <Panel>
      <VStack align="stretch" gap={4} p={4}>
        {/* 输入框 */}
        <Input
          ref={inputRef}
          placeholder="Search commands..."
          variant="flushed"
          size="lg"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />

        {/* 预览元素 */}
        {previewElements.length > 0 && (
          <VStack align="stretch" gap={2}>
            {previewElements.map((element, index) => (
              <Box key={`preview-${index}`}>
                {element}
              </Box>
            ))}
          </VStack>
        )}

        {/* 命令列表 */}
        {/* 命令列表 */}
        <ViewList
          sections={sections}
          onExecute={handleExecute}
          renderItem={(command: ICommand, isSelected: boolean) => (
            <HStack gap={3}>
              {/* Icon */}
              <Text fontSize="xl">{getIcon(command)}</Text>

              {/* Content */}
              <VStack align="start" gap={0} flex={1}>
                <Text fontWeight="medium" fontSize="sm">
                  {command.title}
                </Text>
                <Text
                  fontSize="xs"
                  color={isSelected ? 'whiteAlpha.800' : 'gray.500'}
                >
                  {command.desc || command.type || 'Command'}
                </Text>
              </VStack>
            </HStack>
          )}
        />

        {/* 空状态 */}
        {allCommands.length === 0 && input && (
          <Box textAlign="center" py={8}>
            <Text color="gray.500">No commands found</Text>
          </Box>
        )}
      </VStack>
    </Panel>
  )
})

MainPanel.displayName = 'MainPanel'

export default MainPanel
