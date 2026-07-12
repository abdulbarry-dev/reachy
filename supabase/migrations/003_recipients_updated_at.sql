-- 003_recipients_updated_at.sql
-- Add updated_at to recipients so dispatch-sends can reclaim stuck rows safely.

alter table recipients
  add column if not exists updated_at timestamptz default now();

-- Backfill existing rows so old records don't get reclaimed immediately.
update recipients
  set updated_at = created_at
  where updated_at is null;

-- Keep updated_at current on every row change.
create or replace function trg_set_recipient_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Drop if exists to make migration idempotent.
drop trigger if exists trg_recipients_updated_at on recipients;

create trigger trg_recipients_updated_at
  before update on recipients
  for each row
  execute function trg_set_recipient_updated_at();
