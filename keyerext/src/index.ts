
export type ICommand = {
    id: string
    name: string
    title: string
    icon: string
    desc: string
}

export interface IExtension {
    run(name: string): React.ReactElement | null;
}

// Navigation
export { NavigationContext, type NavigationContextType, type PageStackItem } from './contexts/NavigationContext'
export { useNavigation } from './hooks/useNavigation'
export { useEscapeHandler } from './hooks/useEscapeHandler'
export { useInputEscapeHandler } from './hooks/useInputEscapeHandler'

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