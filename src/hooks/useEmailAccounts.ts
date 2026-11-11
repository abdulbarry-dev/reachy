import useSWR from 'swr'
import { useSelector } from 'react-redux'
import { supabase } from '../lib/supabase'
import { fetchEmailAccounts } from '../lib/fetcher'
import type { RootState } from '../store'
import type { EmailAccount } from '../types'

/** Stable empty list: `data ?? []` would change identity on every render. */
const NO_ACCOUNTS: EmailAccount[] = []

export function useEmailAccounts() {
  const userId = useSelector((state: RootState) => state.auth.user?.id)

  // User-scoped key so a re-login as another account cannot reuse this cache.
  const { data, error, isLoading, mutate } = useSWR<EmailAccount[]>(
    userId ? (['email_accounts', userId] as const) : null,
    ([, id]: readonly [string, string]) => fetchEmailAccounts(id),
  )

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
    accounts: data ?? NO_ACCOUNTS,
    loading: isLoading,
    error: error?.message ?? null,
    refetch: mutate,
    deleteAccount,
  }
}
