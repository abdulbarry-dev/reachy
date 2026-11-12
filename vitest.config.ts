import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    // Unit tests never talk to Supabase: they mock their own data hooks. These
    // placeholders keep src/lib/supabase.ts importable without a real project,
    // and stop a developer's .env from leaking production credentials into a run.
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
})
