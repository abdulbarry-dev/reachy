import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL || ''
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

function sanitizeSupabaseUrl(url: string): string {
  if (!url || url.includes('<your-project-ref>')) {
    return 'https://placeholder.supabase.co'
  }
  try {
    new URL(url)
    return url
  } catch {
    return 'https://placeholder.supabase.co'
  }
}

const supabaseUrl = sanitizeSupabaseUrl(rawUrl)
const supabaseAnonKey =
  rawKey && !rawKey.includes('<your-anon-key>') ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
