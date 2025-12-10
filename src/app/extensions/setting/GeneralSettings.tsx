import { useState, useEffect } from 'react'
import { VStack, HStack, Text, Divider } from 'keyerext'
import { ShortcutRecorder } from '@/app/components/ShortcutRecorder'
import { ThemeSwitcher } from '@/app/components/ThemeSwitcher'
import { configManager } from '@/app/utils/config'
import { getAppVersion, getAppName, getAppDescription } from '@/app/utils/app'
import { Keyer } from '@/app/keyer'

export function GeneralSettings() {
  const [shortcut, setShortcut] = useState('')

  useEffect(() => {
    // 初始化快捷键
    const currentShortcut = configManager.get('globalShortcut')
    setShortcut(currentShortcut || '')
  }, [])

  const handleShortcutChange = (newShortcut: string) => {
    setShortcut(newShortcut)
    configManager.set('globalShortcut', newShortcut)
    // 通知主线程刷新快捷键注册
    Keyer.shortcuts.registerApp(newShortcut)
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
            <Text color="subtitle" size="small">{getAppName()}</Text>
          </VStack>
        </HStack>
        {getAppDescription() && (
          <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <VStack spacing={4} style={{ alignItems: 'flex-start' }}>
              <Text color="title">Description</Text>
              <Text color="subtitle" size="small">{getAppDescription()}</Text>
            </VStack>
          </HStack>
        )}
        <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text color="title">Version</Text>
          <Text color="subtitle">{getAppVersion()}</Text>
        </HStack>
      </VStack>
    </VStack>
  )
}
