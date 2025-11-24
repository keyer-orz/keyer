export interface IExtension {
    run(name: string): React.ReactElement | null;
}

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