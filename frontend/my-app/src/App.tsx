import { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Login from './component/user/login'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <Login/>
      </div>
    
    </>
  )
}

export default App
