import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeFirebaseCompatibility } from './utils/firebaseStorageConfig'
import { initializeMonitoring } from './services/monitoring'
import { initializePerformanceMonitoring } from './utils/performance'
import { initializeDefaultFeatureFlags } from './utils/initializeFeatureFlags'
import { autoFixOnLoad } from './utils/fixFirebasePermissions'
import './utils/pwaUtils' // Initialize PWA service

// Initialize critical services
initializeFirebaseCompatibility()
initializeMonitoring()
initializePerformanceMonitoring()
initializeDefaultFeatureFlags().catch(console.error)
autoFixOnLoad() // Auto-fix permisos de Firebase en páginas admin

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)