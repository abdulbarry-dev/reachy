import { describe, it, expect, vi, afterEach } from 'vitest'
import { getEdgeFunctionUrl } from '../../src/lib/edge-functions'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getEdgeFunctionUrl', () => {
  it('builds URL from env', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://abc.supabase.co')
    expect(getEdgeFunctionUrl('create-campaign')).toBe('https://abc.supabase.co/functions/v1/create-campaign')
  })

  it('strips trailing slash', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://abc.supabase.co/')
    expect(getEdgeFunctionUrl('test-fn')).toBe('https://abc.supabase.co/functions/v1/test-fn')
  })

  it('handles missing env', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    expect(getEdgeFunctionUrl('fn')).toBe('/functions/v1/fn')
  })
})
