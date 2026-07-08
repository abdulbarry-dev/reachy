import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { CampaignWithCounts } from '../types'

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<CampaignWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: campaignsData, error: campaignsError } = await supabase
      .from('campaigns')
      .select(`
        *,
        email_account:email_account_id (id, from_name, from_email)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (campaignsError) {
      setError(campaignsError.message)
      setLoading(false)
      return
    }

    if (!campaignsData) {
      setCampaigns([])
      setLoading(false)
      return
    }

    const campaignIds = campaignsData.map((c) => c.id)

    const { data: countsData } = await supabase
      .from('recipients')
      .select('campaign_id, status')
      .in('campaign_id', campaignIds)

    const countsMap: Record<string, { total: number; sent: number; failed: number; pending: number }> = {}
    for (const id of campaignIds) {
      countsMap[id] = { total: 0, sent: 0, failed: 0, pending: 0 }
    }

    for (const r of countsData ?? []) {
      const bucket = countsMap[r.campaign_id]
      if (bucket) {
        bucket.total++
        if (r.status === 'sent') bucket.sent++
        else if (r.status === 'failed') bucket.failed++
        else bucket.pending++
      }
    }

    const withCounts: CampaignWithCounts[] = campaignsData.map((c) => ({
      ...c,
      total_recipients: countsMap[c.id]?.total ?? 0,
      sent_recipients: countsMap[c.id]?.sent ?? 0,
      failed_recipients: countsMap[c.id]?.failed ?? 0,
      pending_recipients: countsMap[c.id]?.pending ?? 0,
    }))

    setCampaigns(withCounts)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  return { campaigns, loading, error, refetch: fetchCampaigns }
}
