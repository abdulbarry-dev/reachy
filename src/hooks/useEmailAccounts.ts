import useSWR from 'swr'
import { supabase } from '../lib/supabase'
import { authFetcher } from '../lib/fetcher'
import type { EmailAccount } from '../types'

export function useEmailAccounts() {
  const { data, error, isLoading, mutate } = useSWR<EmailAccount[]>('email_accounts', authFetcher)

  const deleteAccount = async (accountId: string): Promise<{ ok: boolean; error?: string }> => {
    const { error: deleteError } = await supabase
      .from('email_accounts')
      .delete()
      .eq('id', accountId)

    if (deleteError) {
      return { ok: false, error: deleteError.message }
    }
    mutate()
    return { ok: true }
  }

  return {
    accounts: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    refetch: mutate,
    deleteAccount,
  }
}