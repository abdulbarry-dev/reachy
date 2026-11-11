import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Ignore audit artifacts so writing a Lighthouse report doesn't trigger a
      // page reload while a dev-server audit is in progress.
      ignored: ['**/reports/**', '**/.lighthouse/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
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
