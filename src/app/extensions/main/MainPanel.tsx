import { useState, useRef, useEffect } from 'react'
import { Text, VStack, HStack, Input, List, Image, useInputEscapeHandler, useAutoFocusOnVisible, useNavigation, type InputRef, type ListItem, Divider, ListGroup } from 'keyerext'
import { commandManager } from '@/app/managers/CommandManager'
import { Command, PreviewResult } from '@/app/managers/Extension'
import { ExtensionProvider } from '@/app/contexts/ExtensionContext'
import { Keyer } from '@/app/keyer'

export function activeMain() {
    Keyer.command.registerApp({
        name: 'main',
    }, () => {
        return <MainPanel />
    })
}

export default function MainPanel() {
    const [searchText, setSearchText] = useState('')
    const [selectedId, setSelectedId] = useState<ListItem | undefined>(undefined)
    const inputRef = useRef<InputRef>(null)
    const { push } = useNavigation()

    const [treeData, setTreeData] = useState<ListGroup[]>([])

    useInputEscapeHandler(inputRef)
    useAutoFocusOnVisible(inputRef)

    // Load all commands on mount and update when search text changes
    useEffect(() => {
        const results = commandManager.search(searchText)
        const previews = commandManager.preview(searchText)
        console.log(previews)
        const treeData: ListGroup[] = [
            {
                title: '',
                items: previews.map(preview => ({
                    id: `preview:${preview.cmd.id!}`,
                    data: preview
                }))
            },
            {
                title: 'Results',
                items: results.map(cmd => ({
                    id: `cmd:${cmd.id!}`,
                    data: cmd
                }))
            }
        ]
        setTreeData(treeData)

    }, [searchText])


    // Handle command execution
    const handleExecuteCommand = (_id: string, cmd: Command) => {
        console.log('Executing command:', cmd.id)
        push(cmd.id!)
    }

    // Handle selection change
    const handleSelect = (id: string, data: Command) => {
        setSelectedId({ id, data })
    }

    const renderItem = (item: ListItem<Command | PreviewResult>) => {
        if (item.id.startsWith('preview:')) {
            const res = item.data as PreviewResult
            return <HStack spacing={8} style={{ marginBottom: 8 }}>
                <div>{res.result}</div>
            </HStack>
        } else {
            const cmd = item.data as Command
            return (
                <HStack spacing={12}>
                    <ExtensionProvider ctx={cmd.ext}>
                        <Image src={cmd.icon || cmd.name} width={32} height={32} />
                    </ExtensionProvider>
                    <HStack spacing={8} style={{ alignItems: 'center', flex: 1 }}>
                        <Text color="title" size="medium" style={{ flex: 1 }}>{cmd.title}</Text>
                        <Text color="subtitle" size="small">{cmd.ext.title}</Text>
                    </HStack>
                </HStack>
            )
        }
    }

    return <VStack className='plugin' spacing={0}>
        {/* Search Input */}
        <Input
            ref={inputRef}
            value={searchText}
            placeholder="Search for commands..."
            onChange={setSearchText}
            autoFocus
        />

        <List
            items={treeData}
            renderItem={renderItem}
            selectedId={selectedId?.id}
            onSelect={handleSelect}
            onEnter={handleExecuteCommand}
        />
        <Divider />
        <HStack style={{ padding: 12 }}>
            <Text color="title" size="medium" style={{ flex: 1 }}>{selectedId?.data.desc}</Text>
        </HStack>
    </VStack>
}
