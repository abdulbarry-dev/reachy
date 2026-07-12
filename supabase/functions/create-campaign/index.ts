import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) throw new Error('Unauthorized')

    const contentType = req.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      throw new Error('Content-Type must be application/json')
    }

    const {
      emailAccountId,
      name,
      subjectTemplate,
      bodyTemplate,
      recipients,
      sendRateSeconds = 60,
      dailyCap = 90,
    } = await req.json()

    // Clamp rate limits server-side (must stay under Gmail thresholds)
    const clampedSendRate = Math.max(30, sendRateSeconds)
    const clampedDailyCap = Math.max(1, Math.min(90, dailyCap))

    if (!emailAccountId || !name || !subjectTemplate || !bodyTemplate || !Array.isArray(recipients)) {
      throw new Error('emailAccountId, name, subjectTemplate, bodyTemplate, and recipients are required')
    }

    if (recipients.length === 0) {
      throw new Error('At least one recipient is required')
    }

    // Verify the email account belongs to the user
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('id', emailAccountId)
      .eq('user_id', user.id)
      .single()

    if (accountError || !account) {
      throw new Error('Email account not found')
    }

    // Insert campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        user_id: user.id,
        email_account_id: emailAccountId,
        name,
        subject_template: subjectTemplate,
        body_template: bodyTemplate,
        send_rate_seconds: clampedSendRate,
        daily_cap: clampedDailyCap,
      })
      .select('id')
      .single()

    if (campaignError) throw new Error(`Campaign insert error: ${campaignError.message}`)

    const campaignId = campaign.id

    // Bulk-insert recipients in chunks of 500
    const chunkSize = 500
    let inserted = 0

    for (let i = 0; i < recipients.length; i += chunkSize) {
      const chunk = recipients.slice(i, i + chunkSize)
      const rows = chunk.map((r) => ({
        campaign_id: campaignId,
        email: r.email,
        name: r.name || null,
        variables: { ...(r.variables || {}), ...(r.company ? { company: r.company } : {}) },
      }))

      const { error: insertError } = await supabase.from('recipients').insert(rows)
      if (insertError) throw new Error(`Recipient insert error: ${insertError.message}`)
      inserted += chunk.length
    }

    return new Response(
      JSON.stringify({ campaignId, recipientCount: inserted }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const status = message.includes('Unauthorized') || message.includes('Authorization') ? 401 : 400
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
