import { supabase } from './supabase'
import type { CampaignWithCounts } from '../types'

export async function authFetcher<T>(key: string | null): Promise<T> {
  if (!key) return [] as unknown as T

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!user) return [] as unknown as T

  if (key === 'campaigns') {
    const { data: campaignsData, error: campaignsError } = await supabase
      .from('campaigns')
      .select(`
        *,
        email_account:email_account_id (id, from_name, from_email)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (campaignsError) throw new Error(campaignsError.message)
    if (!campaignsData) return [] as unknown as T

    const campaignIds = campaignsData.map((c) => c.id)

    const countsMap: Record<string, { total: number; sent: number; failed: number; pending: number }> = {}
    for (const id of campaignIds) {
      countsMap[id] = { total: 0, sent: 0, failed: 0, pending: 0 }
    }

    if (campaignIds.length > 0) {
      const { data: countsData, error: countsError } = await supabase
        .from('recipients')
        .select('campaign_id, status')
        .in('campaign_id', campaignIds)

      if (countsError) throw new Error(countsError.message)

      for (const r of countsData ?? []) {
        const bucket = countsMap[r.campaign_id]
        if (bucket) {
          bucket.total++
          if (r.status === 'sent') bucket.sent++
          else if (r.status === 'failed') bucket.failed++
          else bucket.pending++
        }
      }
    }

    const withCounts: CampaignWithCounts[] = campaignsData.map((c) => ({
      ...c,
      total_recipients: countsMap[c.id]?.total ?? 0,
      sent_recipients: countsMap[c.id]?.sent ?? 0,
      failed_recipients: countsMap[c.id]?.failed ?? 0,
      pending_recipients: countsMap[c.id]?.pending ?? 0,
    }))

    return withCounts as unknown as T
  }

  if (key === 'email_accounts') {
    const { data, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as T
  }

  if (Array.isArray(key) && key[0] === 'recipients') {
    const campaignId = key[1] as string
    const { data, error } = await supabase
      .from('recipients')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true })
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as T
  }

  return [] as unknown as T
}
