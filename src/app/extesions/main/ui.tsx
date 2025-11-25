import { useState, useRef, useEffect } from 'react'
import { Text, VStack, HStack, Input, List, useInputEscapeHandler, useNavigation, type InputRef, type ListItem, type ListGroup } from 'keyerext'
import { commandManager } from '../../managers/CommandManager'
import type { ICommand } from 'keyerext'

export default function Main() {
    const [searchText, setSearchText] = useState('')
    const [commands, setCommands] = useState<ICommand[]>([])
    const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
    const inputRef = useRef<InputRef>(null)
    const { push } = useNavigation()

    useInputEscapeHandler(inputRef)

    // Load all commands on mount and update when search text changes
    useEffect(() => {
        const results = commandManager.search(searchText)
        setCommands(results)
        // Auto-select first item when commands change
        if (results.length > 0) {
            setSelectedId(results[0].id)
        } else {
            setSelectedId(undefined)
        }
    }, [searchText])


    // Handle command execution
    const handleExecuteCommand = (id: string, cmd: ICommand) => {
        console.log('Executing command:', cmd.id)
        push(cmd.id)
    }

    // Handle selection change
    const handleSelect = (id: string) => {
        setSelectedId(id)
    }

    // Convert ICommand to ListItem format
    const listItems: ListItem<ICommand>[] = commands.map(cmd => ({
        id: cmd.id,
        data: cmd
    }))

    const groups: ListGroup<ICommand>[] = [{
        items: listItems
    }]

    const renderItem = (item: ListItem<ICommand>) => {
        const cmd = item.data
        return (
            <HStack spacing={12} style={{ alignItems: 'center', width: '100%', padding: '8px' }}>
                <Text size="large">{cmd.icon}</Text>
                <VStack spacing={2} style={{ flex: 1, alignItems: 'flex-start' }}>
                    <HStack spacing={8} style={{ alignItems: 'center' }}>
                        <Text color="title" size="medium">{cmd.title}</Text>
                        <Text color="subtitle" size="small">{cmd.extTitle}</Text>
                    </HStack>
                    <HStack spacing={8} style={{ alignItems: 'center', width: '100%' }}>
                        <Text color="subtitle" size="small">{cmd.type}</Text>
                    </HStack>
                </VStack>
            </HStack>
        )
    }

    return (
        <div style={{ padding: '16px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <VStack spacing={16} style={{ flex: 1, alignItems: 'stretch' }}>
                {/* Search Input */}
                <Input
                    ref={inputRef}
                    value={searchText}
                    placeholder="搜索命令..."
                    onChange={setSearchText}
                    autoFocus
                />

                {/* Command List */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                    {commands.length > 0 ? (
                        <List
                            groups={groups}
                            renderItem={renderItem}
                            selectedId={selectedId}
                            onSelect={handleSelect}
                            onEnter={handleExecuteCommand}
                        />
                    ) : (
                        <VStack spacing={8} style={{ alignItems: 'center', padding: '32px' }}>
                            <Text color="subtitle" size="medium">未找到匹配的命令</Text>
                            <Text color="subtitle" size="small">尝试其他搜索词</Text>
                        </VStack>
                    )}
                </div>
            </VStack>
        </div>
    )
}
