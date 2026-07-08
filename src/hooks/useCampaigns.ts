import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { CampaignWithCounts } from '../types'

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<CampaignWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (mountedRef.current) setLoading(false)
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
        if (mountedRef.current) setError(campaignsError.message)
        if (mountedRef.current) setLoading(false)
        return
      }

      if (!campaignsData) {
        if (mountedRef.current) setCampaigns([])
        if (mountedRef.current) setLoading(false)
        return
      }

      const campaignIds = campaignsData.map((c) => c.id)

      const countsMap: Record<string, { total: number; sent: number; failed: number; pending: number }> = {}
      for (const id of campaignIds) {
        countsMap[id] = { total: 0, sent: 0, failed: 0, pending: 0 }
      }

      if (campaignIds.length > 0) {
        const { data: countsData } = await supabase
          .from('recipients')
          .select('campaign_id, status')
          .in('campaign_id', campaignIds)

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

      if (mountedRef.current) setCampaigns(withCounts)
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : 'Failed to fetch campaigns')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    fetchCampaigns()
    return () => { mountedRef.current = false }
  }, [fetchCampaigns])

  return { campaigns, loading, error, refetch: fetchCampaigns }
}
