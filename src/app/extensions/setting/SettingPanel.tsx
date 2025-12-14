import React, { useState } from 'react'
import { HStack, Text, List, WindowSize } from 'keyerext'
import { ExtensionsSettings } from './ExtensionsSettings'
import { GeneralSettings } from './GeneralSettings'
import { Keyer } from '@/app/keyer'

export function activeSetting() {
    Keyer.command.registerApp({
        name: "setting",
        title: "Setting",
        desc: "Open the setting page",
        icon: "⚙️",
    }, () => {
        return {
            component: <SettingPanel />,
            size: WindowSize.Large
        }
    })
}

interface SettingsSection {
    id: string
    title: string
    component: React.ReactNode
}

const SETTINGS_SECTIONS: SettingsSection[] = [
    {
        id: 'general',
        title: 'General',
        component: <GeneralSettings />
    },
    {
        id: 'extensions',
        title: 'Extensions',
        component: <ExtensionsSettings />
    }
]

export default function SettingPanel() {
    const [selectedSection, setSelectedSection] = useState<string>('general')

    const items = SETTINGS_SECTIONS.map(section => ({
        id: section.id,
        data: section
    }))

    const currentSection = SETTINGS_SECTIONS.find(s => s.id === selectedSection)

    return (
        <HStack>
            {/* Sidebar */}
            <div style={{
                width: '140px',
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <List
                    items={items}
                    selectedId={selectedSection}
                    onClick={(id) => setSelectedSection(id)}
                    onSelect={(id) => setSelectedSection(id)}
                    renderItem={(item) => (
                        <HStack>
                            <Text>{item.data.title}</Text>
                        </HStack>
                    )}
                />
            </div>

            {/* Content */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {currentSection?.component}
            </div>
        </HStack>
    )
}
