import useSWR from 'swr'
import { fetchCampaignRecipients } from '../lib/fetcher'
import type { Recipient } from '../types'

/** Stable empty list: `data ?? []` would change identity on every render. */
const NO_RECIPIENTS: Recipient[] = []

export function useRecipients(campaignId: string | undefined) {
  // Campaign ids are globally unique, so the key needs no user segment; RLS
  // refuses the rows for anyone who does not own the campaign.
  const { data, error, isLoading, mutate } = useSWR<Recipient[]>(
    campaignId ? (['recipients', campaignId] as const) : null,
    ([, id]: readonly [string, string]) => fetchCampaignRecipients(id),
  )

  return {
    recipients: data ?? NO_RECIPIENTS,
    loading: isLoading,
    error: error?.message ?? null,
    refetch: mutate,
  }
}
