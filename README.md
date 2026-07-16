# DeadlineIQ

Automated monitoring of e-commerce platform policies and tax authority websites, with plain-English AI summaries delivered by email — built for Amazon sellers, Shopify brands, TikTok Shop sellers, SMBs, and accounting firms.

DeadlineIQ watches official sources (Amazon Seller Central, Shopify legal pages, TikTok Shop policies, IRS guidance, and 15 state tax authorities), detects when their content changes, summarizes what changed with a citation to the official source, and alerts subscribers — instantly for urgent changes, weekly for everything else, plus 14-day and 3-day reminders before filing deadlines.

> **Legal positioning:** DeadlineIQ is an informational monitoring tool. It does not provide legal, tax, or compliance advice. Every summary uses non-directive language and cites the official source.

## Architecture

| Component | Tech | Deploys to |
|---|---|---|
| Web app (`/`) | Next.js 14 (App Router), Tailwind, shadcn/ui | Vercel |
| Database + auth | Supabase (Postgres, RLS, Supabase Auth) | Supabase |
| Billing | Stripe subscriptions (Checkout + Customer Portal + webhooks) | — |
| Scraper worker (`/scraper`) | Node.js + node-cron + cheerio + OpenAI | Railway |
| Transactional email | Resend | — |
| Error monitoring | Sentry (optional — activates when DSN is set) | — |

### How the pieces fit together

1. **Signup** — Supabase Auth creates the user; a DB trigger creates the profile row and starts a **14-day free trial** (full access, no card).
2. **Sources** — users subscribe to monitored sources on `/markets`. A Postgres policy (`can_subscribe_to_source`) enforces plan entitlements server-side.
3. **Scraper** (every 6 hours) — fetches each active source URL, hashes the extracted text, and on change stores a snapshot and asks OpenAI (`gpt-4o-mini`) for a structured, non-directive summary with urgency level and any deadline date.
4. **Email** — urgent updates trigger instant alerts to entitled subscribers; a Monday digest covers the week; a daily job sends 14-day and 3-day deadline reminders (deduplicated via the `deadline_reminders` table).
5. **Billing** — Stripe Checkout starts a subscription; webhooks keep `users.plan` / `users.subscription_status` in sync; the middleware locks expired users out of the app (except billing/settings).

## Plans

| Plan | Price | Entitlements |
|---|---|---|
| `starter` — Single Platform | $49/mo | 1 e-commerce platform source (Amazon, Shopify, or TikTok Shop) |
| `pro` — Multi-Platform + Federal | $99/mo | All 3 platforms + IRS federal sources |
| `business` — Full Coverage | $149/mo | Everything, including 15 state tax authorities |

The free trial grants `business`-level access for 14 days. Entitlements are enforced in three places that must stay in sync: `src/lib/plans.ts` (web), `scraper/src/entitlements.ts` (email delivery), and `supabase/migrations/005_trials_plan_gating_reminders.sql` (database policy).

## Local development

### 1. Supabase

Create a project at [supabase.com](https://supabase.com), then run the migrations **in order** in the SQL Editor:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_seed_markets.sql
supabase/migrations/003_pivot_schema.sql   -- pivots the 001/002 schema; users table survives
supabase/migrations/004_seed_sources.sql
supabase/migrations/005_trials_plan_gating_reminders.sql
```

### 2. Stripe

Create three recurring monthly products in the Stripe Dashboard ($49 / $99 / $149) and copy their price IDs. Add a webhook endpoint pointing at `https://<your-domain>/api/webhooks/stripe` with these events:

- `checkout.session.completed`
- `customer.subscription.created` / `updated` / `deleted`
- `invoice.payment_failed`

For local webhook testing: `stripe listen --forward-to localhost:3003/api/webhooks/stripe`

### 3. Web app

```bash
cp .env.local.example .env.local   # fill in every value
npm install
npm run dev                        # http://localhost:3003
```

### 4. Scraper worker

```bash
cd scraper
cp .env.example .env               # fill in every value
npm install
npm run dev
```

The worker scrapes on startup and then on a schedule:
- every 6 hours — scrape all active sources
- daily 1 PM UTC — deadline reminders (14-day + 3-day)
- Monday 8 AM UTC — weekly digest

## Deployment

**Web (Vercel):** import the repo, set every variable from `.env.local.example`, and set `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` to the production domain. Sentry activates automatically when `NEXT_PUBLIC_SENTRY_DSN` is set (source-map upload additionally needs `SENTRY_AUTH_TOKEN`).

**Scraper (Railway):** create a service from the `/scraper` directory (`railway.json` is already configured), and set the variables from `scraper/.env.example`.

**Email (Resend):** verify your sending domain, then set `RESEND_FROM_EMAIL` to an address on it.

## Installable app (PWA)

DeadlineIQ ships a web app manifest (`src/app/manifest.ts`) and icons (`public/icons/`), so once deployed over HTTPS users can install it as an app: **Install app** from the address bar in Chrome/Edge on desktop, or **Add to Home Screen** on iOS/Android. The installed app opens straight to the dashboard in a standalone window.

## Pre-launch checklist

- [ ] Replace the placeholders in `src/app/terms/page.tsx` and `src/app/privacy/page.tsx` (company name, state) and have an attorney review both.
- [ ] Verify/refresh the `scrape_urls` seeded in migration 004 — official pages move.
- [ ] Create Stripe products in live mode and swap the test keys.
- [ ] Verify the Resend sending domain (SPF/DKIM).
- [ ] Confirm Supabase email templates (confirm signup, reset password) point at the production domain.

## Repository layout

```
src/app/(auth)/         login, signup, password reset
src/app/(dashboard)/    dashboard, updates feed, source picker, settings, billing
src/app/api/            auth callback/signout, Stripe checkout/portal/webhooks
src/components/         dashboard components, marketing components, shadcn/ui primitives
src/lib/plans.ts        plan entitlement logic (mirrored in scraper + DB)
src/middleware.ts       session refresh, auth guard, trial/subscription gate
scraper/src/            worker: scrape → diff → AI analysis → alerts/digests/reminders
supabase/migrations/    ordered SQL migrations (run 001 → 005)
```
