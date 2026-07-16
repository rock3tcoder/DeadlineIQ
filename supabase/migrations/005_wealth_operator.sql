-- ============================================================
-- Wealth Operator — Migration 005
-- Tracks business acquisition, capital injection, and job
-- opportunities discovered by the autonomous scraper.
--
-- H1B constraint: all outreach is DRAFT ONLY — nothing is
-- sent automatically. The wealth_alerts table records drafts.
-- ============================================================

-- ─── Objective A: Businesses for sale ───────────────────────
create table public.wealth_businesses (
  id                  uuid default gen_random_uuid() primary key,
  source              text not null,              -- 'bizbuysell', 'acquire', 'flippa'
  title               text not null,
  description         text,
  asking_price_cents  bigint,                     -- null = undisclosed
  revenue_cents       bigint,                     -- annual gross
  cash_flow_cents     bigint,                     -- annual SDE / EBITDA
  industry            text,
  location            text,
  listing_url         text not null,
  is_passive_eligible boolean not null default false,  -- H1B passive-ownership filter
  raw_snippet         text,
  first_seen_at       timestamptz default now() not null,
  last_seen_at        timestamptz default now() not null,
  alerted_at          timestamptz
);

create unique index on public.wealth_businesses (source, listing_url);
create index on public.wealth_businesses (first_seen_at desc);
create index on public.wealth_businesses (is_passive_eligible) where is_passive_eligible = true;
create index on public.wealth_businesses (alerted_at) where alerted_at is null;


-- ─── Objective B: Capital injection / equity opportunities ───
create table public.wealth_capital_opportunities (
  id                    uuid default gen_random_uuid() primary key,
  source                text not null,            -- 'acquire', 'flippa'
  company_name          text not null,
  description           text,
  amount_seeking_cents  bigint,                   -- asking / investment amount
  equity_pct            numeric(5,2),             -- % equity offered (if applicable)
  industry              text,
  location              text,
  listing_url           text not null,
  raw_snippet           text,
  first_seen_at         timestamptz default now() not null,
  last_seen_at          timestamptz default now() not null,
  alerted_at            timestamptz
);

create unique index on public.wealth_capital_opportunities (source, listing_url);
create index on public.wealth_capital_opportunities (first_seen_at desc);
create index on public.wealth_capital_opportunities (alerted_at) where alerted_at is null;


-- ─── Objective C: NYC jobs paying $250k+ ────────────────────
create table public.wealth_jobs (
  id                uuid default gen_random_uuid() primary key,
  source            text not null,               -- 'builtin_nyc', 'ladders'
  job_title         text not null,
  company           text,
  salary_min_cents  bigint,
  salary_max_cents  bigint,
  location          text,
  description       text,
  listing_url       text not null,
  posted_at         timestamptz,
  raw_snippet       text,
  first_seen_at     timestamptz default now() not null,
  alerted_at        timestamptz
);

create unique index on public.wealth_jobs (source, listing_url);
create index on public.wealth_jobs (first_seen_at desc);
create index on public.wealth_jobs (salary_max_cents desc nulls last);
create index on public.wealth_jobs (alerted_at) where alerted_at is null;


-- ─── Objective D: Alert / outreach draft log ────────────────
-- Records every draft outreach email generated.
-- sent_at is intentionally never populated by automation —
-- the user copies the draft and sends it manually.
create table public.wealth_alerts (
  id              uuid default gen_random_uuid() primary key,
  category        text not null check (category in ('business', 'capital', 'job')),
  reference_id    uuid not null,
  draft_subject   text not null,
  draft_body_text text not null,
  notified_at     timestamptz default now() not null
);

create index on public.wealth_alerts (notified_at desc);
create index on public.wealth_alerts (category, reference_id);
