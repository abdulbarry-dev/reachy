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

React 19 + TypeScript 6 + Vite 8 + Redux Toolkit + Supabase + Bootstrap 5 + Framer Motion + Vercel Analytics.

Linter is `oxlint` — no ESLint config. TypeScript has `noUnusedLocals`/`noUnusedParameters` enabled and `verbatimModuleSyntax` (use `import type`).

## Env

`.env` requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Edge Function secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`) are set in Supabase Dashboard, not in `.env`. See `.env.example`.

## Architecture

- **Auth**: Supabase email/password. Session restored on mount in `App.tsx` via `getSession()` + `onAuthStateChange`. `getSession()` rejection is caught to prevent permanent loading state.
- **Protected routes**: `ProtectedRoute` wrapper checks `state.auth.user`, renders `<Layout />` (sidebar) or redirects to `/login`.
- **Loading states**: All hooks (`useCampaigns`, `useRecipients`, `useEmailAccounts`) use SWR for data fetching. `fetcher.ts` now throws Supabase errors so they surface in the UI.
- **Bundle optimization**: Vite `manualChunks` splits vendor code into `vendor-react`, `vendor-ui`, `vendor-supabase`, `vendor-papaparse`, and `vendor-excel`. Excel parsing uses `read-excel-file`, loaded on demand when a user uploads an `.xlsx` file.
- **Client → Edge Function calls**: Pages call edge functions via `fetch(getEdgeFunctionUrl(name))` passing `Authorization: Bearer ${session.access_token}` — the function uses `supabase.auth.getUser(token)` with the service role key to verify. Response bodies are guarded with `try/catch` before `.json()`. Auth errors return 401; validation errors return 400.
- **Send pipeline**: Not a loop. `pg_cron` every 60s calls `dispatch-sends` via `pg_net`. Each tick sends exactly one email across all active campaigns (campaigns are processed sequentially and the function returns after the first successful send). Avoids the 150s Edge Function timeout. `dispatch-sends` also reclaims stuck `sending` recipients whose `updated_at` is older than 10 minutes (`claim_pending_recipient` RPC uses `FOR UPDATE SKIP LOCKED`).
- **dispatch-sends security**: Requires `x-cron-secret` header matching `CRON_SECRET` env var for POST invocations. Exposes a `GET` health endpoint for uptime monitoring. Uses atomic `claim_pending_recipient` RPC (no TOCTOU race). HTML-escapes merge variables in outbound emails. Per-email-account daily cap and send-rate limiting. `transporter.close()` in `finally` block. Structured `from` header `{name, address}`.
- **App passwords** stored in Supabase Vault via `vault.create_secret()`, never in plaintext columns. Vault secrets are auto-cleaned via trigger when `email_accounts` row is deleted.
- **CORS**: All edge functions respond with `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, POST, OPTIONS`, and `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`.
- **Input validation**: `Content-Type: application/json` checked in all edge functions. `sendRateSeconds` clamped `>= 30`, `dailyCap` clamped `[1, 90]`.

## Database

3 Postgres tables with RLS via `auth.uid()`:

| Table | Key FK | RLS policy |
|---|---|---|
| `email_accounts` | `user_id → auth.users` | `user_id = auth.uid()` |
| `campaigns` | `user_id → auth.users`, `email_account_id → email_accounts` | `user_id = auth.uid()` |
| `recipients` | `campaign_id → campaigns` | `campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())` |

### Migrations
- `001_schema.sql` — initial schema with RLS, cron scheduling, Vault integration.
- `002_atomic_claim_and_indexes.sql` — atomic `claim_pending_recipient()` RPC (`FOR UPDATE SKIP LOCKED`); CHECK constraints `send_rate_seconds >= 30`, `daily_cap BETWEEN 1 AND 90`; indexes on `campaigns(status)`, `campaigns(user_id)`, `email_accounts(user_id)`, partial index `recipients(status) WHERE status = 'sending'`; Vault cleanup trigger on `email_accounts` DELETE; parameterized `cron.schedule` with `CRON_SECRET`.
- `003_recipients_updated_at.sql` — adds `updated_at` to `recipients` with a backfill and a `BEFORE UPDATE` trigger; enables safe reclaim of stuck `sending` rows.

## Edge Functions

4 Deno functions in `supabase/functions/`:

| Function | Purpose |
|---|---|
| `connect-email-account` | Validates SMTP via nodemailer, stores password in Vault, inserts email_accounts row. Cleans up Vault secret on insert failure. Closes transporter after verify. |
| `create-campaign` | Inserts campaign + bulk-inserts recipients. Clamps rate limits server-side. Persists `company` merge variable. |
| `start-campaign` | Flips campaign status to `queued`. |
| `dispatch-sends` | Core send loop — atomic claim of one pending recipient, sends via nodemailer. CRON_SECRET auth. HTML escaping. Per-account rate limiting. Stuck recipient reclaim using `updated_at`. Processes campaigns sequentially, stops after first successful send (strictly one email per tick). |

All use `npm:@supabase/supabase-js@2`, `npm:nodemailer@6`, and `https://deno.land/std@0.208.0/http/server.ts`.

## Routes

