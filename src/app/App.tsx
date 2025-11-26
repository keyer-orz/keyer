import { useEffect, useState, useRef } from 'react'
import './styles/App.css'
import { useNavigation, setKeyer } from 'keyerext'
import { NavigationProvider } from './contexts/NavigationContext'
import { registerExtensions } from './extensions'
import { configManager } from './utils/config'
import { KeyerInstance } from './keyer'

function AppContent() {
  const { currentPage, stack, push } = useNavigation()
  const [isReady, setIsReady] = useState(false)
  const [mainPushed, setMainPushed] = useState(false)

  // 保证 registerExtensions 只执行一次
  const hasRegistered = useRef(false)
  useEffect(() => {
    if (!hasRegistered.current) {
      hasRegistered.current = true

      // 1. 注入 Keyer 核心能力
      setKeyer(KeyerInstance)
      console.log('✅ Keyer instance injected')

      // 2. 恢复保存的主题
      const savedTheme = configManager.get('theme')
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme)
      }

      // 3. 注册扩展
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
      {stack.map(item => (
        <div
          className="main"
          key={item.pageName}
          style={{ display: item === currentPage ? 'flex' : 'none' }}
        >
          {item.element}
        </div>
      ))}
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
