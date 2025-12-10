import { useEffect, useState, useRef } from 'react'
import './styles/App.css'
import { Keyer, useNavigation } from 'keyerext'
import { NavigationProvider } from './contexts/NavigationContext'
import { ExtensionProvider } from './contexts/ExtensionContext'
import { registerExtensions } from './managers/ExtensionLoader'
import { configManager } from './utils/config'

function AppContent() {
  const { currentPage, stack, push } = useNavigation()
  const [isReady, setIsReady] = useState(false)
  const [mainPushed, setMainPushed] = useState(false)

  // 保证 registerExtensions 只执行一次
  const hasRegistered = useRef(false)
  useEffect(() => {
    if (!hasRegistered.current) {
      hasRegistered.current = true

      const savedTheme = configManager.get('theme')
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme)
      }

      Keyer.shortcuts.registerApp(configManager.get('globalShortcut'))

      registerExtensions().then(() => {
        console.log('✅ Extensions registered, app is ready')
        setIsReady(true)
      })
    }
  }, [])

  // 扩展注册完成后 push 主页面
  useEffect(() => {
    if (isReady && !mainPushed) {
      push('@system#main')
      setMainPushed(true)
    }
  }, [isReady, mainPushed, push])

  if (!isReady) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--color-title)'
      }}>
        Loading extensions...
      </div>
    )
  }

  if (!currentPage) {
    console.log('🚫 App hidden')
    return null
  }

  console.log('🎨 Render:', currentPage.pageName)

  return (
    <>
      {stack.map(item => {
        return (
          <div
            className="main"
            key={item.pageName}
            style={{ display: item === currentPage ? 'flex' : 'none' }}
          >
            <ExtensionProvider ctx={item.ctx!}>
              {item.element}
            </ExtensionProvider>
          </div>
        )
      })}
    </>
  )
}

export default function App() {
  return (
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
  )
}
