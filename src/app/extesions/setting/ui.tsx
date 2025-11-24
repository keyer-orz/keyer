import { useState } from 'react'

export default function Setting() {
    const [count, setCount] = useState(0)

    return (
        <div>
            <h1>Settings Page</h1>
            <p>Settings Counter: {count}</p>
            <button onClick={() => setCount(count + 1)}>
                Increment Settings Counter
            </button>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '20px' }}>
                Press ESC to go back to Main page
            </p>
            <p style={{ fontSize: '12px', color: '#999' }}>
                Tip: Increment this counter, go back to Main, then come back here.
                This counter should keep its value too!
            </p>
        </div>
    )
}