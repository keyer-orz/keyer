interface GeneralTabProps {
  config: any
  theme: 'dark' | 'light'
  onThemeChange: (theme: 'dark' | 'light') => void
}

function GeneralTab({ config, theme, onThemeChange }: GeneralTabProps) {
  return (
    <div className="settings-section">
      <div className="setting-item">
        <div className="setting-label">主题</div>
        <div className="setting-control">
          <select
            className="setting-select"
            value={theme}
            onChange={(e) => onThemeChange(e.target.value as 'dark' | 'light')}
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
