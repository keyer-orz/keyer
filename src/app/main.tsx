import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@/app/styles/App.css'
import { Keyer } from './keyer'
import { setKeyer } from 'keyerext'

console.log("init keyer")
setKeyer(Keyer)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
