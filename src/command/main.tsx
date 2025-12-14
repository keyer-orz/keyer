import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import path from 'path';
import '../app/styles/App.css'
import { ipcRenderer } from 'electron';
import { CommandData } from '@/shared/main-api';
import { ExtensionConfig, extensionMap, loadModule, setupGlobalModuleInterceptor } from '@/shared/loader';
import { configManager } from '@/app/utils/config';
import { ExtensionProvider } from '@/app/contexts/ExtensionContext';

setupGlobalModuleInterceptor()

function App() {
  const [Component, setComponent] = useState<React.ComponentType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [command, setCommand] = useState<CommandData | null>(null)

  useEffect(() => {
    const savedTheme = configManager.get('theme')
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme)
    }

    ipcRenderer.on('command.init', (_, command: CommandData) => {
      try {
        console.log('command.init', command)
        extensionMap.set(command.ext.dir, new ExtensionConfig({
          ...command.ext,
        }))
        setCommand(command)
        const module = loadModule(path.join(command.ext.dir, 'dist', `${command.name}.js`))
        const LoadedComponent = module?.exports.default
        if (LoadedComponent) {
          setComponent(() => LoadedComponent)
        } else {
          setError('No component found in script')
        }
      } catch (err) {
        setError(`Failed to load script: ${err}`)
      }
    })
  }, [])

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    )
  }

  if (!Component) {
    return (
      <div style={{ padding: '20px' }}>
        <p>Loading...</p>
      </div>
    )
  }

  return <ExtensionProvider ctx={command?.ext!}>
    <Component />
  </ExtensionProvider>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

