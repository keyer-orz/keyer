import { useState, useRef, useEffect } from 'react'
import { Text, VStack, HStack, Input, List, useInputEscapeHandler, useAutoFocusOnVisible, useNavigation, type InputRef, type ListItem, type ListGroup } from 'keyerext'
import { commandManager } from '../../managers/CommandManager'
import type { ICommand } from 'keyerext'

export default function Main() {
    const [searchText, setSearchText] = useState('')
    const [commands, setCommands] = useState<ICommand[]>([])
    const [previewItems, setPreviewItems] = useState<React.ReactElement[]>([])
    const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
    const inputRef = useRef<InputRef>(null)
    const { push } = useNavigation()

    useInputEscapeHandler(inputRef)
    useAutoFocusOnVisible(inputRef)

    // Load all commands on mount and update when search text changes
    useEffect(() => {
        const results = commandManager.search(searchText)
        setCommands(results)
        setPreviewItems(commandManager.preview(searchText))
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
        push(cmd.id!)
    }

    // Handle selection change
    const handleSelect = (id: string) => {
        setSelectedId(id)
    }

    // Convert ICommand to ListItem format
    const listItems: ListItem<ICommand>[] = commands.map(cmd => ({
        id: cmd.id!,
        data: cmd
    }))

    const groups: ListGroup<ICommand>[] = [{
        items: listItems
    }]

    const renderItem = (item: ListItem<ICommand>) => {
        const cmd = item.data
        return (
            <HStack spacing={12}>
                <Text size="large">{cmd.icon}</Text>
                <HStack spacing={8} style={{ alignItems: 'center', flex: 1 }}>
                    <Text color="title" size="medium">{cmd.title}</Text>
                    <Text color="subtitle" style={{ flex: 1 }} size="small">{cmd.extTitle}</Text>
                    <Text color="subtitle" size="small">{cmd.type}</Text>
                </HStack>
            </HStack>
        )
    }

    return <VStack className='plugin'>
        {/* Search Input */}
        <Input
            ref={inputRef}
            value={searchText}
            placeholder="搜索命令..."
            onChange={setSearchText}
            autoFocus
        />

        {/* Preview Items */}
        {previewItems.length > 0 && (
            <VStack spacing={8} style={{ marginBottom: 8 }}>
                {previewItems.map((item, idx) => (
                    <div key={idx}>{item}</div>
                ))}
            </VStack>
        )}

        <List
            groups={groups}
            renderItem={renderItem}
            selectedId={selectedId}
            onSelect={handleSelect}
            onEnter={handleExecuteCommand}
        />
    </VStack>
}
