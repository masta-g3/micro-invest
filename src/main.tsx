import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AppProvider } from './context/AppProvider'
import { ToastProvider } from './context/ToastProvider'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AppProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </AppProvider>,
)