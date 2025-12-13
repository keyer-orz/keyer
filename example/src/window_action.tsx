import { VStack, Text, Button, HStack } from 'keyerext'
import { useState } from 'react'

// Window 模式示例组件
export default function WindowDemoUI() {
    const [count, setCount] = useState(0)

    return (
        <VStack spacing={24} style={{ padding: '32px', height: '100%' }}>
            <Text size="large" color="title">独立窗口命令演示</Text>

            <VStack spacing={16}>
                <Text color="subtitle">
                    这是一个在独立窗口中运行的命令，不会阻塞主窗口。
                </Text>

                <Text color="subtitle">
                    你可以继续使用主窗口搜索和执行其他命令。
                </Text>
            </VStack>

            <VStack spacing={12}>
                <Text size="medium">计数器示例：{count}</Text>
                <HStack spacing={8}>
                    <Button onClick={() => setCount(count + 1)}>增加</Button>
                    <Button onClick={() => setCount(count - 1)}>减少</Button>
                    <Button onClick={() => setCount(0)}>重置</Button>
                </HStack>
            </VStack>

            <VStack spacing={8}>
                <Text size="small" color="subtitle">窗口特性：</Text>
                <Text size="small" color="subtitle">✓ 独立运行，不阻塞主窗口</Text>
                <Text size="small" color="subtitle">✓ 可以同时打开多个实例</Text>
                <Text size="small" color="subtitle">✓ 支持自定义窗口大小</Text>
                <Text size="small" color="subtitle">✓ 保持独立的状态</Text>
            </VStack>
        </VStack>
    )
}

