import useSWR from 'swr'
import { authFetcher } from '../lib/fetcher'
import type { Recipient } from '../types'

export function useRecipients(campaignId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<Recipient[]>(
    campaignId ? ['recipients', campaignId] : null,
    authFetcher
  )
  return {
    recipients: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    refetch: mutate,
  }
}