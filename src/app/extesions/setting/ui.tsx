import { useState } from 'react'
import { Text, VStack, Input, Divider, Button } from 'keyerext'

export default function Setting() {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')

    const handleSave = () => {
        alert(`已保存设置:\n用户名: ${username}\n邮箱: ${email}`)
    }

    const handleReset = () => {
        setUsername('')
        setEmail('')
    }

    return (
        <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
            <VStack spacing={24} style={{ alignItems: 'stretch' }}>
                {/* Header */}
                <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
                    <Text color="title" size="large">设置</Text>
                    <Text color="subtitle" size="small">配置应用程序选项</Text>
                </VStack>

                <Divider />

                {/* User Settings */}
                <VStack spacing={16} style={{ alignItems: 'stretch' }}>
                    <Text color="title" size="medium">用户信息</Text>

                    <VStack spacing={8} style={{ alignItems: 'stretch' }}>
                        <Text color="subtitle" size="small">用户名</Text>
                        <Input
                            value={username}
                            placeholder="请输入用户名"
                            onChange={setUsername}
                        />
                    </VStack>

                    <VStack spacing={8} style={{ alignItems: 'stretch' }}>
                        <Text color="subtitle" size="small">邮箱</Text>
                        <Input
                            value={email}
                            placeholder="请输入邮箱地址"
                            onChange={setEmail}
                            onEnter={handleSave}
                        />
                    </VStack>
                </VStack>

                <Divider />

                {/* About Section */}
                <VStack spacing={12} style={{ alignItems: 'stretch' }}>
                    <Text color="title" size="medium">关于</Text>
                    <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
                        <VStack spacing={4} style={{ alignItems: 'flex-start' }}>
                            <Text color="subtitle" size="small">应用名称</Text>
                            <Text color="title" size="medium">Keyer</Text>
                        </VStack>
                        <VStack spacing={4} style={{ alignItems: 'flex-start' }}>
                            <Text color="subtitle" size="small">版本</Text>
                            <Text color="title" size="medium">1.0.0</Text>
                        </VStack>
                        <VStack spacing={4} style={{ alignItems: 'flex-start' }}>
                            <Text color="subtitle" size="small">描述</Text>
                            <Text color="title" size="small">
                                基于 Electron + React 的现代化快捷启动器
                            </Text>
                        </VStack>
                    </VStack>
                </VStack>

                <Divider />

                {/* Actions */}
                <VStack spacing={12} style={{ alignItems: 'stretch' }}>
                    <VStack spacing={8} style={{ alignItems: 'stretch' }}>
                        <Button
                            variant="solid"
                            size="normal"
                            onClick={handleSave}
                            disabled={!username && !email}
                        >
                            保存设置
                        </Button>
                        <Button
                            variant="outline"
                            size="normal"
                            onClick={handleReset}
                        >
                            重置
                        </Button>
                    </VStack>
                    <Text color="subtitle" size="small" style={{ textAlign: 'center' }}>
                        按 ESC 返回主页
                    </Text>
                </VStack>
            </VStack>
        </div>
    )
}
