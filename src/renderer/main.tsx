import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ChakraProvider } from 'keyerext'
import system from './theme'
import '@/styles/index.css'
import { initKeyerAPI } from './keyer-api'

// 注入 Keyer API
initKeyerAPI()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider value={system}>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
)
