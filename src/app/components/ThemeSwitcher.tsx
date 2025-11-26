import { useEffect, useState } from 'react'
import { Dropdown, DropdownOption } from 'keyerext'
import { configManager } from '../utils/config'

export type Theme = 'light' | 'dark' | 'pink' | 'github' | 'github-dark'

export interface ThemeSwitcherProps {
  /**
   * 当前主题（受控模式）
   */
  value?: Theme
  /**
   * 主题变化回调
   */
  onChange?: (theme: Theme) => void
  /**
   * 是否自动持久化到配置
   * @default true
   */
  persist?: boolean
  /**
   * 自定义样式
   */
  style?: React.CSSProperties
  /**
   * 占位文本
   */
  placeholder?: string
}

const THEME_OPTIONS: DropdownOption<Theme>[] = [
  { label: '☀️ 亮色', value: 'light' },
  { label: '🌙 暗色', value: 'dark' },
  { label: '💗 粉色', value: 'pink' },
  { label: '🐙 GitHub', value: 'github' },
  { label: '🌃 GitHub 暗色', value: 'github-dark' }
]

/**
 * 主题切换组件
 *
 * 支持两种使用模式：
 * 1. 非受控模式（默认）：自动从配置读取和保存主题
 * 2. 受控模式：通过 value 和 onChange 控制
 *
 * @example
 * // 非受控模式（自动持久化）
 * <ThemeSwitcher />
 *
 * @example
 * // 受控模式
 * <ThemeSwitcher value={theme} onChange={setTheme} persist={false} />
 */
export function ThemeSwitcher({
  value,
  onChange,
  persist = true,
  style,
  placeholder = '选择主题'
}: ThemeSwitcherProps) {
  // 内部状态（非受控模式使用）
  const [internalTheme, setInternalTheme] = useState<Theme>(() => {
    return (configManager.get('theme') as Theme) || 'light'
  })

  // 判断是否为受控模式
  const isControlled = value !== undefined

  // 当前使用的主题值
  const currentTheme = isControlled ? value : internalTheme

  // 组件挂载时应用主题
  useEffect(() => {
    if (!isControlled) {
      const savedTheme = configManager.get('theme') as Theme
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme)
        setInternalTheme(savedTheme)
      }
    }
  }, [isControlled])

  const handleThemeChange = (newTheme: Theme) => {
    // 应用到 DOM
    document.documentElement.setAttribute('data-theme', newTheme)

    // 持久化（如果启用）
    if (persist) {
      configManager.set('theme', newTheme)
    }

    // 更新状态
    if (isControlled) {
      onChange?.(newTheme)
    } else {
      setInternalTheme(newTheme)
    }
  }

  return (
    <div style={style}>
      <Dropdown
        options={THEME_OPTIONS}
        value={currentTheme}
        onChange={handleThemeChange}
        placeholder={placeholder}
      />
    </div>
  )
}

/**
 * Hook: 使用主题
 *
 * @example
 * const { theme, setTheme } = useTheme()
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (configManager.get('theme') as Theme) || 'light'
  })

  const setTheme = (newTheme: Theme) => {
    document.documentElement.setAttribute('data-theme', newTheme)
    configManager.set('theme', newTheme)
    setThemeState(newTheme)
  }

  useEffect(() => {
    const savedTheme = configManager.get('theme') as Theme
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme)
      setThemeState(savedTheme)
    }
  }, [])

  return { theme, setTheme }
}
