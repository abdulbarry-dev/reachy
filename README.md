<div align="center">
  <br />
  <img src="public/logo.svg" alt="Reachy" width="80" />
  <h1>Reachy</h1>
  <p><strong>Open-source cold email outreach automation</strong></p>
  <p>
    Secure Gmail SMTP · pg_cron cadenced dispatch · Vault-encrypted secrets
  </p>
  <br />
</div>

## Overview

Reachy is a full-stack, open-source platform for sending cold email campaigns at scale while respecting Gmail's sending thresholds. It was built with deliverability and security as first-class concerns — passwords are stored in Supabase Vault, sends are throttled via `pg_cron`, and every outbound email is dispatched through your own Gmail SMTP connection.

Whether you're a solo founder running outbound or a team coordinating multi-campaign workflows, Reachy gives you a clean dashboard to manage accounts, compose templates, upload CSV recipients, and monitor dispatch status — all without a third-party email service.

## Features

- **Gmail SMTP Integration** — Connect your own Gmail account via app password; credentials are encrypted in Supabase Vault.
- **Campaign Management** — Create, queue, start, pause, and track campaigns with real-time status.
- **CSV / Excel Import** — Upload recipient lists with merge variables via drag-and-drop.
- **Cadenced Dispatch** — `pg_cron` ticks every 60 seconds; one email sent per tick. No 150-second Edge Function timeout.
- **Rate Limits** — Configurable per-campaign send rate (default 60s) and daily cap (default 90) — stays well under Gmail's free-tier ceiling.
- **Merge Variables** — Personalize subject lines and body with `{{first_name}}`, `{{company}}`, etc.
- **PDF Attachments** — Generate and attach PDFs to individual sends.
- **Authentication** — Supabase email/password auth with protected routes.
- **Responsive UI** — Framer Motion animations, Bootstrap 5, mobile sidebar overlay.
- **Branded Auth** — Login / signup / reset-password with inline SVG branding.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript 6, Vite 8, Redux Toolkit |
| UI | Bootstrap 5, Framer Motion |
| Backend | Supabase (Postgres, Auth, Edge Functions, Vault) |
| Edge Runtime | Deno (`supabase/functions/`) |
| Scheduling | `pg_cron` + `pg_net` |
| Linter | oxlint (`.oxlintrc.json`) |

## Project Structure

```
reachy/
├── public/                      # Static assets (logo, favicon, icons)
├── src/
│   ├── components/              # Shared UI components
│   │   ├── AnimatedPage.tsx     # Page-level fade-in wrapper
│   │   ├── ConfirmModal.tsx     # Reusable confirmation dialog
│   │   ├── FileDropzone.tsx     # CSV/Excel drag-and-drop upload
│   │   ├── Layout.tsx           # App shell with sidebar + mobile top bar
│   │   ├── StatCard.tsx         # Dashboard stat card
│   │   ├── ToastProvider.tsx    # Toast notification context
│   │   └── ...
│   ├── pages/                   # Route-level page components
│   │   ├── Auth.tsx             # Login / signup / reset-password
│   │   ├── Dashboard.tsx        # Campaign overview
│   │   ├── Compose.tsx          # Campaign composer
│   │   ├── Recipients.tsx       # Recipient import & management
│   │   ├── CampaignDetail.tsx   # Per-campaign detail view
│   │   ├── Settings.tsx         # Email account settings
│   │   └── LandingPage.tsx      # Public marketing page
│   ├── store/                   # Redux Toolkit slices
│   ├── hooks/                   # Custom React hooks
│   ├── types/                   # TypeScript type definitions
│   ├── lib/                     # Supabase client
│   ├── utils/                   # Helpers (file parsers, etc.)
│   └── index.css                # Global styles + design tokens
├── supabase/
│   ├── functions/               # Deno Edge Functions
│   │   ├── connect-email-account/
│   │   ├── create-campaign/
│   │   ├── start-campaign/
│   │   └── dispatch-sends/
│   └── migrations/              # SQL schema migrations
├── .env.example                 # Environment variable template
├── .oxlintrc.json               # Linter configuration
├── AGENTS.md                    # opencode / AI agent context
└── package.json
```

## Getting Started

### Prerequisites

- Node.js ≥ 22
- A Supabase project (free tier works)
- A Gmail account with an [app password](https://support.google.com/accounts/answer/185833)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/abdulbarry-dev/reachy.git
cd reachy

# 2. Install dependencies
npm install

# 3. Copy the environment template and fill in your Supabase credentials
cp .env.example .env

# 4. Apply the database migration
#    (via Supabase Dashboard SQL editor or supabase CLI)

# 5. Deploy Edge Functions
#    (via Supabase Dashboard or supabase CLI)

# 6. Start the dev server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=       # Your Supabase project URL
VITE_SUPABASE_ANON_KEY=  # Your Supabase anon / publishable key
```

Edge Function secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are set in the Supabase Dashboard, **not** in `.env`.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run lint` | Run oxlint |
| `npm run preview` | Preview production build |
| `npx tsc --noEmit` | Type-check only |

## Architecture

### Dispatch Pipeline

Sends are **not** handled in a loop inside an Edge Function (which would hit the 150-second timeout). Instead:

1. `pg_cron` runs every 60 seconds.
2. Each tick calls `dispatch-sends` via `pg_net`.
3. The Edge Function picks **one** pending recipient, sends via nodemailer, and marks it `sent` or `failed`.
4. The cycle repeats on the next tick.

This keeps each invocation lightweight and avoids timeouts.

### Auth Flow

- Supabase email/password authentication.
- Session is restored on mount via `getSession()` + `onAuthStateChange`.
- Protected routes redirect to `/login` if unauthenticated.
- Edge Functions verify the caller via `supabase.auth.getUser(token)` using the service role key.

### Security

- Gmail app passwords are stored in **Supabase Vault** (`vault.create_secret()`), never in plaintext columns.
- Row-Level Security (RLS) ensures users only see their own data.
- `Authorization: Bearer <token>` is passed from client to Edge Functions.

## Contributing

We welcome contributions from the community. This is an open-source collaboration project, and all skill levels are encouraged to participate.

### How to Contribute

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature`.
3. Make your changes and ensure the build passes (`npm run build && npm run lint`).
4. Open a pull request with a clear description of the change.

### Code Style

- TypeScript with `verbatimModuleSyntax` — use `import type` for type-only imports.
- `noUnusedLocals` and `noUnusedParameters` are enabled — clean up unused code.
- Linting uses **oxlint** (not ESLint); config is in `.oxlintrc.json`.
- Follow existing component conventions (file structure, naming, imports).

### Commit Guidelines

We use conventional commit messages:

```
feat: add CSV export for recipient list
fix: correct overlay panel transition on auth page
refactor: extract AuthInput into shared component
docs: update README with API reference
```

## Roadmap

- [ ] CSV / Excel template generator
- [ ] A/B subject-line testing
- [ ] Email open / click tracking
- [ ] Team collaboration (multi-user campaigns)
- [ ] Webhook callbacks for send status
- [ ] Analytics dashboard with charts

## License

This project is open source under the [MIT License](LICENSE).

## Maintainer

**Abdulbarry Guenichi** — Full-stack developer & open-source contributor.

- GitHub: [@abdulbarry-dev](https://github.com/abdulbarry-dev)
- X: [@AbdulbarryG](https://x.com/AbdulbarryG)
- LinkedIn: [abdulbarryguenichi](https://www.linkedin.com/in/abdulbarryguenichi/)

---

<div align="center">
  <sub>Built with React 19 · TypeScript 6 · Vite 8 · Supabase · Bootstrap 5</sub>
</div>
