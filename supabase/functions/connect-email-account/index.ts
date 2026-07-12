import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6'

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
    const contentType = req.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      throw new Error('Content-Type must be application/json')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) throw new Error('Unauthorized')

    const { fromName, fromEmail, appPassword, smtpHost, smtpPort } = await req.json()

    if (!fromName || !fromEmail || !appPassword) {
      throw new Error('fromName, fromEmail, and appPassword are required')
    }

    // Validate SMTP with a test connection
    let testTransporter
    try {
      testTransporter = nodemailer.createTransport({
        host: smtpHost || 'smtp.gmail.com',
        port: smtpPort || 587,
        secure: (smtpPort || 587) === 465,
        auth: { user: fromEmail, pass: appPassword },
      })

      await testTransporter.verify()
    } finally {
      if (testTransporter) testTransporter.close()
    }

    // Store the app password in Supabase Vault
    const secretName = `reachy-password-${user.id}-${crypto.randomUUID()}`
    const { data: secret, error: secretError } = await supabase.rpc(
      'vault.create_secret',
      { secret: appPassword, name: secretName },
    )

    if (secretError) throw new Error(`Vault error: ${secretError.message}`)
    const secretId = typeof secret === 'string' ? secret : secret?.id
    if (!secretId) throw new Error('Failed to store secret in Vault')

    // Insert the email account
    const { data: account, error: insertError } = await supabase
      .from('email_accounts')
      .insert({
        user_id: user.id,
        from_name: fromName,
        from_email: fromEmail,
        app_password_secret_id: secretId,
        smtp_host: smtpHost || 'smtp.gmail.com',
        smtp_port: smtpPort || 587,
      })
      .select('id, from_name, from_email, created_at')
      .single()

    if (insertError) {
      // Clean up Vault secret on insert failure
      await supabase.rpc('vault.delete_secret', { secret_id: secretId }).catch(() => {})
      throw new Error(`Insert error: ${insertError.message}`)
    }

    return new Response(JSON.stringify(account), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const status = message.includes('Unauthorized') || message.includes('Authorization') ? 401 : 400
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