| Path | Component | Auth |
|---|---|---|
| `/` (index) | `<LandingPage />` | Public |
| `/login` | `<Auth mode="login" />` | Public |
| `/signup` | `<Auth mode="signup" />` | Public |
| `/reset-password` | `<Auth mode="reset-password" />` | Public |
| `/dashboard` | `<Dashboard />` | Protected |
| `/recipients` | `<Recipients />` | Protected |
| `/compose` | `<Compose />` | Protected |
| `/settings` | `<Settings />` | Protected |
| `/campaigns/:campaignId` | `<CampaignDetail />` | Protected |
| `*` (catch-all) | Redirect to `/` | Public |

**App.tsx**: `MotionConfig reducedMotion="user"` wraps routes. `AnimatePresence` uses `location.key` for proper exit animations. Duplicate `/` routes consolidated. 404 catch-all added.

## Redux Store

Only 2 slices (campaignSlice and settingsSlice were dead code and removed):

| Slice | State | Purpose |
|---|---|---|
| `authSlice` | `{ user, loading }` | Auth session state |
| `recipientsSlice` | `{ items: ImportedRecipient[] }` | Local recipient list (persisted to localStorage) |

## Key Components

- `ToastProvider` — context at `main.tsx` root, exposes `useToast()` from `src/hooks/useToast.ts` returning `{ toast(message, type) }` (types: `success`/`error`/`info`). Container has `aria-live="polite"`, each toast has `role="alert"`, close button has `aria-label="Close notification"`.
- `ConfirmModal` — reusable confirmation dialog for destructive actions (logout, delete account).
- `Layout` — collapsible sidebar (`260px` ↔ `72px`) with framer-motion animation. Includes `skip-link` for keyboard users. Sidebar nav has `aria-label="Main navigation"`. Social footer links have `aria-label`.
- `FileDropzone` — CSV/Excel upload via papaparse + read-excel-file + react-dropzone.
- `AnimatedPage` — page transition wrapper.
- `AuthInput` — reusable icon+input with proper `<label>` element (visually-hidden) for accessibility.

## Skeleton Components (`src/components/Skeleton.tsx`)

Only 4 used components (unused `SkeletonText`, `SkeletonAvatar`, `SkeletonWrapper` removed):
- `Skeleton` — base shimmer element
- `SkeletonStatCard` — dashboard stat cards
- `SkeletonCampaignCard` — campaign list cards
- `SkeletonTable` — recipient table rows

## Data Model (types/src/types/index.ts)

- `EmailAccount` — Gmail sender identity
- `Campaign` / `CampaignWithCounts` — campaign with aggregated recipient counts
- `Recipient` / `ImportedRecipient` — per-recipient data with merge variables (ImportRecipient has no `id` field; used for local-only CSV/manual entry)
- `CampaignStatus` — `'draft' | 'queued' | 'running' | 'paused' | 'completed'`
- Recipient statuses: `'pending' | 'sending' | 'sent' | 'failed'`

## Rate Limit Defaults

Hardcoded in schema: `send_rate_seconds = 60`, `daily_cap = 90`. These stay well under Gmail's SMTP ceiling (100/day for free, ~20/hr undocumented behavioral throttle). Campaign defaults are surfaced as user-editable, clamped server-side (`sendRateSeconds >= 30`, `dailyCap ∈ [1, 90]`).

## Dead Code Removed

The following files were confirmed unused and deleted:
- `src/components/RecipientTable.tsx`
- `src/store/campaignSlice.ts`
- `src/store/settingsSlice.ts`
- Dead types `SmtpConfig`, `SendResult`, `CampaignResult` from `src/types/index.ts`
- Legacy auth CSS block (`src/index.css` lines 1158–1579)

### Dark Mode Removed (2025-07-11)
- `src/hooks/useDarkMode.ts` — localStorage + media query hook
- `src/components/ThemeToggle.tsx` — moon/sun button
- `src/index.css` — 350 lines of `[data-theme="dark"]` overrides
- `src/pages/LandingPage.css` — 298 lines of dark mode styles
- `index.html` — inline bootstrap script setting `data-bs-theme`/`data-theme`
- References removed from `App.tsx`, `Layout.tsx`, `LandingPage.tsx`
- Logo SVG background made transparent (`fill="none"`)

## Accessibility

- All form inputs have associated `<label>` elements (via `htmlFor`/`id` pairs)
- Skip-to-content link at top of `Layout`
- Toast notifications use `role="alert"` + `aria-live` region
- Icon-only buttons include `aria-label`
- `:focus-visible` styles added on auth inputs, form controls, slider
- `outline: none` on `:focus` has box-shadow replacement

## Installed Agent Skills (`.agents/skills/`)

- `vercel-react-best-practices` — React 19 hooks, performance, data fetching, bundle optimization
- `vercel-composition-patterns` — Compound components, render props, context, slots (React 19 APIs)
- `vercel-web-design-guidelines` — Design tokens, typography, color systems, accessibility
- `vercel-react-view-transitions` — Native View Transitions API for SPA navigations
- `vercel-optimize` — Edge functions, ISR, caching, Supabase edge integration (if on Vercel)

Load with `skill("skill-name")` in OpenCode sessions.
