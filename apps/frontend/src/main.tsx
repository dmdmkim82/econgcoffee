import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Dynamic subset: 92개 unicode-range 청크 중 화면에 실제 쓰인 글자의
// 청크만 브라우저가 내려받는다 (기존 단일 2MB woff2 대체).
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import './index.css'
import App from './App.tsx'

const storedTheme = window.localStorage.getItem('ekong-coffee-theme')
document.documentElement.dataset.theme = storedTheme === 'light' ? 'light' : 'dark'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
