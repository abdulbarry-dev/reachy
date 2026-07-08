import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Recipient } from '../types'

export function useRecipients(campaignId: string | undefined) {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const fetchRecipients = useCallback(async () => {
    if (!campaignId) {
      if (mountedRef.current) setRecipients([])
      if (mountedRef.current) setLoading(false)
      return
    }

    if (mountedRef.current) setLoading(true)
    if (mountedRef.current) setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('recipients')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true })

      if (mountedRef.current) {
        if (fetchError) {
          setError(fetchError.message)
        } else {
          setRecipients(data ?? [])
        }
        setLoading(false)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch recipients')
        setLoading(false)
      }
    }
  }, [campaignId])

  useEffect(() => {
    mountedRef.current = true
    fetchRecipients()
    return () => { mountedRef.current = false }
  }, [fetchRecipients])

  return { recipients, loading, error, refetch: fetchRecipients }
}
