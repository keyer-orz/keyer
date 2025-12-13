import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import * as fs from 'fs';
import Module from 'module';
import path from 'path';
import { Keyer } from './keyer';
import * as Keyerext from 'keyerext';
import './styles/App.css'

function setupGlobalModuleInterceptor() {
  const originalLoad = (Module as any)._load
    ; (Module as any)._load = function (request: string, parent: any) {
      if (request !== 'react' && request !== 'react/jsx-runtime' && request !== 'keyerext') {
        return originalLoad.apply(this, arguments)
      }

      const filename = parent?.filename
      if (!filename) {
        return originalLoad.apply(this, arguments)
      }
      if (request === 'react') return React
      if (request === 'react/jsx-runtime') return require('react/jsx-runtime')
      if (request === 'keyerext') {
        return {
          ...Keyerext,
          Keyer
        }
      }

      return originalLoad.apply(this, arguments)
    }
}

export function loadModule(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return null
  }

  console.log("LoadModule filePath:", filePath)

  const pluginCode = fs.readFileSync(filePath, 'utf-8')
  const pluginModule = new Module(filePath, module)

  pluginModule.paths = (Module as any)._nodeModulePaths(path.dirname(filePath))
  pluginModule.filename = filePath

  pluginModule.require = function (id: string) {
    return (Module as any)._load(id, pluginModule, false)
  } as any

  // @ts-ignore - _compile 是内部 API
  pluginModule._compile(pluginCode, filePath)
  return pluginModule
}
setupGlobalModuleInterceptor()

function App() {
  const [Component, setComponent] = useState<React.ComponentType | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 从 URL 参数获取 script 路径
    const urlParams = new URLSearchParams(window.location.search)
    const scriptPath = urlParams.get('script')

    if (!scriptPath) {
      setError('No script path provided')
      return
    }

    // 动态加载脚本
    const loadScript = async () => {
      try {
        console.log('Loading command script:', scriptPath)
        const module = loadModule(decodeURIComponent(scriptPath))
        const LoadedComponent = module?.exports.default
        if (LoadedComponent) {
          setComponent(() => LoadedComponent)
        } else {
          setError('No component found in script')
        }
      } catch (err) {
        console.error('Failed to load command script:', err)
        setError(`Failed to load script: ${err}`)
      }
    }

    loadScript()
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
        <p>Loading command...</p>
      </div>
    )
  }

  return <Component />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

