import { describe, it, expect } from 'vitest'
import { campaignPollInterval, RUNNING_REFRESH_MS } from '../../src/hooks/useCampaigns'
import type { CampaignWithCounts } from '../../src/types'

function campaign(status: CampaignWithCounts['status']): CampaignWithCounts {
  return { status } as CampaignWithCounts
}

describe('campaignPollInterval', () => {
  it('does not poll before data arrives', () => {
    expect(campaignPollInterval(undefined)).toBe(0)
  })

  it('does not poll idle campaigns', () => {
    expect(campaignPollInterval([])).toBe(0)
    expect(campaignPollInterval([campaign('draft'), campaign('queued')])).toBe(0)
    expect(campaignPollInterval([campaign('paused'), campaign('completed')])).toBe(0)
  })

  it('polls while any campaign is running', () => {
    expect(campaignPollInterval([campaign('completed'), campaign('running')])).toBe(
      RUNNING_REFRESH_MS,
    )
  })
})
