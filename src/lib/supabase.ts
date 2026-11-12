import { createClient } from '@supabase/supabase-js'

/**
 * Next.js only inlines *literal* `process.env.NEXT_PUBLIC_*` reads into the
 * client bundle. A computed lookup such as `process.env[key]` survives to the
 * browser, where `process.env` is empty, so every value must be read by name.
 * The legacy `VITE_*` names are mapped onto these in `next.config.ts`.
 */
const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const configuredAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/**
 * Static prerendering imports this module, and `createClient` throws on an
 * empty URL. Unconfigured builds get an inert placeholder instead of failing;
 * any request it makes fails visibly at runtime.
 */
const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY = 'placeholder-anon-key'

function isUsableUrl(value: string): boolean {
  if (!value || value.includes('<')) return false
  return URL.canParse(value)
}

export const SUPABASE_URL = (isUsableUrl(configuredUrl) ? configuredUrl : PLACEHOLDER_URL).replace(/\/+$/, '')

const anonKey = configuredAnonKey && !configuredAnonKey.includes('<') ? configuredAnonKey : PLACEHOLDER_KEY

export const supabase = createClient(SUPABASE_URL, anonKey)
