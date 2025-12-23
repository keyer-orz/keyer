import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Text, VStack, HStack, Input, List, Image, useInputEscapeHandler, useAutoFocusOnVisible, useNavigation, type InputRef, type ListItem, Divider, ListGroup } from 'keyerext'
import { commandManager } from '@/app/managers/CommandManager'
import { Command } from '@/app/managers/Extension'
import { ExtensionProvider } from '@/app/contexts/ExtensionContext'
import { Keyer } from '@/app/keyer'
import { VscSettingsGear, VscMove } from 'react-icons/vsc'

export function activeMain() {
    Keyer.command.registerApp({
        name: 'main',
    }, () => {
        return <MainPanel />
    })
}

export default function MainPanel() {
    const [searchText, setSearchText] = useState('')
    const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
    const inputRef = useRef<InputRef>(null)
    const { push } = useNavigation()

    useInputEscapeHandler(inputRef)
    useAutoFocusOnVisible(inputRef)

    // 使用 useMemo 缓存搜索结果
    const commands = useMemo(() => {
        return commandManager.search(searchText)
    }, [searchText])

    // 使用 useMemo 缓存 preview 结果
    const previews = useMemo(() => {
        return commandManager.preview(searchText)
    }, [searchText])

    // 使用 useMemo 缓存 tree data
    const treeData = useMemo<ListGroup[]>(() => {
        return [{
            title: 'Results',
            items: commands.map(cmd => ({
                id: cmd.id!,
                data: cmd
            }))
        }]
    }, [commands])

    // 自动选中第一项
    useEffect(() => {
        if (commands.length > 0 && !selectedId) {
            setSelectedId(commands[0].id)
        } else if (commands.length === 0) {
            setSelectedId(undefined)
        }
    }, [commands, selectedId])


    // Handle command execution
    const handleExecuteCommand = useCallback((_id: string, cmd: Command) => {
        console.log('Executing command:', cmd.id)
        push(cmd.id!)
    }, [push])

    // Handle selection change
    const handleSelect = useCallback((id: string) => {
        setSelectedId(id)
    }, [])

    const renderItem = useCallback((item: ListItem<Command>) => {
        const cmd = item.data
        return (
            <HStack spacing={12}>
                <ExtensionProvider ctx={cmd.ext}>
                    <Image src={cmd.icon || cmd.name} width={26} height={26} />
                </ExtensionProvider>
                <HStack spacing={8} style={{ alignItems: 'center', flex: 1 }}>
                    <Text color="title" size="medium" style={{ flex: 1 }}>{cmd.title}</Text>
                    <Text color="subtitle" size="small">{cmd.ext.title}</Text>
                </HStack>
            </HStack>
        )
    }, [])

    // 渲染固定头部 - Preview
    const renderHeader = useCallback(() => {
        if (previews.length === 0) return null
        return (
            <VStack spacing={8} style={{ borderBottom: '1px solid var(--border-color)' }}>
                {previews.map((preview, idx) => (
                    <VStack key={idx} spacing={8}>
                        <Text color="subtitle" size="small">{preview.cmd.title}</Text>
                        <>{preview.result}</>
                    </VStack>
                ))}
            </VStack>
        )
    }, [previews])

    // 获取选中命令的描述
    const selectedCommand = useMemo(() => {
        if (!selectedId) return null
        return commands.find(cmd => cmd.id === selectedId)
    }, [selectedId, commands])

    return <VStack spacing={0}>
        {/* Search Input */}
        <Input
            ref={inputRef}
            value={searchText}
            size="large"
            placeholder="Search for commands..."
            onChange={setSearchText}
            autoFocus
        />
        <List
            style={{ flex: 1 }}
            items={treeData}
            renderItem={renderItem}
            renderHeader={renderHeader}
            selectedId={selectedId}
            onSelect={handleSelect}
            onEnter={handleExecuteCommand}
        />
        <Divider />
        <HStack style={{ height: 40, padding: '0 12px', alignItems: 'center' }}>
            <Text color="title" size="medium" style={{ flex: 1 }}>{selectedCommand?.desc}</Text>
            <div style={{
                WebkitAppRegion: 'drag',
                cursor: 'move',
                display: 'flex',
                alignItems: 'center',
                padding: '4px'
            } as React.CSSProperties}>
                <VscMove size={20} style={{ cursor: 'move' }} />
            </div>
            <VscSettingsGear onClick={() => push("@system#setting")} style={{ cursor: 'pointer' }} />
        </HStack>
    </VStack>
}
