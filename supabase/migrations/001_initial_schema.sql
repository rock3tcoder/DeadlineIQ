-- ============================================================
-- HostWatch — Migration 001: Initial Schema
-- Run this first in the Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";


-- ============================================================
-- TABLE: users
-- One row per user. Linked to Supabase Auth (auth.users).
-- Stores plan, billing status, and trial info.
-- ============================================================
create table public.users (
  id                    uuid references auth.users(id) on delete cascade primary key,
  email                 text not null,
  full_name             text,
  plan                  text check (plan in ('starter', 'pro', 'business')),
  subscription_status   text check (subscription_status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  stripe_customer_id    text unique,
  stripe_subscription_id text unique,
  trial_ends_at         timestamptz,
  created_at            timestamptz default now() not null,
  updated_at            timestamptz default now() not null
);

-- Automatically update the updated_at column whenever a user row changes
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

-- Automatically create a users row the moment someone signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- TABLE: markets
-- A city/region that HostWatch monitors for regulation changes.
-- This is a shared list managed by us — users don't create markets.
-- gov_urls is an array of government URLs to scrape for that city.
-- ============================================================
create table public.markets (
  id          uuid default gen_random_uuid() primary key,
  city        text not null,
  state       text not null,
  country     text not null default 'US',
  gov_urls    text[] not null default '{}',
  is_active   boolean not null default true,
  created_at  timestamptz default now() not null
);


-- ============================================================
-- TABLE: user_markets
-- Tracks which markets each user has chosen to monitor.
-- Many-to-many: one user can watch many cities; one city can be
-- watched by many users.
-- ============================================================
create table public.user_markets (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.users(id) on delete cascade not null,
  market_id   uuid references public.markets(id) on delete cascade not null,
  created_at  timestamptz default now() not null,
  unique(user_id, market_id)
);


-- ============================================================
-- TABLE: scrape_snapshots
-- Every time the scraper runs, it stores a fingerprint (hash)
-- of the page content. If the hash changes, a regulation changed.
-- ============================================================
create table public.scrape_snapshots (
  id            uuid default gen_random_uuid() primary key,
  market_id     uuid references public.markets(id) on delete cascade not null,
  url           text not null,
  content_hash  text not null,
  raw_content   text not null,
  scraped_at    timestamptz default now() not null
);


-- ============================================================
-- TABLE: alerts
-- Created by the AI when a regulation change is detected and
-- deemed relevant to short-term rental hosts.
-- ============================================================
create table public.alerts (
  id              uuid default gen_random_uuid() primary key,
  market_id       uuid references public.markets(id) on delete cascade not null,
  snapshot_id     uuid references public.scrape_snapshots(id) on delete set null,
  title           text not null,
  summary         text not null,
  action_items    text[] not null default '{}',
  severity        text not null check (severity in ('low', 'medium', 'high', 'critical')),
  severity_reason text not null,
  source_url      text not null,
  relevance_score numeric(3,2) not null check (relevance_score >= 0 and relevance_score <= 1),
  raw_diff        text,
  created_at      timestamptz default now() not null
);


-- ============================================================
-- TABLE: user_alert_reads
-- Tracks which alerts each user has already read.
-- Used to show unread counts and "new" badges in the dashboard.
-- ============================================================
create table public.user_alert_reads (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.users(id) on delete cascade not null,
  alert_id    uuid references public.alerts(id) on delete cascade not null,
  read_at     timestamptz default now() not null,
  unique(user_id, alert_id)
);


-- ============================================================
-- INDEXES (makes queries faster)
-- ============================================================
create index user_markets_user_id_idx       on public.user_markets(user_id);
create index user_markets_market_id_idx     on public.user_markets(market_id);
create index scrape_snapshots_market_id_idx on public.scrape_snapshots(market_id);
create index scrape_snapshots_url_idx       on public.scrape_snapshots(url);
create index alerts_market_id_idx           on public.alerts(market_id);
create index alerts_created_at_idx          on public.alerts(created_at desc);
create index alerts_severity_idx            on public.alerts(severity);
create index user_alert_reads_user_id_idx   on public.user_alert_reads(user_id);
create index user_alert_reads_alert_id_idx  on public.user_alert_reads(alert_id);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Without these policies, no one can read or write any data
-- through the public API — even if they have the anon key.
-- ============================================================

-- ---- users ----
alter table public.users enable row level security;

create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---- markets ----
-- Any logged-in user can browse the list of available cities.
-- Only our service role (scraper/webhooks) can add/edit cities.
alter table public.markets enable row level security;

create policy "Authenticated users can read markets"
  on public.markets for select
  to authenticated
  using (true);

-- ---- user_markets ----
alter table public.user_markets enable row level security;

create policy "Users can read own market subscriptions"
  on public.user_markets for select
  using (auth.uid() = user_id);

create policy "Users can subscribe to a market"
  on public.user_markets for insert
  with check (auth.uid() = user_id);

create policy "Users can unsubscribe from a market"
  on public.user_markets for delete
  using (auth.uid() = user_id);

-- ---- scrape_snapshots ----
-- Users can only see snapshots for cities they are monitoring.
alter table public.scrape_snapshots enable row level security;

create policy "Users can read snapshots for their markets"
  on public.scrape_snapshots for select
  using (
    exists (
      select 1 from public.user_markets
      where user_markets.market_id = scrape_snapshots.market_id
        and user_markets.user_id = auth.uid()
    )
  );

-- ---- alerts ----
-- Users can only see alerts for cities they are monitoring.
alter table public.alerts enable row level security;

create policy "Users can read alerts for their markets"
  on public.alerts for select
  using (
    exists (
      select 1 from public.user_markets
      where user_markets.market_id = alerts.market_id
        and user_markets.user_id = auth.uid()
    )
  );

-- ---- user_alert_reads ----
alter table public.user_alert_reads enable row level security;

create policy "Users can read own alert reads"
  on public.user_alert_reads for select
  using (auth.uid() = user_id);

create policy "Users can mark alerts as read"
  on public.user_alert_reads for insert
  with check (auth.uid() = user_id);

create policy "Users can unmark alert reads"
  on public.user_alert_reads for delete
  using (auth.uid() = user_id);
