import { supabase } from './supabase'
import type { CampaignWithCounts, EmailAccount, Recipient } from '../types'

/**
 * Data access for the authenticated app.
 *
 * Each resource owns one fetcher with a concrete return type. The previous
 * version dispatched on a magic string inside a single generic function, which
 * meant every new resource edited the same function and every result was
 * asserted into place with `as unknown as T`.
 *
 * Fetchers take the caller's user id instead of calling `auth.getUser()`:
 * `getUser()` is a network request, so it was adding a round trip to every SWR
 * revalidation. The id is already in the store, and RLS still scopes the rows
 * server-side, so the explicit `user_id` filter is defence in depth rather than
 * the security boundary.
 */

export interface RecipientCounts {
  total: number
  sent: number
  failed: number
  pending: number
}

/** A recipient row reduced to the two columns the dashboard counts need. */
export interface RecipientStatusRow {
  campaign_id: string | null
  status: string | null
}

/**
 * Groups recipient statuses per campaign.
 *
 * Pure so it can be tested without a database: every requested campaign gets a
 * zeroed bucket, rows for other campaigns are ignored (they belong to another
 * user's campaign), and an unknown status counts as pending.
 */
export function aggregateRecipientCounts(
  campaignIds: readonly string[],
  rows: readonly RecipientStatusRow[],
): Record<string, RecipientCounts> {
  const counts: Record<string, RecipientCounts> = {}

  for (const id of campaignIds) {
    counts[id] = { total: 0, sent: 0, failed: 0, pending: 0 }
  }

  for (const row of rows) {
    const id = row.campaign_id
    if (id === null || !Object.hasOwn(counts, id)) continue

    const bucket = counts[id]
    bucket.total += 1
    if (row.status === 'sent') bucket.sent += 1
    else if (row.status === 'failed') bucket.failed += 1
    else bucket.pending += 1
  }

  return counts
}

/**
 * Campaigns with per-status recipient totals.
 *
 * Two queries: the campaigns, then one narrow `(campaign_id, status)` scan for
 * all of them. Counts are aggregated in one pass rather than issuing a query
 * per campaign.
 */
export async function fetchCampaigns(userId: string): Promise<CampaignWithCounts[]> {
  const { data: campaignRows, error: campaignsError } = await supabase
    .from('campaigns')
    .select(`
      *,
      email_account:email_account_id (id, from_name, from_email)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (campaignsError) throw new Error(campaignsError.message)

  const campaigns = campaignRows ?? []
  if (campaigns.length === 0) return []

  const campaignIds: string[] = campaigns.map((campaign) => campaign.id)

  const { data: statusRows, error: countsError } = await supabase
    .from('recipients')
    .select('campaign_id, status')
    .in('campaign_id', campaignIds)

  if (countsError) throw new Error(countsError.message)

  const counts = aggregateRecipientCounts(campaignIds, statusRows ?? [])

  return campaigns.map((campaign) => {
    const bucket = counts[campaign.id]
    return {
      ...campaign,
      total_recipients: bucket.total,
      sent_recipients: bucket.sent,
      failed_recipients: bucket.failed,
      pending_recipients: bucket.pending,
    }
  })
}

/** Sender identities owned by the user, newest first. */
export async function fetchEmailAccounts(userId: string): Promise<EmailAccount[]> {
  const { data, error } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

/** Every recipient of one campaign, oldest first. RLS scopes the rows. */
export async function fetchCampaignRecipients(campaignId: string): Promise<Recipient[]> {
  const { data, error } = await supabase
    .from('recipients')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}
