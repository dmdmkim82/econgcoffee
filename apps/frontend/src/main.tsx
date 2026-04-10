import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const storedTheme = window.localStorage.getItem('ekong-coffee-theme')
document.documentElement.dataset.theme = storedTheme === 'light' ? 'light' : 'dark'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
