import { useState } from 'react'
import { useNavigation } from '../../contexts/NavigationContext'

export default function Main() {
    const { push } = useNavigation()
    const [count, setCount] = useState(0)

    return (
        <div>
            <h1>Main Page</h1>
            <p>Counter: {count}</p>
            <button onClick={() => setCount(count + 1)}>
                Increment Counter
            </button>
            <br />
            <br />
            <button onClick={() => push('@sysetem#setting')}>
                Go to Settings
            </button>
            <br />
            <br />
            <button onClick={() => push('@sysetem#ui')}>
                Go to UI Demo
            </button>
            <p style={{ fontSize: '12px', color: '#666' }}>
                Tip: Increment the counter, go to settings, then press ESC to come back.
                The counter should keep its value!
            </p>
        </div>
    )
}