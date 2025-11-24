import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onMessage((msg: string) => {
        setMessage(msg)
      })
    }
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <h1>Electron + React + Vite + TypeScript</h1>
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
        </div>
        {message && (
          <p className="message">
            Message from main process: {message}
          </p>
        )}
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </header>
    </div>
  )
}

export default App
