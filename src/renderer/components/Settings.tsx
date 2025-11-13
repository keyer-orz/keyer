import { useState, useEffect } from 'react'
import './Settings.css'
import { CommandManager } from '../../shared/Commands'
import { Panel } from 'keyerext'
import GeneralTab from '../settings/GeneralTab'
import ExtensionsTab from '../settings/ExtensionsTab'
import ScriptsTab from '../settings/ScriptsTab'
import type { TabType, InstalledExtension, InstallMessage } from '../settings/types'

function Settings() {
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [extensions, setExtensions] = useState<any[]>([])
  const [scripts, setScripts] = useState<any[]>([])
  const [config, setConfig] = useState<any>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [installedExtensions, setInstalledExtensions] = useState<InstalledExtension[]>([])
  const [installMessage, setInstallMessage] = useState<InstallMessage | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const { ipcRenderer } = window.require('electron')

      try {
        const commandManager = CommandManager.getInstance()
        const exts = commandManager.getExtensions()
        const scrs = commandManager.getScripts()
        const cfg = await ipcRenderer.invoke('get-config')
        const installed = await ipcRenderer.invoke('list-installed-extensions')

        console.log('Loaded extensions:', exts)
        console.log('Loaded scripts:', scrs)
        console.log('Loaded config:', cfg)
        console.log('Installed extensions:', installed)

        setExtensions(exts)
        setScripts(scrs)
        setConfig(cfg)
        setInstalledExtensions(installed || [])

        if (cfg && cfg.theme) {
          setTheme(cfg.theme)
        }
      } catch (error) {
        console.error('Failed to load settings data:', error)
      }
    }
    loadData()
  }, [])

  const handleThemeChange = async (newTheme: 'dark' | 'light') => {
    setTheme(newTheme)
    const { ipcRenderer } = window.require('electron')
    await ipcRenderer.invoke('update-config', { theme: newTheme })
  }

  const handleInstallExtension = async () => {
    const { ipcRenderer } = window.require('electron')

    try {
      const zipPath = await ipcRenderer.invoke('select-extension-file')

      if (!zipPath) {
        return
      }

      const result = await ipcRenderer.invoke('install-extension', zipPath)

      if (result.success) {
        setInstallMessage({
          type: 'success',
          text: `Extension "${result.extensionName}" installed successfully. Please restart the app to load it.`
        })

        const installed = await ipcRenderer.invoke('list-installed-extensions')
        setInstalledExtensions(installed || [])
      } else {
        setInstallMessage({
          type: 'error',
          text: `Installation failed: ${result.error}`
        })
      }

      setTimeout(() => setInstallMessage(null), 5000)
    } catch (error) {
      console.error('Failed to install extension:', error)
      setInstallMessage({
        type: 'error',
        text: `Installation failed: ${error}`
      })
      setTimeout(() => setInstallMessage(null), 5000)
    }
  }

  const handleUninstallExtension = async (extensionName: string) => {
    const { ipcRenderer } = window.require('electron')

    if (!confirm(`Are you sure you want to uninstall "${extensionName}"?`)) {
      return
    }

    try {
      const result = await ipcRenderer.invoke('uninstall-extension', extensionName)

      if (result.success) {
        setInstallMessage({
          type: 'success',
          text: `Extension "${extensionName}" uninstalled successfully. Please restart the app.`
        })

        const installed = await ipcRenderer.invoke('list-installed-extensions')
        setInstalledExtensions(installed || [])
      } else {
        setInstallMessage({
          type: 'error',
          text: `Uninstall failed: ${result.error}`
        })
      }

      setTimeout(() => setInstallMessage(null), 5000)
    } catch (error) {
      console.error('Failed to uninstall extension:', error)
      setInstallMessage({
        type: 'error',
        text: `Uninstall failed: ${error}`
      })
      setTimeout(() => setInstallMessage(null), 5000)
    }
  }

  return (
    <Panel>
      <div className="settings-header">
        <div className="settings-tabs">
          <div
            className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <span className="tab-icon">⚙️</span>
            General
          </div>
          <div
            className={`settings-tab ${activeTab === 'extensions' ? 'active' : ''}`}
            onClick={() => setActiveTab('extensions')}
          >
            <span className="tab-icon">🧩</span>
            Extensions
          </div>
          <div
            className={`settings-tab ${activeTab === 'scripts' ? 'active' : ''}`}
            onClick={() => setActiveTab('scripts')}
          >
            <span className="tab-icon">📜</span>
            Scripts
          </div>
        </div>
      </div>

      <div className="settings-content">
        {activeTab === 'general' && (
          <GeneralTab
            config={config}
            theme={theme}
            onThemeChange={handleThemeChange}
          />
        )}

        {activeTab === 'extensions' && (
          <ExtensionsTab
            extensions={extensions}
            installedExtensions={installedExtensions}
            installMessage={installMessage}
            onInstall={handleInstallExtension}
            onUninstall={handleUninstallExtension}
          />
        )}

        {activeTab === 'scripts' && (
          <ScriptsTab scripts={scripts} />
        )}
      </div>
    </Panel>
  )
}

export default Settings
