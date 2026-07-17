import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { SWRConfig } from 'swr'
import { Analytics } from '@vercel/analytics/react'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './index.css'
import App from './App.tsx'
import { store } from './store'
import { ToastProvider } from './components/ToastProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <SWRConfig
          value={{
            provider: () => new Map(),
            dedupingInterval: 2000,
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
          }}
        >
          <ToastProvider>
            <App />
            <Analytics />
          </ToastProvider>
        </SWRConfig>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
