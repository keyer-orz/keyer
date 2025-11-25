import './styles/App.css'
import { useNavigation } from 'keyerext'
import { NavigationProvider } from './contexts/NavigationContext'
import { registerExtensions } from './extensions'

registerExtensions()

function AppContent() {
  const { currentPage, stack } = useNavigation()

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
