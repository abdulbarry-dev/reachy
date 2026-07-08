import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  try {
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
        // Check daily cap: count sent in last 24h
        const { count: sentToday, error: countError } = await supabase
          .from('recipients')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)
          .eq('status', 'sent')
          .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

        if (countError) continue
        if ((sentToday ?? 0) >= campaign.daily_cap) continue

        // Check rate limit: time since last send
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

        // Pick one pending recipient
        const { data: recipients } = await supabase
          .from('recipients')
          .select('id, email, name, variables')
          .eq('campaign_id', campaign.id)
          .eq('status', 'pending')
          .limit(1)

        if (!recipients || recipients.length === 0) {
          // No pending recipients — mark campaign completed
          await supabase.from('campaigns').update({ status: 'completed' }).eq('id', campaign.id)
          continue
        }

        const recipient = recipients[0]

        // Mark as sending
        await supabase.from('recipients').update({ status: 'sending' }).eq('id', recipient.id)

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

        // Build personalized content
        const variables = (recipient.variables as Record<string, string>) ?? {}
        const personalize = (text: string) =>
          text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m: string, key: string) => {
            if (key === 'email') return recipient.email
            if (key === 'name') return recipient.name ?? ''
            return variables[key] ?? ''
          })

        const html = personalize(campaign.body_template)
        const subject = personalize(campaign.subject_template)
        const from = account.from_name
          ? `"${account.from_name}" <${account.from_email}>`
          : account.from_email

        // Send email
        const transporter = nodemailer.createTransport({
          host: account.smtp_host || 'smtp.gmail.com',
          port: account.smtp_port || 587,
          secure: (account.smtp_port || 587) === 465,
          auth: { user: account.from_email, pass: secretData.decrypted_secret },
          tls: { rejectUnauthorized: false },
        })

        await transporter.sendMail({
          from,
          to: recipient.email,
          subject,
          html,
        })

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
