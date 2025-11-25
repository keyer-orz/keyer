import { useState, useRef } from 'react'
import { Text, VStack, HStack, Button, Divider, Switch, Input, useNavigation, useEscapeHandler, type InputRef } from 'keyerext'
import { useInputEscapeHandler } from 'keyerext'

export default function Main() {
    const { push } = useNavigation()
    const [count, setCount] = useState(0)
    const [preventEscape, setPreventEscape] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [useInputMode, setUseInputMode] = useState(false)

    const inputRef = useRef<InputRef>(null)

    // 根据模式选择不同的 Esc 处理方式
    useEscapeHandler(useInputMode ? false : preventEscape)
    useInputEscapeHandler(inputRef)

    return (
        <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
            <VStack spacing={24} style={{ alignItems: 'stretch' }}>
                {/* Header */}
                <VStack spacing={8} style={{ alignItems: 'center' }}>
                    <Text color="title" size="large">Keyer</Text>
                    <Text color="subtitle" size="small">快捷启动器</Text>
                </VStack>

                <Divider />

                {/* Counter Demo */}
                <VStack spacing={12} style={{ alignItems: 'center' }}>
                    <Text color="subtitle" size="medium">计数器演示</Text>
                    <HStack spacing={16} style={{ alignItems: 'center' }}>
                        <Button
                            variant="outline"
                            size="normal"
                            onClick={() => setCount(count - 1)}
                        >
                            -
                        </Button>
                        <Text color="title" size="large" style={{ minWidth: '60px', textAlign: 'center' }}>
                            {count}
                        </Text>
                        <Button
                            variant="outline"
                            size="normal"
                            onClick={() => setCount(count + 1)}
                        >
                            +
                        </Button>
                    </HStack>
                    <Text color="subtitle" size="small">
                        提示: 修改计数后切换页面，返回时状态会保持
                    </Text>
                </VStack>

                <Divider />

                {/* Navigation */}
                <VStack spacing={12} style={{ alignItems: 'stretch' }}>
                    <Text color="title" size="medium">导航</Text>
                    <VStack spacing={8} style={{ alignItems: 'stretch' }}>
                        <Button
                            variant="solid"
                            size="normal"
                            onClick={() => push('@system#setting')}
                        >
                            打开设置
                        </Button>
                        <Button
                            variant="outline"
                            size="normal"
                            onClick={() => push('@system#ui')}
                        >
                            UI 组件演示
                        </Button>
                    </VStack>
                </VStack>

                <Divider />

                {/* Input Escape Handler Demo */}
                <VStack spacing={12} style={{ alignItems: 'stretch' }}>
                    <Text color="title" size="medium">Input ESC 演示</Text>
                    <HStack spacing={16} style={{ justifyContent: 'space-between' }}>
                        <VStack spacing={4} style={{ alignItems: 'flex-start' }}>
                            <Text color="title" size="medium">使用 Input 模式</Text>
                            <Text color="subtitle" size="small">
                                {useInputMode ? 'ESC: 未聚焦→聚焦, 有内容→清空, 为空→关闭' : '使用简单布尔模式'}
                            </Text>
                        </VStack>
                        <Switch
                            checked={useInputMode}
                            onChange={(checked) => {
                                setUseInputMode(checked)
                                if (checked) setPreventEscape(false)
                            }}
                        />
                    </HStack>
                    {useInputMode && (
                        <VStack spacing={8} style={{ alignItems: 'stretch' }}>
                            <Text color="subtitle" size="small">搜索框</Text>
                            <Input
                                ref={inputRef}
                                value={searchText}
                                placeholder="尝试输入内容，然后按 ESC..."
                                onChange={setSearchText}
                            />
                        </VStack>
                    )}
                </VStack>

                <Divider />

                {/* Simple Escape Handler Demo */}
                {!useInputMode && (
                    <>
                        <VStack spacing={12} style={{ alignItems: 'stretch' }}>
                            <Text color="title" size="medium">简单 ESC 阻止演示</Text>
                            <HStack spacing={16} style={{ justifyContent: 'space-between' }}>
                                <VStack spacing={4} style={{ alignItems: 'flex-start' }}>
                                    <Text color="title" size="medium">阻止 ESC 关闭</Text>
                                    <Text color="subtitle" size="small">
                                        {preventEscape ? '开启后按 ESC 将无法关闭页面' : '关闭后按 ESC 可正常关闭页面'}
                                    </Text>
                                </VStack>
                                <Switch
                                    checked={preventEscape}
                                    onChange={setPreventEscape}
                                />
                            </HStack>
                        </VStack>
                        <Divider />
                    </>
                )}


                {/* Shortcuts */}
                <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
                    <Text color="title" size="medium">快捷键</Text>
                    <VStack spacing={4} style={{ alignItems: 'flex-start' }}>
                        <HStack spacing={12}>
                            <Text color="subtitle" size="small" style={{ minWidth: '120px' }}>
                                Shift + Space
                            </Text>
                            <Text color="title" size="small">打开主页</Text>
                        </HStack>
                        <HStack spacing={12}>
                            <Text color="subtitle" size="small" style={{ minWidth: '120px' }}>
                                Shift + P
                            </Text>
                            <Text color="title" size="small">打开设置</Text>
                        </HStack>
                        <HStack spacing={12}>
                            <Text color="subtitle" size="small" style={{ minWidth: '120px' }}>
                                ESC
                            </Text>
                            <Text color="title" size="small">返回上一页</Text>
                        </HStack>
                    </VStack>
                </VStack>
            </VStack>
        </div>
    )
}
