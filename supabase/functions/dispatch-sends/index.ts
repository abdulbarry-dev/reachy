import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...corsHeaders, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' } })
  }

  if (req.method === 'GET') {
    return jsonResponse({ status: 'ok', function: 'dispatch-sends', timestamp: new Date().toISOString() })
  }

  const cronAuth = req.headers.get('x-cron-secret')
  if (!cronAuth || cronAuth !== CRON_SECRET) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  try {
    // Reclaim stuck 'sending' recipients (failed to send in previous run)
    const { error: reclaimError } = await supabase
      .from('recipients')
      .update({ status: 'pending', error_message: null })
      .eq('status', 'sending')
      .lt('updated_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())

    if (reclaimError) {
      console.error('Reclaim error:', reclaimError.message)
    }

    // Fetch active campaigns, queued first, then oldest first
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, status, subject_template, body_template, send_rate_seconds, daily_cap, email_account_id, created_at')
      .in('status', ['queued', 'running'])
      .order('status', { ascending: true })
      .order('created_at', { ascending: true })

    if (campaignError) throw new Error(`Campaign fetch error: ${campaignError.message}`)
    if (!campaigns || campaigns.length === 0) {
      return jsonResponse({ processed: 0, reason: 'no active campaigns' })
    }

    // Build a map of account -> campaign ids for cap/rate-limit checks
    const accountCampaignIds: Record<string, string[]> = {}
    for (const c of campaigns) {
      if (!accountCampaignIds[c.email_account_id]) accountCampaignIds[c.email_account_id] = []
      accountCampaignIds[c.email_account_id].push(c.id)
    }

    // Process campaigns sequentially and stop after the first successful send.
    // This enforces "one email per cron tick" and naturally respects per-account
    // rate limits because a send for an account updates the shared sent_at pool.
    for (const campaign of campaigns) {
      const result = await processCampaign(supabase, campaign, accountCampaignIds[campaign.email_account_id])
      if (result && result.status === 'sent') {
        return jsonResponse({ processed: 1, results: [result] })
      }
    }

    return jsonResponse({ processed: 0, reason: 'no eligible recipients or rate limits hit' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('dispatch-sends error:', message)
    return jsonResponse({ error: message }, 500)
  }
})

async function processCampaign(
  supabase: ReturnType<typeof createClient>,
  campaign: {
    id: string
    status: string
    subject_template: string
    body_template: string
    send_rate_seconds: number
    daily_cap: number
    email_account_id: string
  },
  accountCampaignIds: string[],
) {
  try {
    // Per-account daily cap
    const { count: accountSentToday, error: accountCountError } = await supabase
      .from('recipients')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .in('campaign_id', accountCampaignIds)

    if (accountCountError) {
      console.error('Account count error:', accountCountError.message)
      return null
    }

    const accountCap = Math.min(campaign.daily_cap, 90)
    if ((accountSentToday ?? 0) >= accountCap) return null

    // Campaign daily cap
    const { count: sentToday, error: countError } = await supabase
      .from('recipients')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id)
      .eq('status', 'sent')
      .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (countError) {
      console.error('Campaign count error:', countError.message)
      return null
    }
    if ((sentToday ?? 0) >= campaign.daily_cap) return null

    // Per-account rate limit: time since last send across all campaigns for this account
    const { data: lastAccountSent } = await supabase
      .from('recipients')
      .select('sent_at')
      .eq('status', 'sent')
      .in('campaign_id', accountCampaignIds)
      .order('sent_at', { ascending: false })
      .limit(1)

    if (lastAccountSent && lastAccountSent.length > 0 && lastAccountSent[0].sent_at) {
      const elapsedMs = Date.now() - new Date(lastAccountSent[0].sent_at).getTime()
      if (elapsedMs < campaign.send_rate_seconds * 1000) return null
    }

    // Atomic claim: pick one pending recipient
    const { data: claimResult, error: claimError } = await supabase.rpc(
      'claim_pending_recipient',
      { p_campaign_id: campaign.id },
    )

    if (claimError || !claimResult) {
      // No pending recipients — mark campaign completed if none remain
      const { count: remaining } = await supabase
        .from('recipients')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .in('status', ['pending', 'sending'])

      if ((remaining ?? 0) === 0) {
        await supabase.from('campaigns').update({ status: 'completed' }).eq('id', campaign.id)
      }
      return null
    }

    const recipient = claimResult as { id: string; email: string; name: string | null; variables: Record<string, string> }

    // Fetch email account + app password
    const { data: account } = await supabase
      .from('email_accounts')
      .select('from_name, from_email, app_password_secret_id, smtp_host, smtp_port')
      .eq('id', campaign.email_account_id)
      .single()

    if (!account) {
      await supabase
        .from('recipients')
        .update({ status: 'failed', error_message: 'Email account not found' })
        .eq('id', recipient.id)
      return null
    }

    const { data: secretData } = await supabase
      .from('vault.decrypted_secrets')
      .select('decrypted_secret')
      .eq('id', account.app_password_secret_id)
      .single()

    if (!secretData?.decrypted_secret) {
      await supabase
        .from('recipients')
        .update({ status: 'failed', error_message: 'App password not found in Vault' })
        .eq('id', recipient.id)
      return null
    }

    const variables = (recipient.variables as Record<string, string>) ?? {}
    const personalize = (text: string) =>
      text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m: string, key: string) => {
        const val = key === 'email' ? recipient.email
          : key === 'name' ? (recipient.name ?? '')
          : variables[key] ?? ''
        return escapeHtml(val)
      })

    const html = personalize(campaign.body_template)
    const subject = personalize(campaign.subject_template)

    const transporter = nodemailer.createTransport({
      host: account.smtp_host || 'smtp.gmail.com',
      port: account.smtp_port || 587,
      secure: (account.smtp_port || 587) === 465,
      auth: { user: account.from_email, pass: secretData.decrypted_secret },
    })

    try {
      await transporter.sendMail({
        from: account.from_name ? { name: account.from_name, address: account.from_email } : account.from_email,
        to: recipient.email,
        subject,
        html,
      })
    } finally {
      transporter.close()
    }

    await supabase
      .from('recipients')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', recipient.id)

    if (campaign.status === 'queued') {
      await supabase.from('campaigns').update({ status: 'running' }).eq('id', campaign.id)
    }

    return { campaignId: campaign.id, email: recipient.email, status: 'sent' }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`processCampaign error (${campaign.id}):`, message)
    return { campaignId: campaign.id, email: 'error', status: `error: ${message}` }
  }
}
