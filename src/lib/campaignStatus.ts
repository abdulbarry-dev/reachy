/**
 * Single source of truth for campaign status → visual styling.
 * Shared by CampaignCard and CampaignDetail so badges cannot drift apart.
 */

export const campaignStatusBadgeClass: Record<string, string> = {
  draft: 'badge-reachy-draft',
  queued: 'badge-reachy-queued',
  running: 'badge-reachy-running',
  completed: 'badge-reachy-completed',
  paused: 'badge-reachy-paused',
}

export const campaignStatusProgressBg: Record<string, string> = {
  draft: '#3AA8AD',
  queued: '#f59e0b',
  running: '#3AB397',
  completed: '#10b981',
  paused: '#f59e0b',
}
