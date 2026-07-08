-- Enable required extensions
create extension if not exists "pg_net";
create extension if not exists "pg_cron";
create extension if not exists "pgsodium";

-- Email accounts (BYO Gmail)
create table email_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  from_name text not null,
  from_email text not null,
  app_password_secret_id uuid not null,
  smtp_host text default 'smtp.gmail.com',
  smtp_port int default 587,
  created_at timestamptz default now()
);

-- Campaigns
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  email_account_id uuid references email_accounts(id) on delete cascade not null,
  name text not null,
  subject_template text not null,
  body_template text not null,
  status text not null default 'draft' check (status in ('draft','queued','running','paused','completed')),
  send_rate_seconds int not null default 60,
  daily_cap int not null default 90,
  created_at timestamptz default now()
);

-- Recipients
create table recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade not null,
  name text,
  email text not null,
  variables jsonb default '{}',
  status text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_recipients_campaign_status on recipients (campaign_id, status);
create index if not exists idx_recipients_campaign_sent_at on recipients (campaign_id, sent_at);

-- Row-Level Security
alter table email_accounts enable row level security;
alter table campaigns enable row level security;
alter table recipients enable row level security;

create policy "own email accounts" on email_accounts
  for all using (auth.uid() = user_id);

create policy "own campaigns" on campaigns
  for all using (auth.uid() = user_id);

create policy "own recipients" on recipients
  for all using (
    campaign_id in (select id from campaigns where user_id = auth.uid())
  );

-- ⚠️ After deploying the dispatch-sends Edge Function, enable the cron job:
-- Replace <project-ref> and <anon-key> with your Supabase project values.
--
-- select cron.schedule(
--   'dispatch-sends-every-60s',
--   '* * * * *',
--   $$
--     select net.http_post(
--       url := 'https://<project-ref>.supabase.co/functions/v1/dispatch-sends',
--       body := '{}'::jsonb,
--       headers := '{"Authorization": "Bearer <anon-key>", "Content-Type": "application/json"}'::jsonb
--     )
--   $$
-- );
