import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { getEdgeFunctionUrl, invokeEdgeFunction } from '../../src/lib/edge-functions'
import { supabase } from '../../src/lib/supabase'

vi.mock('../../src/lib/supabase', () => ({
  supabase: { auth: { getSession: vi.fn() } },
}))

const SESSION_TOKEN = 'access-token-123'

function sessionResponse(token: string | null, error: { message: string } | null = null) {
  return { data: { session: token ? { access_token: token } : null }, error }
}

function response(body: string, init: { ok?: boolean } = {}) {
  return {
    ok: init.ok ?? true,
    json: vi.fn().mockImplementation(async () => JSON.parse(body || 'null')),
    text: vi.fn().mockResolvedValue(body),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('VITE_SUPABASE_URL', 'https://abc.supabase.co')
  ;(supabase.auth.getSession as Mock).mockResolvedValue(sessionResponse(SESSION_TOKEN))
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('invokeEdgeFunction', () => {
  it('posts to the function URL with the session token and JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response('{"campaignId":"c1"}'))
    vi.stubGlobal('fetch', fetchMock)

    await invokeEdgeFunction('create-campaign', { name: 'Q1' }, 'Failed')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://abc.supabase.co/functions/v1/create-campaign',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SESSION_TOKEN}`,
        },
        body: JSON.stringify({ name: 'Q1' }),
      }),
    )
  })

  it('returns the parsed response body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response('{"campaignId":"c1"}')))

    await expect(invokeEdgeFunction('create-campaign', {}, 'Failed')).resolves.toEqual({
      campaignId: 'c1',
    })
  })

  it('resolves with undefined when the function returns no body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response('')))

    await expect(invokeEdgeFunction('start-campaign', {}, 'Failed')).resolves.toBeUndefined()
  })

  it('refuses to call fetch without a session', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    ;(supabase.auth.getSession as Mock).mockResolvedValue(sessionResponse(null))

    await expect(invokeEdgeFunction('start-campaign', {}, 'Failed')).rejects.toThrow('Not authenticated')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('surfaces a session read error', async () => {
    ;(supabase.auth.getSession as Mock).mockResolvedValue(
      sessionResponse(null, { message: 'session storage unavailable' }),
    )

    await expect(invokeEdgeFunction('start-campaign', {}, 'Failed')).rejects.toThrow(
      'session storage unavailable',
    )
  })

  it('surfaces the server error message from a JSON body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response('{"error":"SMTP authentication failed"}', { ok: false })),
    )

    await expect(invokeEdgeFunction('connect-email-account', {}, 'Connection failed')).rejects.toThrow(
      'SMTP authentication failed',
    )
  })

  it('falls back to the caller message when the error body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockRejectedValue(new Error('not json')),
        text: vi.fn().mockResolvedValue('<html>502</html>'),
      }),
    )

    await expect(invokeEdgeFunction('connect-email-account', {}, 'Connection failed')).rejects.toThrow(
      'Connection failed',
    )
  })

  it('falls back when the error body has no error field', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response('{"message":"nope"}', { ok: false })))

    await expect(invokeEdgeFunction('connect-email-account', {}, 'Connection failed')).rejects.toThrow(
      'Connection failed',
    )
  })

  it('fails loudly when a successful response is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response('<html>oops</html>')))

    await expect(invokeEdgeFunction('start-campaign', {}, 'Failed to start')).rejects.toThrow(
      'Failed to start',
    )
  })
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
