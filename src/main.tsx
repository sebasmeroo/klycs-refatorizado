import './utils/reactSingleton'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/queryClient'
import App from './App.tsx'
import './index.css'
import { initializeFirebaseCompatibility } from './utils/firebaseStorageConfig'
import { initializeMonitoring } from './services/monitoring'
import { initializePerformanceMonitoring } from './utils/performance'
import { initializeDefaultFeatureFlags } from './utils/initializeFeatureFlags'
import { autoFixOnLoad } from './utils/fixFirebasePermissions'
import { initializeCache } from './utils/persistentCache'
import './utils/pwaUtils' // Initialize PWA service
import './utils/costMonitoring' // Initialize cost monitoring (firebaseStats() command)

// Initialize services
try {
  initializeFirebaseCompatibility()
  initializeMonitoring()
  initializePerformanceMonitoring()
  initializeDefaultFeatureFlags().catch((err) => {
    console.error('Feature flags initialization failed', err)
  })
  autoFixOnLoad()
  initializeCache()
} catch (error) {
  console.error('Service initialization failed', error)
}

// Render app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>
)
