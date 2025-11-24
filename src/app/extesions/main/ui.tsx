import { useState } from 'react'
import { useNavigation } from '../../contexts/NavigationContext'
import { Text, VStack, HStack, Button, Divider } from 'keyerext'

export default function Main() {
    const { push } = useNavigation()
    const [count, setCount] = useState(0)

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
                            onClick={() => push('@sysetem#setting')}
                        >
                            打开设置
                        </Button>
                        <Button
                            variant="outline"
                            size="normal"
                            onClick={() => push('@sysetem#ui')}
                        >
                            UI 组件演示
                        </Button>
                    </VStack>
                </VStack>

                <Divider />

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
