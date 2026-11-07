import { createRoot } from 'react-dom/client'
import { lazy, Suspense } from 'react'
import App from './App'
import './style.css'

const Editor = import.meta.env.DEV && window.location.pathname === '/editor' ? lazy(() => import('./Editor')) : null

createRoot(document.getElementById('root')!).render(Editor ? <Suspense fallback={<p>Opening editor…</p>}><Editor /></Suspense> : <App />)
