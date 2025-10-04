import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { viteSecurityPlugin } from './src/middleware/securityHeaders'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode, command }) => ({
  plugins: [
    react({
      jsxRuntime: command === 'build' ? 'classic' : 'automatic',
      jsxImportSource: 'react',
      development: command === 'serve'
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
      // Fix React useState undefined error - Force single React instance
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom']
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    sourcemap: false,
    cssCodeSplit: true,
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.warn', 'console.info'] : [],
      },
    },
    rollupOptions: {
      output: {
        chunkFileNames: '[name]-[hash].js',
        entryFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]',
        // ✅ Code splitting optimizado - Separar vendors grandes
        manualChunks: (id) => {
          // React core
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
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
