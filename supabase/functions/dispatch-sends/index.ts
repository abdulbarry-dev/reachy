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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...corsHeaders, 'Access-Control-Allow-Methods': 'POST, OPTIONS' } })
  }

  // Auth: require CRON_SECRET header
  const cronAuth = req.headers.get('x-cron-secret')
  if (!cronAuth || cronAuth !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  try {
    // Reclaim stuck 'sending' recipients (failed to send in previous run)
    await supabase
      .from('recipients')
      .update({ status: 'pending', error_message: null })
      .eq('status', 'sending')
      .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())

    // Fetch all campaigns that are queued or running
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, status, subject_template, body_template, send_rate_seconds, daily_cap, email_account_id')
      .in('status', ['queued', 'running'])

    if (campaignError) throw new Error(`Campaign fetch error: ${campaignError.message}`)
    if (!campaigns || campaigns.length === 0) {
      return new Response(JSON.stringify({ processed: 0, reason: 'no active campaigns' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const summary: { campaignId: string; email: string; status: string }[] = []

    for (const campaign of campaigns) {
      try {
        // Per-account rate limiting: count sent across ALL campaigns for this email_account_id
        const { count: accountSentToday, error: accountCountError } = await supabase
          .from('recipients')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'sent')
          .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .in('campaign_id', (
            await supabase.from('campaigns').select('id').eq('email_account_id', campaign.email_account_id)
          ).data?.map(c => c.id) ?? [])

        if (!accountCountError) {
          const accountCap = Math.min(campaign.daily_cap, 90)
          if ((accountSentToday ?? 0) >= accountCap) continue
        }

        // Check campaign daily cap
        const { count: sentToday, error: countError } = await supabase
          .from('recipients')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)
          .eq('status', 'sent')
          .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

        if (countError) continue
        if ((sentToday ?? 0) >= campaign.daily_cap) continue

        // Check rate limit: time since last send (per campaign)
        const { data: lastSent } = await supabase
          .from('recipients')
          .select('sent_at')
          .eq('campaign_id', campaign.id)
          .eq('status', 'sent')
          .order('sent_at', { ascending: false })
          .limit(1)

        if (lastSent && lastSent.length > 0 && lastSent[0].sent_at) {
          const elapsedMs = Date.now() - new Date(lastSent[0].sent_at).getTime()
          if (elapsedMs < campaign.send_rate_seconds * 1000) continue
        }

        // Atomic claim: pick one pending recipient using a stored procedure
        const { data: claimResult, error: claimError } = await supabase.rpc(
          'claim_pending_recipient',
          { p_campaign_id: campaign.id },
        )

        if (claimError || !claimResult) {
          // No pending recipients — mark campaign completed
          const { count: remaining } = await supabase
            .from('recipients')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id)
            .in('status', ['pending', 'sending'])

          if ((remaining ?? 0) === 0) {
            await supabase.from('campaigns').update({ status: 'completed' }).eq('id', campaign.id)
          }
          continue
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
          continue
        }

        // Fetch decrypted password from Vault
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
          continue
        }

        // Build personalized content with HTML escaping
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
        const fromAddr = account.from_email
        const fromName = account.from_name

        // Send email
        const transporter = nodemailer.createTransport({
          host: account.smtp_host || 'smtp.gmail.com',
          port: account.smtp_port || 587,
          secure: (account.smtp_port || 587) === 465,
          auth: { user: account.from_email, pass: secretData.decrypted_secret },
        })

        try {
          await transporter.sendMail({
            from: fromName ? { name: fromName, address: fromAddr } : fromAddr,
            to: recipient.email,
            subject,
            html,
          })
        } finally {
          transporter.close()
        }

        // Mark sent
        await supabase
          .from('recipients')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', recipient.id)

        // Update campaign status to running if it was queued
        if (campaign.status === 'queued') {
          await supabase
            .from('campaigns')
            .update({ status: 'running' })
            .eq('id', campaign.id)
        }

        summary.push({ campaignId: campaign.id, email: recipient.email, status: 'sent' })
      } catch (err) {
        // Always finalize recipient status on failure
        if (summary.length > 0) {
          const last = summary[summary.length - 1]
          if (last.status === 'error') {
            await supabase
              .from('recipients')
              .update({ status: 'failed', error_message: err.message })
              .eq('campaign_id', campaign.id)
              .eq('status', 'sending')
          }
        }
        summary.push({ campaignId: campaign.id, email: 'error', status: `error: ${err.message}` })
      }
    }

    return new Response(
      JSON.stringify({ processed: summary.length, results: summary }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
