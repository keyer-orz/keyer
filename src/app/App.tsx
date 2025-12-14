import { useEffect, useState, useRef } from 'react'
import { ToastContainer, useNavigation } from 'keyerext'
import { NavigationProvider } from './contexts/NavigationContext'
import { ExtensionProvider } from './contexts/ExtensionContext'
import { registerExtensions } from './managers/ExtensionLoader'
import { configManager } from './utils/config'
import { toastManager } from './keyer/toast'

function AppContent() {
  const { currentPage, stack, push } = useNavigation()
  const [isReady, setIsReady] = useState(false)
  const [mainPushed, setMainPushed] = useState(false)
  const [toasts, setToasts] = useState<any[]>([])

  useEffect(() => {
    toastManager.subscribe(setToasts)
  }, [])

  // 保证 registerExtensions 只执行一次
  const hasRegistered = useRef(false)
  useEffect(() => {
    if (!hasRegistered.current) {
      hasRegistered.current = true

      const savedTheme = configManager.get('theme')
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme)
      }

      registerExtensions().then(() => {
        console.log('✅ Extensions registered, app is ready')
        setIsReady(true)
      })
    }
  }, [])

  // 扩展注册完成后 push 主页面
  useEffect(() => {
    if (isReady && !mainPushed && stack.length === 0) {
      console.log('📌 Pushing main page')
      push('@system#main')
      setMainPushed(true)
    }
  }, [isReady, mainPushed, push, stack.length])

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
      {stack.map((item, index) => {
        return (
          <div
            className="main"
            key={`${item.pageName}-${index}`}
            style={{ display: item === currentPage ? 'flex' : 'none' }}
          >
            <ExtensionProvider ctx={item.ctx!}>
              {item.element}
            </ExtensionProvider>
          </div>
        )
      })}
      <ToastContainer toasts={toasts} onClose={(id) => toastManager.close(id)} />
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
