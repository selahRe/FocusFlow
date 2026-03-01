import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: 'src/test/setupTests.js',
    globals: true,
    include: ['src/test/**/*.test.{js,jsx}']
  }
});