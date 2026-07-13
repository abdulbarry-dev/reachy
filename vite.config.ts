import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('xlsx')) return 'vendor-xlsx'
          if (id.includes('papaparse')) return 'vendor-papaparse'
          return undefined
        },
      },
    },
  },
})
