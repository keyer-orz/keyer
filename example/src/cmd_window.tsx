import { VStack, Text, Image, Button, Keyer } from 'keyerext'
import { useState } from 'react'
import { DemoUI } from './DemoUI'

// Window 模式示例组件
export default function WindowDemoUI() {
    return (
        <VStack spacing={24} style={{ padding: '32px', height: '100%' }}>
            <Text size="large" color="title">独立窗口命令演示</Text>
            <Image src="assets/icon.png" />
            <VStack spacing={16}>
                <Text color="subtitle">
                    这是一个在独立窗口中运行的命令，不会阻塞主窗口。
                </Text>

                <Text color="subtitle">
                    你可以继续使用主窗口搜索和执行其他命令。
                </Text>

                <Button onClick={() => Keyer.toast.show('info', 'This is a toast message')}>toast</Button>

            </VStack>

            <DemoUI />
        </VStack>
    )
}

