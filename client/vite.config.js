import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration for the React frontend.
// The "proxy" section forwards /api requests to our Express backend.
// This means the React app can call /api/... without worrying about CORS during development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
