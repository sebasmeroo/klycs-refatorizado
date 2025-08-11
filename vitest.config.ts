import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'coverage/',
        '**/*.test.*',
        '**/*.spec.*'
      ]
    },
    // Add timeout for Firebase Rules tests
    testTimeout: 30000,
    // Include security tests
    include: [
      'src/**/*.{test,spec}.{js,ts,tsx}',
      'src/test/**/*.{test,spec}.{js,ts,tsx}'
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})