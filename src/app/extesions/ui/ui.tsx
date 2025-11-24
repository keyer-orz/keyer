import { useState } from 'react'
import { Text, List, VStack, HStack, Input, Divider, ListGroup, Dropdown, DropdownOption, Button, Switch } from 'keyerext'

export default function UIDemo() {
    const [searchText, setSearchText] = useState('')
    const [selectedId, setSelectedId] = useState('item-1')
    const [theme, setTheme] = useState<'light' | 'dark' | 'pink' | 'github' | 'github-dark'>('light')
    const [notificationsEnabled, setNotificationsEnabled] = useState(true)
    const [autoSave, setAutoSave] = useState(false)

    interface ProjectData {
        name: string
        type: string
    }

    const groups: ListGroup<ProjectData>[] = [
        {
            title: "工作项目",
            items: [
                { id: "item-1", data: { name: "项目 A", type: "电商平台" } },
                { id: "item-2", data: { name: "项目 B", type: "后台管理系统" } },
                { id: "item-3", data: { name: "项目 C", type: "移动应用" } }
            ]
        },
        {
            title: "个人项目",
            items: [
                { id: "item-4", data: { name: "博客网站", type: "个人" } },
                { id: "item-5", data: { name: "工具集合", type: "开源" } }
            ]
        },
        {
            title: "学习资源",
            items: [
                { id: "item-6", data: { name: "React 文档", type: "文档" } },
                { id: "item-7", data: { name: "TypeScript 教程", type: "教程" } },
                { id: "item-8", data: { name: "设计模式", type: "书籍" } }
            ]
        }
    ]

    type ThemeType = 'light' | 'dark' | 'pink' | 'github' | 'github-dark'

    const themeOptions: DropdownOption<ThemeType>[] = [
        { label: '☀️ 亮色', value: 'light' },
        { label: '🌙 暗色', value: 'dark' },
        { label: '💗 粉色', value: 'pink' },
        { label: '🐙 GitHub', value: 'github' },
        { label: '🌃 GitHub 暗色', value: 'github-dark' }
    ]

    const handleThemeChange = (newTheme: ThemeType) => {
        setTheme(newTheme)
        document.documentElement.setAttribute('data-theme', newTheme)
    }

    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <VStack spacing={24} style={{ alignItems: 'stretch' }}>
                {/* Header */}
                <HStack spacing={16} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <VStack spacing={4} style={{ alignItems: 'flex-start' }}>
                        <Text color="title" size="large">UI 组件演示</Text>
                        <Text color="subtitle" size="small">展示 Keyer 所有 UI 组件</Text>
                    </VStack>
                    <div style={{ width: '180px' }}>
                        <Dropdown
                            options={themeOptions}
                            value={theme}
                            onChange={handleThemeChange}
                        />
                    </div>
                </HStack>

                <Divider />

                {/* Text 组件演示 */}
                <VStack spacing={12} style={{ alignItems: 'flex-start' }}>
                    <Text color="title" size="medium">Text 组件</Text>
                    <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
                        <Text color="title" size="large">大标题文本 (Large Title)</Text>
                        <Text color="title" size="medium">中等标题文本 (Medium Title)</Text>
                        <Text color="title" size="small">小标题文本 (Small Title)</Text>
                        <Text color="subtitle" size="medium">副标题文本 (Subtitle)</Text>
                        <Text color="subtitle" size="small">小副标题文本 (Small Subtitle)</Text>
                    </VStack>
                </VStack>

                <Divider />

                {/* Input 组件演示 */}
                <VStack spacing={12} style={{ alignItems: 'stretch' }}>
                    <Text color="title" size="medium">Input 组件</Text>
                    <Input
                        value={searchText}
                        placeholder="搜索项目... (支持回车键)"
                        onChange={setSearchText}
                        onEnter={(val) => alert(`搜索: ${val}`)}
                    />
                    {searchText && (
                        <Text color="subtitle" size="small">当前输入: {searchText}</Text>
                    )}
                </VStack>

                <Divider />

                {/* List 组件演示 */}
                <VStack spacing={12} style={{ alignItems: 'stretch' }}>
                    <VStack spacing={4} style={{ alignItems: 'flex-start' }}>
                        <Text color="title" size="medium">List 组件</Text>
                        <Text color="subtitle" size="small">
                            支持键盘上下箭头选择 • 回车键确认 • 双击打开
                        </Text>
                    </VStack>

                    <List
                        groups={groups}
                        selectedId={selectedId}
                        renderItem={(item, _isSelected, _isHovered) => (
                            <VStack spacing={2} style={{ alignItems: 'flex-start' }}>
                                <Text color="title" size="medium">{item.data.name}</Text>
                                <Text color="subtitle" size="small">{item.data.type}</Text>
                            </VStack>
                        )}
                        onSelect={(id, data) => {
                            setSelectedId(id)
                            console.log('选中:', id, data)
                        }}
                        onDoubleClick={(_id, data) => {
                            alert(`打开: ${data.name} (${data.type})`)
                        }}
                    />

                    <HStack spacing={8}>
                        <Text color="subtitle" size="small">已选择:</Text>
                        <Text color="title" size="small">{selectedId}</Text>
                    </HStack>
                </VStack>

                <Divider />

                {/* Stack 布局演示 */}
                <VStack spacing={12} style={{ alignItems: 'stretch' }}>
                    <Text color="title" size="medium">Stack 布局</Text>

                    <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
                        <Text color="subtitle" size="small">HStack (横向布局):</Text>
                        <HStack spacing={16}>
                            <div style={{
                                padding: '12px 24px',
                                background: 'var(--color-hover)',
                                borderRadius: '4px'
                            }}>
                                <Text>Item 1</Text>
                            </div>
                            <Divider vertical />
                            <div style={{
                                padding: '12px 24px',
                                background: 'var(--color-hover)',
                                borderRadius: '4px'
                            }}>
                                <Text>Item 2</Text>
                            </div>
                            <Divider vertical />
                            <div style={{
                                padding: '12px 24px',
                                background: 'var(--color-hover)',
                                borderRadius: '4px'
                            }}>
                                <Text>Item 3</Text>
                            </div>
                        </HStack>
                    </VStack>

                    <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
                        <Text color="subtitle" size="small">VStack (纵向布局):</Text>
                        <VStack spacing={8} style={{ alignItems: 'stretch', width: '100%' }}>
                            <div style={{
                                padding: '12px 24px',
                                background: 'var(--color-hover)',
                                borderRadius: '4px'
                            }}>
                                <Text>Item 1</Text>
                            </div>
                            <div style={{
                                padding: '12px 24px',
                                background: 'var(--color-hover)',
                                borderRadius: '4px'
                            }}>
                                <Text>Item 2</Text>
                            </div>
                            <div style={{
                                padding: '12px 24px',
                                background: 'var(--color-hover)',
                                borderRadius: '4px'
                            }}>
                                <Text>Item 3</Text>
                            </div>
                        </VStack>
                    </VStack>
                </VStack>

                <Divider />

                {/* Dropdown 组件演示 */}
                <VStack spacing={12} style={{ alignItems: 'stretch' }}>
                    <Text color="title" size="medium">Dropdown 组件</Text>
                    <VStack spacing={8} style={{ alignItems: 'flex-start', width: '100%' }}>
                        <Text color="subtitle" size="small">主题选择 (见右上角):</Text>
                        <div style={{ width: '100%', maxWidth: '300px' }}>
                            <Dropdown
                                options={themeOptions}
                                value={theme}
                                placeholder="选择主题..."
                                onChange={handleThemeChange}
                            />
                        </div>
                    </VStack>
                </VStack>

                <Divider />

                {/* Button 组件演示 */}
                <VStack spacing={12} style={{ alignItems: 'stretch' }}>
                    <Text color="title" size="medium">Button 组件</Text>

                    <VStack spacing={16} style={{ alignItems: 'flex-start' }}>
                        <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
                            <Text color="subtitle" size="small">实心按钮 (Solid):</Text>
                            <HStack spacing={12}>
                                <Button variant="solid" size="normal" onClick={() => alert('正常尺寸按钮')}>
                                    正常按钮
                                </Button>
                                <Button variant="solid" size="small" onClick={() => alert('小号尺寸按钮')}>
                                    小号按钮
                                </Button>
                                <Button variant="solid" size="normal" disabled>
                                    禁用状态
                                </Button>
                            </HStack>
                        </VStack>

                        <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
                            <Text color="subtitle" size="small">描边按钮 (Outline):</Text>
                            <HStack spacing={12}>
                                <Button variant="outline" size="normal" onClick={() => alert('正常尺寸按钮')}>
                                    正常按钮
                                </Button>
                                <Button variant="outline" size="small" onClick={() => alert('小号尺寸按钮')}>
                                    小号按钮
                                </Button>
                                <Button variant="outline" size="normal" disabled>
                                    禁用状态
                                </Button>
                            </HStack>
                        </VStack>
                    </VStack>
                </VStack>

                <Divider />

                {/* Switch 组件演示 */}
                <VStack spacing={12} style={{ alignItems: 'stretch' }}>
                    <Text color="title" size="medium">Switch 组件</Text>
                    <VStack spacing={12} style={{ alignItems: 'stretch' }}>
                        <HStack spacing={16} style={{ justifyContent: 'space-between' }}>
                            <VStack spacing={4} style={{ alignItems: 'flex-start' }}>
                                <Text color="title" size="medium">启用通知</Text>
                                <Text color="subtitle" size="small">接收应用通知消息</Text>
                            </VStack>
                            <Switch
                                checked={notificationsEnabled}
                                onChange={setNotificationsEnabled}
                            />
                        </HStack>

                        <HStack spacing={16} style={{ justifyContent: 'space-between' }}>
                            <VStack spacing={4} style={{ alignItems: 'flex-start' }}>
                                <Text color="title" size="medium">自动保存</Text>
                                <Text color="subtitle" size="small">自动保存编辑内容</Text>
                            </VStack>
                            <Switch
                                checked={autoSave}
                                onChange={setAutoSave}
                            />
                        </HStack>

                        <HStack spacing={16} style={{ justifyContent: 'space-between' }}>
                            <VStack spacing={4} style={{ alignItems: 'flex-start' }}>
                                <Text color="title" size="medium">禁用状态</Text>
                                <Text color="subtitle" size="small">此开关不可用</Text>
                            </VStack>
                            <Switch
                                checked={false}
                                disabled
                            />
                        </HStack>
                    </VStack>
                </VStack>

                <Divider />

                {/* 底部提示 */}
                <VStack spacing={4} style={{ alignItems: 'center' }}>
                    <Text color="subtitle" size="small">按 ESC 返回主页</Text>
                    <Text color="subtitle" size="small">所有组件支持日夜间主题切换</Text>
                </VStack>
            </VStack>
        </div>
    )
}
