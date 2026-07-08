import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { EmailAccount } from '../types'

export function useEmailAccounts() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const fetchAccounts = useCallback(async () => {
    if (mountedRef.current) setLoading(true)
    if (mountedRef.current) setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (mountedRef.current) setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (mountedRef.current) {
        if (fetchError) {
          setError(fetchError.message)
        } else {
          setAccounts(data ?? [])
        }
        setLoading(false)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch accounts')
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    fetchAccounts()
    return () => { mountedRef.current = false }
  }, [fetchAccounts])

  const deleteAccount = useCallback(async (accountId: string) => {
    const { error: deleteError } = await supabase
      .from('email_accounts')
      .delete()
      .eq('id', accountId)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }
    setAccounts((prev) => prev.filter((a) => a.id !== accountId))
    return true
  }, [])

  return { accounts, loading, error, refetch: fetchAccounts, deleteAccount }
}
