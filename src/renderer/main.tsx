import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'
import { initKeyerAPI } from './keyer-api'

// 暴露 React 给扩展使用
;(window as any).React = React
;(window as any).ReactDOM = ReactDOM
// 同时暴露为全局变量，供 JSX 转换使用
;(globalThis as any).React = React

// 注入 Keyer API
initKeyerAPI()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
