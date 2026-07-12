import useSWR from 'swr'
import { authFetcher } from '../lib/fetcher'
import type { CampaignWithCounts } from '../types'

export function useCampaigns() {
  const { data, error, isLoading, mutate } = useSWR<CampaignWithCounts[]>('campaigns', authFetcher)
  return {
    campaigns: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    refetch: mutate,
  }
}