
export type ICommand = {
    id?: string
    name: string
    title?: string
    icon?: string
    desc?: string
    extTitle?: string
    type?: string // 类型
}

export type ExtensionMeta = {
    icon?: string                   // 展示图标（emoji 或图标路径）
    name: string                    // 存储名称，建议 xxx-xxx-xx 格式，如 "app-launcher"
    title: string                   // 展示名称，如 "App Launcher"
    desc?: string                   // 展示描述
    version?: string                // 版本号
    commands?: ICommand[]           // 静态命令列表（可选，只需提供 name, title, desc, icon, type）

    type: 'store' | 'local' | 'app' // 插件类型

    // 本地磁盘上的插件
    pkgPath?: string                // 插件包路径
    main?: string                   // 主入口文件

    // App包内插件
    ext?: IExtension                // 插件实例（本地扩展加载前可能为空）
}

export interface IExtension {
    load?(): ICommand[];
    preview?(input: string): React.ReactElement | null;
    run(name: string): React.ReactElement | null;
}

// Navigation
export { NavigationContext, type NavigationContextType, type PageStackItem } from './contexts/NavigationContext'
export { useNavigation } from './hooks/useNavigation'
export { useEscapeHandler } from './hooks/useEscapeHandler'
export { useInputEscapeHandler } from './hooks/useInputEscapeHandler'
export { usePageVisible } from './hooks/usePageVisible'
export { useAutoFocusOnVisible } from './hooks/useAutoFocusOnVisible'

// UI Components
export { Text, type TextProps } from './components/Text'
export { List, type ListProps, type ListItem, type ListGroup } from './components/List'
export { HStack, VStack, type StackProps } from './components/Stack'
export { Input, type InputProps, type InputRef } from './components/Input'
export { Divider, type DividerProps } from './components/Divider'
export { Dropdown, type DropdownProps, type DropdownOption } from './components/Dropdown'
export { Button, type ButtonProps } from './components/Button'
export { Switch, type SwitchProps } from './components/Switch'
export { RadioGroup, type RadioGroupProps, type RadioOption } from './components/Radio'
export { Loading, type LoadingProps } from './components/Loading'
export { Checkbox, CheckboxGroup, type CheckboxProps, type CheckboxGroupProps } from './components/Checkbox'

// Keyer Core Capabilities
export { Keyer, setKeyer, type IKeyer, type ClipboardData, type ExecOptions, type ExecResult } from './keyer'