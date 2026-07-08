import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Recipient } from '../types'

export function useRecipients(campaignId: string | undefined) {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRecipients = useCallback(async () => {
    if (!campaignId) {
      setRecipients([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('recipients')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setRecipients(data ?? [])
    }
    setLoading(false)
  }, [campaignId])

  useEffect(() => {
    fetchRecipients()
  }, [fetchRecipients])

  return { recipients, loading, error, refetch: fetchRecipients }
}
