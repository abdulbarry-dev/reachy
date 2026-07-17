import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('papaparse')) return 'vendor-papaparse'
          if (id.includes('read-excel-file')) return 'vendor-excel'
          if (id.includes('@supabase/supabase-js')) return 'vendor-supabase'
          if (id.includes('node_modules')) {
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router-dom') ||
              id.includes('react-redux') ||
              id.includes('@reduxjs/toolkit')
            ) {
              return 'vendor-react'
            }
            if (
              id.includes('framer-motion') ||
              id.includes('react-bootstrap') ||
              id.includes('bootstrap')
            ) {
              return 'vendor-ui'
            }
          }
          return undefined
        },
      },
    },
  },
})
