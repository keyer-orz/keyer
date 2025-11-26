import { useState } from 'react'
import { Text, List, VStack, HStack, Input, Divider, ListGroup, Button, Switch, RadioGroup, RadioOption, Loading, Checkbox, CheckboxGroup } from 'keyerext'
import { ThemeSwitcher } from '../../components'

export default function UIDemo() {
    const [searchText, setSearchText] = useState('')
    const [selectedId, setSelectedId] = useState('item-1')
    const [notificationsEnabled, setNotificationsEnabled] = useState(true)
    const [autoSave, setAutoSave] = useState(false)
    const [language, setLanguage] = useState('zh-CN')
    const [updateChannel, setUpdateChannel] = useState('stable')
    const [showFullscreenLoading, setShowFullscreenLoading] = useState(false)
    const [showOverlayLoading, setShowOverlayLoading] = useState(false)
    const [agreeTerms, setAgreeTerms] = useState(false)
    const [receiveNewsletter, setReceiveNewsletter] = useState(true)
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['feature1'])

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
                        <ThemeSwitcher />
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
                        placeholder="搜索项目..."
                        onChange={setSearchText}
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
                        onEnter={(_id, data) => {
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
                        <Text color="subtitle" size="small">主题选择 (见右上角 ThemeSwitcher 组件):</Text>
                        <div style={{ width: '100%', maxWidth: '300px' }}>
                            <ThemeSwitcher placeholder="选择主题..." />
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

                {/* Radio 组件演示 */}
                <VStack spacing={12} style={{ alignItems: 'stretch' }}>
                    <Text color="title" size="medium">Radio 组件</Text>

                    <VStack spacing={16} style={{ alignItems: 'stretch' }}>
                        <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
                            <Text color="subtitle" size="small">选择语言</Text>
                            <RadioGroup
                                options={[
                                    { label: '简体中文', value: 'zh-CN' },
                                    { label: 'English', value: 'en-US' },
                                    { label: '日本語', value: 'ja-JP' },
                                    { label: 'Français', value: 'fr-FR' }
                                ] as RadioOption<string>[]}
                                value={language}
                                onChange={setLanguage}
                            />
                        </VStack>

                        <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
                            <Text color="subtitle" size="small">更新通道</Text>
                            <RadioGroup
                                options={[
                                    { label: '稳定版 (推荐)', value: 'stable' },
                                    { label: '测试版', value: 'beta' },
                                    { label: '开发版', value: 'dev', disabled: true }
                                ] as RadioOption<string>[]}
                                value={updateChannel}
                                onChange={setUpdateChannel}
                            />
                        </VStack>
                    </VStack>
                </VStack>

                <Divider />

                {/* Checkbox 组件演示 */}
                <VStack spacing={12} style={{ alignItems: 'stretch' }}>
                    <Text color="title" size="medium">Checkbox 组件</Text>

                    <VStack spacing={16} style={{ alignItems: 'stretch' }}>
                        <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
                            <Text color="subtitle" size="small">单个复选框:</Text>
                            <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
                                <Checkbox
                                    checked={agreeTerms}
                                    onChange={setAgreeTerms}
                                    label="我同意服务条款和隐私政策"
                                />
                                <Checkbox
                                    checked={receiveNewsletter}
                                    onChange={setReceiveNewsletter}
                                    label="订阅新闻邮件"
                                />
                                <Checkbox
                                    checked={false}
                                    disabled
                                    label="禁用状态"
                                />
                                <Checkbox
                                    checked={true}
                                    disabled
                                    label="禁用且选中"
                                />
                            </VStack>
                        </VStack>

                        <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
                            <Text color="subtitle" size="small">不确定状态 (Indeterminate):</Text>
                            <Checkbox
                                checked={false}
                                indeterminate={true}
                                label="部分选中状态"
                            />
                        </VStack>

                        <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
                            <Text color="subtitle" size="small">复选框组:</Text>
                            <CheckboxGroup
                                options={[
                                    { label: '暗黑模式', value: 'feature1' },
                                    { label: '自动更新', value: 'feature2' },
                                    { label: '性能监控', value: 'feature3' },
                                    { label: '实验性功能 (不可用)', value: 'feature4', disabled: true }
                                ]}
                                value={selectedFeatures}
                                onChange={setSelectedFeatures}
                            />
                            <Text color="subtitle" size="small">
                                已选择: {selectedFeatures.length > 0 ? selectedFeatures.join(', ') : '无'}
                            </Text>
                        </VStack>

                        <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
                            <Text color="subtitle" size="small">全选示例:</Text>
                            <div style={{
                                padding: '16px',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px'
                            }}>
                                <VStack spacing={12} style={{ alignItems: 'stretch' }}>
                                    <Checkbox
                                        checked={selectedFeatures.length === 3}
                                        indeterminate={selectedFeatures.length > 0 && selectedFeatures.length < 3}
                                        onChange={(checked: any) => {
                                            setSelectedFeatures(checked ? ['feature1', 'feature2', 'feature3'] : [])
                                        }}
                                        label="全选功能"
                                    />
                                    <Divider />
                                    <CheckboxGroup
                                        options={[
                                            { label: '暗黑模式', value: 'feature1' },
                                            { label: '自动更新', value: 'feature2' },
                                            { label: '性能监控', value: 'feature3' }
                                        ]}
                                        value={selectedFeatures}
                                        onChange={setSelectedFeatures}
                                    />
                                </VStack>
                            </div>
                        </VStack>
                    </VStack>
                </VStack>

                <Divider />

                {/* Loading 组件演示 */}
                <VStack spacing={12} style={{ alignItems: 'stretch' }}>
                    <Text color="title" size="medium">Loading 组件</Text>

                    <VStack spacing={16} style={{ alignItems: 'stretch' }}>
                        <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
                            <Text color="subtitle" size="small">不同尺寸:</Text>
                            <HStack spacing={24} style={{ alignItems: 'center' }}>
                                <VStack spacing={8} style={{ alignItems: 'center' }}>
                                    <Loading size="small" />
                                    <Text color="subtitle" size="small">小号</Text>
                                </VStack>
                                <VStack spacing={8} style={{ alignItems: 'center' }}>
                                    <Loading size="medium" />
                                    <Text color="subtitle" size="small">中号</Text>
                                </VStack>
                                <VStack spacing={8} style={{ alignItems: 'center' }}>
                                    <Loading size="large" />
                                    <Text color="subtitle" size="small">大号</Text>
                                </VStack>
                            </HStack>
                        </VStack>

                        <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
                            <Text color="subtitle" size="small">带文字提示:</Text>
                            <HStack spacing={24} style={{ alignItems: 'center' }}>
                                <Loading size="small" text="加载中" />
                                <Loading size="medium" text="请稍候..." />
                                <Loading size="large" text="正在处理" />
                            </HStack>
                        </VStack>

                        <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
                            <Text color="subtitle" size="small">全屏模式 (点击按钮体验):</Text>
                            <HStack spacing={12}>
                                <Button
                                    variant="outline"
                                    size="normal"
                                    onClick={() => {
                                        setShowFullscreenLoading(true)
                                        setTimeout(() => setShowFullscreenLoading(false), 2000)
                                    }}
                                >
                                    显示全屏加载
                                </Button>
                                <Button
                                    variant="outline"
                                    size="normal"
                                    onClick={() => {
                                        setShowOverlayLoading(true)
                                        setTimeout(() => setShowOverlayLoading(false), 2000)
                                    }}
                                >
                                    显示遮罩加载
                                </Button>
                            </HStack>
                        </VStack>

                        <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
                            <Text color="subtitle" size="small">内联使用示例:</Text>
                            <div style={{
                                padding: '16px',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                minHeight: '120px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Loading size="medium" text="正在加载数据..." />
                            </div>
                        </VStack>
                    </VStack>
                </VStack>

                <Divider />

                {/* 底部提示 */}
                <VStack spacing={4} style={{ alignItems: 'center' }}>
                    <Text color="subtitle" size="small">按 ESC 返回主页</Text>
                    <Text color="subtitle" size="small">所有组件支持日夜间主题切换</Text>
                </VStack>
            </VStack>

            {/* 全屏/遮罩 Loading 演示 */}
            {showFullscreenLoading && (
                <Loading fullscreen size="large" text="全屏加载中..." />
            )}
            {showOverlayLoading && (
                <Loading overlay size="large" text="处理中，请稍候..." />
            )}
        </div>
    )
}
