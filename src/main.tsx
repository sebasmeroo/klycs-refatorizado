import React from 'react'
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime'
import { jsxDEV as _jsxDEV } from 'react/jsx-dev-runtime'
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

// Initialize critical services
initializeFirebaseCompatibility()
initializeMonitoring()
initializePerformanceMonitoring()
initializeDefaultFeatureFlags().catch(console.error)
autoFixOnLoad() // Auto-fix permisos de Firebase en páginas admin
initializeCache() // ✅ Inicializar cache persistente (reduce lecturas Firebase)

const reactRuntime = React as unknown as {
  jsx?: typeof _jsx
  jsxs?: typeof _jsxs
  jsxDEV?: typeof _jsxDEV
}

if (!reactRuntime.jsx) {
  reactRuntime.jsx = _jsx
  reactRuntime.jsxs = _jsxs
}

if (!reactRuntime.jsxDEV) {
  reactRuntime.jsxDEV = _jsxDEV
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {/* DevTools solo en desarrollo */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>,
)
