import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { viteSecurityPlugin } from './src/middleware/securityHeaders'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
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
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    sourcemap: false,
    cssCodeSplit: true,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn'],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          
          // Router
          if (id.includes('react-router-dom')) {
            return 'router';
          }
          
          // Firebase
          if (id.includes('firebase')) {
            return 'firebase';
          }
          
          // Charts library
          if (id.includes('recharts')) {
            return 'charts';
          }
          
          // GrapesJS (heavy design library)
          if (id.includes('grapesjs')) {
            return 'design-editor';
          }
          
          // DnD libraries
          if (id.includes('react-dnd')) {
            return 'dnd';
          }
          
          // UI and Icons
          if (id.includes('lucide-react') || id.includes('@headlessui')) {
            return 'ui-vendor';
          }
          
          // Form and validation libraries
          if (id.includes('zod') || id.includes('react-hook-form')) {
            return 'forms';
          }
          
          // Utils and date libraries
          if (id.includes('date-fns') || id.includes('dayjs') || id.includes('moment')) {
            return 'utils';
          }
          
          // Web Vitals
          if (id.includes('web-vitals')) {
            return 'performance';
          }
          
          // Node modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        chunkFileNames: (chunkInfo) => {
          return '[name]-[hash].js';
        },
        entryFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]',
      },
    },
    // Performance budgets and chunk size limits
    chunkSizeWarningLimit: 400, // 400KB warning limit
    assetsInlineLimit: 2048, // 2KB inline limit for better caching
  },
  server: {
    port: 3000,
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
  // Optimize dependencies
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
    exclude: ['@vite/client', '@vite/env']
  },
  // Enable tree shaking y configuración de seguridad
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})