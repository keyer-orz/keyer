import { useEffect, useState, useRef } from 'react'
import './styles/App.css'
import { useNavigation } from 'keyerext'
import { NavigationProvider } from './contexts/NavigationContext'
import { registerExtensions } from './extensions'

function AppContent() {
  const { currentPage, stack, push } = useNavigation()
  const [isReady, setIsReady] = useState(false)
  const [mainPushed, setMainPushed] = useState(false)

  // 保证 registerExtensions 只执行一次
  const hasRegistered = useRef(false)
  useEffect(() => {
    if (!hasRegistered.current) {
      hasRegistered.current = true
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
        height: '100vh',
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
    <div className="main">
      {stack.map(item => (
        <div
          key={item.pageName}
          style={{ display: item === currentPage ? 'block' : 'none' }}
        >
          {item.element}
        </div>
      ))}
    </div>
  )
}

export default function App() {
  return (
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
  )
}
