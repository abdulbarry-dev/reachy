-- 002_atomic_claim_and_indexes.sql
-- Atomic claim RPC, CHECK constraints, indexes, Vault cleanup trigger

alter table campaigns
  add constraint send_rate_seconds_min check (send_rate_seconds >= 30);

alter table campaigns
  add constraint daily_cap_range check (daily_cap between 1 and 90);

create index if not exists idx_campaigns_status on campaigns (status);
create index if not exists idx_campaigns_user_id on campaigns (user_id);
create index if not exists idx_email_accounts_user_id on email_accounts (user_id);
create index if not exists idx_recipients_status_sending on recipients (status) where status = 'sending';

create or replace function claim_pending_recipient(p_campaign_id uuid)
returns table (id uuid, email text, name text, variables jsonb)
language plpgsql
as $$
begin
  return query
  update recipients
  set status = 'sending'
  where id = (
    select id
    from recipients
    where campaign_id = p_campaign_id
      and status = 'pending'
    order by created_at
    limit 1
    for update skip locked
  )
  returning id, email, name, variables;
end;
$$;

create or replace function cleanup_vault_secret()
returns trigger
language plpgsql
security definer
as $$
begin
  perform vault.delete_secret(old.app_password_secret_id);
  return old;
end;
$$;

create trigger trg_email_accounts_cleanup_vault
  after delete on email_accounts
  for each row
  execute function cleanup_vault_secret();
