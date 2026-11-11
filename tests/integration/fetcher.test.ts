import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import {
  aggregateRecipientCounts,
  fetchCampaignRecipients,
  fetchCampaigns,
  fetchEmailAccounts,
} from '../../src/lib/fetcher'
import { supabase } from '../../src/lib/supabase'

vi.mock('../../src/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

/**
 * Minimal chainable PostgREST builder. It is thenable at every step, like the
 * real one: some queries end on `order()`, others on `in()`.
 */
function makeQueryBuilder(result: { data: unknown; error: { message: string } | null }) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(result),
    then: vi.fn((onFulfilled: (value: typeof result) => unknown) =>
      Promise.resolve(result).then(onFulfilled),
    ),
    catch: vi.fn((onRejected: (reason: unknown) => unknown) =>
      Promise.resolve(result).catch(onRejected),
    ),
  }
}

const USER_ID = 'user-1'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('aggregateRecipientCounts', () => {
  it('seeds a zeroed bucket for every requested campaign', () => {
    const counts = aggregateRecipientCounts(['c1', 'c2'], [])
    expect(counts).toEqual({
      c1: { total: 0, sent: 0, failed: 0, pending: 0 },
      c2: { total: 0, sent: 0, failed: 0, pending: 0 },
    })
  })

  it('buckets sent, failed and pending, treating null status as pending', () => {
    const counts = aggregateRecipientCounts(['c1'], [
      { campaign_id: 'c1', status: 'sent' },
      { campaign_id: 'c1', status: 'failed' },
      { campaign_id: 'c1', status: 'pending' },
      { campaign_id: 'c1', status: null },
      { campaign_id: 'c1', status: 'sending' },
    ])
    expect(counts.c1).toEqual({ total: 5, sent: 1, failed: 1, pending: 3 })
  })

  it('ignores rows that belong to a campaign the caller did not ask for', () => {
    const counts = aggregateRecipientCounts(['c1'], [
      { campaign_id: 'c1', status: 'sent' },
      { campaign_id: 'stranger', status: 'sent' },
    ])
    expect(counts).toEqual({ c1: { total: 1, sent: 1, failed: 0, pending: 0 } })
  })

  it('does not treat inherited object keys as a bucket', () => {
    const counts = aggregateRecipientCounts(['c1'], [{ campaign_id: 'toString', status: 'sent' }])
    expect(counts).toEqual({ c1: { total: 0, sent: 0, failed: 0, pending: 0 } })
  })
})

describe('fetchCampaigns', () => {
  it('returns [] without a counts query when the user has no campaigns', async () => {
    const builder = makeQueryBuilder({ data: [], error: null })
    ;(supabase.from as Mock).mockReturnValue(builder)

    expect(await fetchCampaigns(USER_ID)).toEqual([])
    expect(supabase.from).toHaveBeenCalledTimes(1)
  })

  it('scopes to the user, newest first, and attaches aggregated counts', async () => {
    const campaigns = makeQueryBuilder({
      data: [{ id: 'c1', name: 'A' }, { id: 'c2', name: 'B' }],
      error: null,
    })
    const recipients = makeQueryBuilder({
      data: [
        { campaign_id: 'c1', status: 'sent' },
        { campaign_id: 'c2', status: 'failed' },
        { campaign_id: 'c2', status: 'pending' },
      ],
      error: null,
    })
    ;(supabase.from as Mock).mockReturnValueOnce(campaigns).mockReturnValueOnce(recipients)

    const result = await fetchCampaigns(USER_ID)

    expect(campaigns.eq).toHaveBeenCalledWith('user_id', USER_ID)
    expect(campaigns.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(recipients.in).toHaveBeenCalledWith('campaign_id', ['c1', 'c2'])
    expect(result[0]).toMatchObject({
      id: 'c1',
      total_recipients: 1,
      sent_recipients: 1,
      failed_recipients: 0,
      pending_recipients: 0,
    })
    expect(result[1]).toMatchObject({
      id: 'c2',
      total_recipients: 2,
      sent_recipients: 0,
      failed_recipients: 1,
      pending_recipients: 1,
    })
  })

  it('propagates the campaigns query error', async () => {
    ;(supabase.from as Mock).mockReturnValue(
      makeQueryBuilder({ data: null, error: { message: 'permission denied' } }),
    )
    await expect(fetchCampaigns(USER_ID)).rejects.toThrow('permission denied')
  })

  it('propagates the counts query error', async () => {
    ;(supabase.from as Mock)
      .mockReturnValueOnce(makeQueryBuilder({ data: [{ id: 'c1' }], error: null }))
      .mockReturnValueOnce(makeQueryBuilder({ data: null, error: { message: 'counts failed' } }))

    await expect(fetchCampaigns(USER_ID)).rejects.toThrow('counts failed')
  })
})

describe('fetchEmailAccounts', () => {
  it('scopes to the user and returns the accounts', async () => {
    const builder = makeQueryBuilder({ data: [{ id: 'ea1', from_email: 'a@b.com' }], error: null })
    ;(supabase.from as Mock).mockReturnValue(builder)

    const result = await fetchEmailAccounts(USER_ID)

    expect(supabase.from).toHaveBeenCalledWith('email_accounts')
    expect(builder.eq).toHaveBeenCalledWith('user_id', USER_ID)
    expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result).toHaveLength(1)
  })

  it('returns [] when the data is null', async () => {
    ;(supabase.from as Mock).mockReturnValue(makeQueryBuilder({ data: null, error: null }))
    expect(await fetchEmailAccounts(USER_ID)).toEqual([])
  })

  it('propagates the error', async () => {
    ;(supabase.from as Mock).mockReturnValue(
      makeQueryBuilder({ data: null, error: { message: 'boom' } }),
    )
    await expect(fetchEmailAccounts(USER_ID)).rejects.toThrow('boom')
  })
})

describe('fetchCampaignRecipients', () => {
  it('scopes to the campaign and orders oldest first', async () => {
    const builder = makeQueryBuilder({ data: [{ id: 'r1', email: 'a@b.com' }], error: null })
    ;(supabase.from as Mock).mockReturnValue(builder)

    const result = await fetchCampaignRecipients('c1')

    expect(supabase.from).toHaveBeenCalledWith('recipients')
    expect(builder.eq).toHaveBeenCalledWith('campaign_id', 'c1')
    expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(result).toHaveLength(1)
  })

  it('propagates the error', async () => {
    ;(supabase.from as Mock).mockReturnValue(
      makeQueryBuilder({ data: null, error: { message: 'nope' } }),
    )
    await expect(fetchCampaignRecipients('c1')).rejects.toThrow('nope')
  })
})
