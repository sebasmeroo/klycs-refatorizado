import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { viteSecurityPlugin } from './src/middleware/securityHeaders'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode, command }) => ({
  plugins: [
    react({
      // Use automatic JSX runtime (React 17+)
      jsxRuntime: 'automatic',
      // Don't transform JSX in node_modules
      exclude: /node_modules/,
      // Babel config
      babel: {
        plugins: [],
        babelrc: false,
        configFile: false,
      },
    }),
    viteSecurityPlugin(), // Plugin de headers de seguridad
    // Bundle analyzer (only in build mode)
    ...(process.env.ANALYZE ? [visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })] : [])
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom']
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    sourcemap: false, // Disable sourcemaps in production
    cssCodeSplit: true,
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for debugging in production
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log'] : [], // Only remove console.log, keep error/warn
      },
    },
    rollupOptions: {
      output: {
        chunkFileNames: '[name]-[hash].js',
        entryFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]',
        // ✅ Code splitting optimizado - Separar vendors grandes
        manualChunks: (id) => {
          // React core - CRITICAL: Keep React and ReactDOM together
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // React internals (jsx-runtime, etc) - MUST be with React core
          if (id.includes('node_modules/react') &&
              (id.includes('jsx-runtime') || id.includes('jsx-dev-runtime'))) {
            return 'react-vendor';
          }
          // Scheduler (used by React)
          if (id.includes('node_modules/scheduler')) {
            return 'react-vendor';
          }
          // Firebase (bundle grande)
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'firebase-vendor';
          }
          // Tanstack Query
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'query-vendor';
          }
          // Lucide icons (bundle grande)
          if (id.includes('node_modules/lucide-react')) {
            return 'icons-vendor';
          }
          // Framer Motion
          if (id.includes('node_modules/framer-motion')) {
            return 'motion-vendor';
          }
          // Resto de node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      }
    },
    // Performance budgets and chunk size limits
    chunkSizeWarningLimit: 500, // 500KB warning limit
    assetsInlineLimit: 4096, // 4KB inline limit (optimizado)
  },
  server: {
    port: 5000,
    host: true,
    // Configuración de seguridad del servidor de desarrollo
    headers: {
      // Headers básicos de seguridad para desarrollo
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      // Headers para compatibilidad con Firebase Storage
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cross-Origin-Opener-Policy': 'unsafe-none',
    }
  },
  // Optimize dependencies - Critical for React context issue
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'firebase/app',
      'firebase/auth', 
      'firebase/firestore',
      'firebase/storage',
      'lucide-react'
    ],
    exclude: ['@vite/client', '@vite/env'],
    force: true,
    esbuildOptions: {
      // Ensure React is properly bundled
      external: [],
      define: {
        global: 'globalThis'
      }
    }
  },
  // Enable tree shaking y configuración de seguridad
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
}))
