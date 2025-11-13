interface ScriptsTabProps {
  scripts: any[]
}

function ScriptsTab({ scripts }: ScriptsTabProps) {
  return (
    <div className="settings-section">
      {scripts.length === 0 ? (
        <p>没有找到脚本。请在 scripts 目录中添加脚本文件。</p>
      ) : (
        scripts.map(script => (
          <div key={script.id} className="script-item">
            <div className="script-info">
              <div className="script-name">{script.name}</div>
              <div className="script-desc">{script.desc}</div>
            </div>
            <div className="script-controls">
              <input
                type="text"
                className="command-shortcut"
                placeholder="快捷键"
              />
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span>启用</span>
              </label>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default ScriptsTab
