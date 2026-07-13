export interface Recipient {
  id: string
  campaign_id?: string
  email: string
  name?: string
  company?: string
  variables?: Record<string, string>
  status?: 'pending' | 'sending' | 'sent' | 'failed'
  error_message?: string
  sent_at?: string
}

export interface EmailAccount {
  id: string
  user_id: string
  from_name: string
  from_email: string
  smtp_host: string
  smtp_port: number
  created_at: string
}

export type CampaignStatus = 'draft' | 'queued' | 'running' | 'paused' | 'completed'

export interface Campaign {
  id: string
  user_id: string
  email_account_id: string
  name: string
  subject_template: string
  body_template: string
  status: CampaignStatus
  send_rate_seconds: number
  daily_cap: number
  created_at: string
  email_account?: EmailAccount
}

export interface CampaignWithCounts extends Campaign {
  total_recipients: number
  sent_recipients: number
  failed_recipients: number
  pending_recipients: number
}

export interface ImportedRecipient {
  email: string
  name?: string
  company?: string
  variables?: Record<string, string>
}

export type { User, Session } from '@supabase/supabase-js'
