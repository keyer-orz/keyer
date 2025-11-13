import { useState, useEffect } from 'react'

function GeneralTab() {
  const [config, setConfig] = useState<any>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      const { ipcRenderer } = window.require('electron')

      try {
        const cfg = await ipcRenderer.invoke('get-config')
        setConfig(cfg)

        if (cfg && cfg.theme) {
          setTheme(cfg.theme)
        }
      } catch (error) {
        console.error('Failed to load config:', error)
      }
    }
    loadData()
  }, [])

  const handleThemeChange = async (newTheme: 'dark' | 'light') => {
    setTheme(newTheme)
    const { ipcRenderer } = window.require('electron')
    await ipcRenderer.invoke('update-config', { theme: newTheme })
  }

  return (
    <div className="settings-section">
      <div className="setting-item">
        <div className="setting-label">主题</div>
        <div className="setting-control">
          <select
            className="setting-select"
            value={theme}
            onChange={(e) => handleThemeChange(e.target.value as 'dark' | 'light')}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
      </div>

      <div className="setting-item">
        <div className="setting-label">全局快捷键</div>
        <div className="setting-control">
          <input
            type="text"
            className="setting-input"
            value={config?.globalShortcut || 'Shift+Space'}
            readOnly
          />
        </div>
      </div>
    </div>
  )
}

export default GeneralTab
