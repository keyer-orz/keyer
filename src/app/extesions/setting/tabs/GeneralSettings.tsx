import { useState, useEffect } from 'react'
import { VStack, HStack, Text, Divider } from 'keyerext'
import { ShortcutRecorder } from '../../../components/ShortcutRecorder'
import { ThemeSwitcher } from '../../../components/ThemeSwitcher'
import { configManager } from '../../../utils/config'
import { electronApi } from '../../../electronApi'

export function GeneralSettings() {
  const [shortcut, setShortcut] = useState('')
  const [version, setVersion] = useState('')

  useEffect(() => {
    // 初始化快捷键
    const currentShortcut = configManager.get('globalShortcut')
    setShortcut(currentShortcut || '')

    // 获取版本号
    electronApi.getAppVersion().then(setVersion)
  }, [])

  const handleShortcutChange = (newShortcut: string) => {
    setShortcut(newShortcut)
  }

  const handleShortcutValidate = async (newShortcut: string): Promise<boolean> => {
    try {
      const success = await electronApi.updateGlobalShortcut(newShortcut)
      if (success) {
        configManager.set('globalShortcut', newShortcut)
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to update shortcut', err)
      return false
    }
  }

  return (
    <VStack spacing={24} style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
      <Text size="large" color="title">General</Text>

      {/* Appearance Section */}
      <VStack spacing={16} style={{ alignItems: 'stretch' }}>
        <Text size="medium" color="title">Appearance</Text>
        <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <VStack spacing={4} style={{ alignItems: 'flex-start', flex: 1 }}>
            <Text color="title">Theme</Text>
            <Text color="subtitle" size="small">Choose your preferred color theme</Text>
          </VStack>
          <div style={{ width: '200px' }}>
            <ThemeSwitcher />
          </div>
        </HStack>
      </VStack>

      <Divider />

      {/* Shortcuts Section */}
      <VStack spacing={16} style={{ alignItems: 'stretch' }}>
        <Text size="medium" color="title">Shortcuts</Text>
        <VStack spacing={8} style={{ alignItems: 'stretch' }}>
          <HStack style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <VStack spacing={4} style={{ alignItems: 'flex-start', flex: 1 }}>
              <Text color="title">Toggle App Visibility</Text>
              <Text color="subtitle" size="small">Global shortcut to show/hide the application</Text>
            </VStack>
          </HStack>
          <ShortcutRecorder
            value={shortcut}
            onChange={handleShortcutChange}
            onValidate={handleShortcutValidate}
          />
        </VStack>
      </VStack>

      <Divider />

      {/* About Section */}
      <VStack spacing={16} style={{ alignItems: 'stretch' }}>
        <Text size="medium" color="title">About</Text>
        <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <VStack spacing={4} style={{ alignItems: 'flex-start' }}>
            <Text color="title">Application Name</Text>
            <Text color="subtitle" size="small">Keyer - Keyboard launcher</Text>
          </VStack>
        </HStack>
        <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text color="title">Version</Text>
          <Text color="subtitle">{version || 'Loading...'}</Text>
        </HStack>
      </VStack>
    </VStack>
  )
}
