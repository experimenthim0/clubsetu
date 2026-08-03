import React,{ StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'
import { registerServiceWorker } from './lib/swRegistration.js'

// Register Service Worker with update detection and version management
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    registerServiceWorker();
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)

