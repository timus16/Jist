import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AppRouter } from './router'
import './styles/index.css'
import { registerSW } from 'virtual:pwa-register'
registerSW({ immediate: true })

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root not found')

createRoot(container).render(
  <HashRouter>
    <AppRouter />
  </HashRouter>
)
