import { useState, useCallback } from 'react'
import { Text, VStack, HStack, Input, Divider, Button, Switch, useEscapeHandler } from 'keyerext'
import { configManager } from '../../utils/config'

export default function Setting() {
    const [username, setUsername] = useState(() => configManager.get('username') || '')
    const [email, setEmail] = useState(() => configManager.get('email') || '')
    const [notifications, setNotifications] = useState(() => configManager.get('notifications') ?? true)
    const [preventEscape, setPreventEscape] = useState(false)
    const [confirmOnEscape, setConfirmOnEscape] = useState(false)

    // 使用函数处理 Esc - 如果开启确认模式，有内容时会弹出确认对话框
    const handleEscape = useCallback(() => {
        if (confirmOnEscape && (username || email)) {
            return window.confirm('有未保存的更改，确定退出吗？')
        }
        return true
    }, [confirmOnEscape, username, email])

    // 根据模式选择使用布尔值或函数
    useEscapeHandler(confirmOnEscape ? handleEscape : preventEscape)

    const handleReset = () => {
        setUsername('')
        setEmail('')
    }

    return (
        <VStack spacing={24} className='plugin'>
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
                    />
                </VStack>
            </VStack>

            <Divider />

            {/* Preferences */}
            <VStack spacing={16} style={{ alignItems: 'stretch' }}>
                <Text color="title" size="medium">偏好设置</Text>

                <HStack spacing={16} style={{ justifyContent: 'space-between' }}>
                    <VStack spacing={4} style={{ alignItems: 'flex-start' }}>
                        <Text color="title" size="medium">推送通知</Text>
                        <Text color="subtitle" size="small">接收应用通知</Text>
                    </VStack>
                    <Switch
                        checked={notifications}
                        onChange={setNotifications}
                    />
                </HStack>

                <HStack spacing={16} style={{ justifyContent: 'space-between' }}>
                    <VStack spacing={4} style={{ alignItems: 'flex-start' }}>
                        <Text color="title" size="medium">阻止 ESC 关闭</Text>
                        <Text color="subtitle" size="small">
                            {preventEscape ? '开启后按 ESC 将无法关闭' : '关闭后按 ESC 可正常关闭'}
                        </Text>
                    </VStack>
                    <Switch
                        checked={preventEscape}
                        onChange={(checked) => {
                            setPreventEscape(checked)
                            if (checked) setConfirmOnEscape(false)
                        }}
                    />
                </HStack>

                <HStack spacing={16} style={{ justifyContent: 'space-between' }}>
                    <VStack spacing={4} style={{ alignItems: 'flex-start' }}>
                        <Text color="title" size="medium">ESC 确认模式 (函数示例)</Text>
                        <Text color="subtitle" size="small">
                            {confirmOnEscape ? '有输入内容时会弹出确认对话框' : '关闭后按 ESC 可正常关闭'}
                        </Text>
                    </VStack>
                    <Switch
                        checked={confirmOnEscape}
                        onChange={(checked) => {
                            setConfirmOnEscape(checked)
                            if (checked) setPreventEscape(false)
                        }}
                    />
                </HStack>
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
    )
}
