import useSWR from 'swr'
import { useSelector } from 'react-redux'
import { fetchCampaigns } from '../lib/fetcher'
import type { RootState } from '../store'
import type { CampaignWithCounts } from '../types'

/** How often a campaign that is actively sending refreshes its rows. */
export const RUNNING_REFRESH_MS = 30_000

/** Stable empty list: `data ?? []` would change identity on every render. */
const NO_CAMPAIGNS: CampaignWithCounts[] = []

/**
 * Poll only while something is actually sending. SWR accepts a function so the
 * interval can follow the freshest data instead of a guess made at mount.
 */
export function campaignPollInterval(campaigns: CampaignWithCounts[] | undefined): number {
  return campaigns?.some((campaign) => campaign.status === 'running') ? RUNNING_REFRESH_MS : 0
}

export function useCampaigns() {
  const userId = useSelector((state: RootState) => state.auth.user?.id)

  // The key carries the user id, so a different account signing in on the same
  // tab gets a different cache entry instead of the previous user's campaigns.
  const { data, error, isLoading, mutate } = useSWR<CampaignWithCounts[]>(
    userId ? (['campaigns', userId] as const) : null,
    ([, id]: readonly [string, string]) => fetchCampaigns(id),
    { refreshInterval: campaignPollInterval },
  )

  return {
    campaigns: data ?? NO_CAMPAIGNS,
    loading: isLoading,
    error: error?.message ?? null,
    refetch: mutate,
  }
}
