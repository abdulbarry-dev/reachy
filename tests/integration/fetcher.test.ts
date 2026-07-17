import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import { authFetcher } from '../../src/lib/fetcher'
import { supabase } from '../../src/lib/supabase'
import type { CampaignWithCounts } from '../../src/types'

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}))

function makeQb(result: object) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(result),
    then: vi.fn((onFulfilled: (v: object) => object) => Promise.resolve(result).then(onFulfilled)),
    catch: vi.fn((onRejected: (e: Error) => void) => Promise.resolve(result).catch(onRejected)),
  }
}

const fakeUser = { id: 'user-1', email: 'test@test.com' }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('authFetcher with mocked Supabase', () => {
  it('returns [] for null key', async () => {
    expect(await authFetcher(null)).toEqual([])
  })

  it('returns [] when unauthenticated', async () => {
    ;(supabase.auth.getUser as Mock).mockResolvedValue({ data: { user: null }, error: null })
    expect(await authFetcher('campaigns')).toEqual([])
  })

  it('throws on auth error', async () => {
    ;(supabase.auth.getUser as Mock).mockResolvedValue({ data: { user: null }, error: { message: 'Unauthenticated' } })
    await expect(authFetcher('campaigns')).rejects.toThrow('Unauthenticated')
  })

  describe('campaigns key', () => {
    it('returns empty when no campaigns', async () => {
      ;(supabase.auth.getUser as Mock).mockResolvedValue({ data: { user: fakeUser }, error: null })
      ;(supabase.from as Mock).mockReturnValue(makeQb({ data: [], error: null }))
      expect(await authFetcher<CampaignWithCounts[]>('campaigns')).toEqual([])
    })

    it('aggregates counts across campaigns', async () => {
      ;(supabase.auth.getUser as Mock).mockResolvedValue({ data: { user: fakeUser }, error: null })
      ;(supabase.from as Mock)
        .mockReturnValueOnce(makeQb({ data: [{ id: 'c1', name: 'A', user_id: 'user-1' }, { id: 'c2', name: 'B', user_id: 'user-1' }], error: null }))
        .mockReturnValueOnce(makeQb({ data: [{ campaign_id: 'c1', status: 'sent' }, { campaign_id: 'c2', status: 'failed' }, { campaign_id: 'c2', status: 'pending' }], error: null }))

      const result = await authFetcher<CampaignWithCounts[]>('campaigns')
      expect(result[0]).toMatchObject({ id: 'c1', total_recipients: 1, sent_recipients: 1 })
      expect(result[1]).toMatchObject({ id: 'c2', total_recipients: 2, failed_recipients: 1, pending_recipients: 1 })
    })
  })

  describe('email_accounts key', () => {
    it('returns accounts', async () => {
      ;(supabase.auth.getUser as Mock).mockResolvedValue({ data: { user: fakeUser }, error: null })
      ;(supabase.from as Mock).mockReturnValue(makeQb({ data: [{ id: 'ea1', from_email: 'a@b.com' }], error: null }))
      const result = await authFetcher<Record<string, unknown>[]>('email_accounts')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ id: 'ea1' })
    })
  })

  describe('[recipients, id] key', () => {
    it('queries with campaign_id', async () => {
      ;(supabase.auth.getUser as Mock).mockResolvedValue({ data: { user: fakeUser }, error: null })
      const qb = makeQb({ data: [{ id: 'r1', email: 'a@b.com' }], error: null })
      ;(supabase.from as Mock).mockReturnValue(qb)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await authFetcher<any[]>(['recipients', 'c1'] as any)
      expect(result).toHaveLength(1)
      expect(qb.eq).toHaveBeenCalledWith('campaign_id', 'c1')
    })
  })
})
