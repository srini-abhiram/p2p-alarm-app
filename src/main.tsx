import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PeerProvider } from './context/PeerContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PeerProvider>
      <App />
    </PeerProvider>
  </StrictMode>,
)
