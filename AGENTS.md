# Reachy — Cold Email Automation

## Commands

```sh
npm run dev       # Vite dev server
npm run build     # tsc -b && vite build (typecheck required before build)
npm run lint      # oxlint (not ESLint — uses .oxlintrc.json)
npm run preview   # vite preview
npx tsc --noEmit  # typecheck only (skip build)
```

## Stack

React 19 + TypeScript 6 + Vite 8 + Redux Toolkit + Supabase + Bootstrap 5 + Framer Motion.

Linter is `oxlint` — no ESLint config. TypeScript has `noUnusedLocals`/`noUnusedParameters` enabled and `verbatimModuleSyntax` (use `import type`).

## Env

`.env` requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Edge Function secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are set in Supabase Dashboard, not in `.env`. See `.env.example`.

## Architecture

- **Auth**: Supabase email/password. Session restored on mount in `App.tsx:33-46` via `getSession()` + `onAuthStateChange`.
- **Protected routes**: `ProtectedRoute` wrapper checks `state.auth.user`, renders `<Layout />` (sidebar) or redirects to `/login`.
- **Client → Edge Function calls**: Pages call edge functions via `fetch(getEdgeFunctionUrl(name))` passing `Authorization: Bearer ${session.access_token}` — the function uses `supabase.auth.getUser(token)` with the service role key to verify.
- **Send pipeline** (`reachy.md §5`): Not a loop. `pg_cron` every 60s calls `dispatch-sends` via `pg_net`. Each tick sends one email. Avoids the 150s Edge Function timeout.
- **App passwords** stored in Supabase Vault via `vault.create_secret()`, never in plaintext columns.

## Database

3 Postgres tables with RLS via `auth.uid()`:

| Table | Key FK | RLS policy |
|---|---|---|
| `email_accounts` | `user_id → auth.users` | `user_id = auth.uid()` |
| `campaigns` | `user_id → auth.users`, `email_account_id → email_accounts` | `user_id = auth.uid()` |
| `recipients` | `campaign_id → campaigns` | `campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())` |

Migration at `supabase/migrations/001_schema.sql`. Apply via Supabase Dashboard or `supabase_apply_migration`.

## Edge Functions

4 Deno functions in `supabase/functions/`:

| Function | Purpose |
|---|---|
| `connect-email-account` | Validates SMTP via nodemailer, stores password in Vault, inserts email_accounts row |
| `create-campaign` | Inserts campaign + bulk-inserts recipients |
| `start-campaign` | Flips campaign status to `queued` |
| `dispatch-sends` | Core send loop — picks one pending recipient, sends via nodemailer |

All use `npm:@supabase/supabase-js@2`, `npm:nodemailer@6`, and `https://deno.land/std@0.208.0/http/server.ts`.

## Routes

| Path | Component | Auth |
|---|---|---|
| `/login` | `<Auth mode="login" />` | Public |
| `/signup` | `<Auth mode="signup" />` | Public |
| `/reset-password` | `<Auth mode="reset-password" />` | Public |
| `/` (index) | `<Dashboard />` | Protected |
| `/recipients` | `<Recipients />` | Protected |
| `/compose` | `<Compose />` | Protected |
| `/settings` | `<Settings />` | Protected |
| `/campaigns/:campaignId` | `<CampaignDetail />` | Protected |

## Key Components

- `ToastProvider` — context at `main.tsx` root, exposes `useToast()` returning `{ toast(message, type) }` (types: `success`/`error`/`info`).
- `ConfirmModal` — reusable confirmation dialog for destructive actions (logout, delete account).
- `Layout` — collapsible sidebar (`260px` ↔ `72px`) with framer-motion animation.
- `FileDropzone` — CSV/Excel upload via papaparse + xlsx + react-dropzone.

## Data Model (types/src/types/index.ts)

- `EmailAccount` — Gmail sender identity
- `Campaign` / `CampaignWithCounts` — campaign with aggregated recipient counts
- `Recipient` / `ImportedRecipient` — per-recipient data with merge variables
- `CampaignStatus` — `'draft' | 'queued' | 'running' | 'paused' | 'completed'`
- Recipient statuses: `'pending' | 'sending' | 'sent' | 'failed'`

## Rate Limit Defaults

Hardcoded in schema: `send_rate_seconds = 60`, `daily_cap = 90`. These stay well under Gmail's SMTP ceiling (100/day for free, ~20/hr undocumented behavioral throttle). Campaign defaults are surfaced as user-editable.
