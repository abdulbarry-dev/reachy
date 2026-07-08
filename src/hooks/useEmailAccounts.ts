import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { EmailAccount } from '../types'

export function useEmailAccounts() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setAccounts(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAccounts()
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
