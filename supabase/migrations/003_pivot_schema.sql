-- ============================================================
-- HostWatch — Migration 003: Pivot to E-commerce Policy & Tax Monitoring
--
-- IMPORTANT: Run this AFTER 001_initial_schema.sql and 002_seed_markets.sql
-- This replaces the STR-focused schema with the e-commerce/tax monitoring schema.
--
-- Safe to run: drops only tables introduced in Migration 001/002.
-- The `users` table and its trigger/function are unchanged.
-- ============================================================


-- ============================================================
-- DROP OLD STR TABLES (reverse dependency order)
-- ============================================================
drop table if exists public.user_alert_reads  cascade;
drop table if exists public.alerts            cascade;
drop table if exists public.scrape_snapshots  cascade;
drop table if exists public.user_markets      cascade;
drop table if exists public.markets           cascade;


-- ============================================================
-- TABLE: sources
-- A monitored source: Amazon policy page, IRS page, state tax authority, etc.
-- Managed by us — users choose which sources to subscribe to, not create them.
-- ============================================================
create table public.sources (
  id            uuid default gen_random_uuid() primary key,
  name          text not null,
  source_type   text not null check (source_type in ('platform', 'federal', 'state')),
  platform_tag  text not null check (platform_tag in ('amazon', 'shopify', 'tiktok', 'irs', 'state_tax', 'general')),
  jurisdiction  text not null,   -- e.g. "Federal", "CA", "NY", "Platform"
  scrape_urls   text[] not null default '{}',
  is_active     boolean not null default true,
  created_at    timestamptz default now() not null
);


-- ============================================================
-- TABLE: user_sources
-- Which sources each user has chosen to monitor
-- ============================================================
create table public.user_sources (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.users(id) on delete cascade not null,
  source_id   uuid references public.sources(id) on delete cascade not null,
  created_at  timestamptz default now() not null,
  unique(user_id, source_id)
);


-- ============================================================
-- TABLE: scrape_snapshots
-- Content fingerprints + full archived text from each scrape run.
-- Enables diff comparison and version history.
-- ============================================================
create table public.scrape_snapshots (
  id              uuid default gen_random_uuid() primary key,
  source_id       uuid references public.sources(id) on delete cascade not null,
  url             text not null,
  content_hash    text not null,       -- SHA-256 of page content
  raw_content     text not null,       -- Full archived text
  version_number  int not null default 1,
  scraped_at      timestamptz default now() not null
);


-- ============================================================
-- TABLE: updates
-- AI-analyzed policy/regulatory changes detected by the scraper.
--
-- LEGAL NOTE: All summaries are informational only.
-- They do not constitute legal, tax, or compliance advice.
-- The `summary` field must always cite the official source.
-- The `action_items` field must use non-directive language.
-- ============================================================
create table public.updates (
  id                   uuid default gen_random_uuid() primary key,
  source_id            uuid references public.sources(id) on delete cascade not null,
  snapshot_id          uuid references public.scrape_snapshots(id) on delete set null,

  -- Content fields
  title                text not null,
  summary              text not null,         -- AI-generated, informational only
  full_text_snapshot   text,                  -- Archived original text
  action_items         text[] not null default '{}',  -- Non-directive language only

  -- Classification
  urgency_level        text not null check (urgency_level in (
                          'informational', 'policy_change', 'deadline_based', 'high_urgency'
                        )),
  urgency_reason       text not null,
  jurisdiction         text not null,
  industry_tag         text not null check (industry_tag in (
                          'amazon', 'shopify', 'tiktok', 'tax_federal', 'tax_state', 'general'
                        )),

  -- Dates
  effective_date       date,
  deadline_date        date,
  publication_date     date,

  -- Source traceability (REQUIRED for every update)
  source_url           text not null,         -- Direct link to official source
  relevance_score      numeric(3,2) not null check (relevance_score >= 0 and relevance_score <= 1),
  raw_diff             text,

  created_at           timestamptz default now() not null
);


-- ============================================================
-- TABLE: user_update_reads
-- Tracks which updates each user has already read.
-- Used for unread badges and counts in the dashboard.
-- ============================================================
create table public.user_update_reads (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.users(id) on delete cascade not null,
  update_id   uuid references public.updates(id) on delete cascade not null,
  read_at     timestamptz default now() not null,
  unique(user_id, update_id)
);


-- ============================================================
-- INDEXES
-- ============================================================
create index user_sources_user_id_idx         on public.user_sources(user_id);
create index user_sources_source_id_idx       on public.user_sources(source_id);
create index scrape_snapshots_source_id_idx   on public.scrape_snapshots(source_id);
create index scrape_snapshots_url_idx         on public.scrape_snapshots(url);
create index updates_source_id_idx            on public.updates(source_id);
create index updates_created_at_idx           on public.updates(created_at desc);
create index updates_urgency_level_idx        on public.updates(urgency_level);
create index updates_deadline_date_idx        on public.updates(deadline_date);
create index updates_industry_tag_idx         on public.updates(industry_tag);
create index updates_jurisdiction_idx         on public.updates(jurisdiction);
create index user_update_reads_user_id_idx    on public.user_update_reads(user_id);
create index user_update_reads_update_id_idx  on public.user_update_reads(update_id);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- ---- sources ----
alter table public.sources enable row level security;

create policy "Authenticated users can read sources"
  on public.sources for select
  to authenticated
  using (true);

-- ---- user_sources ----
alter table public.user_sources enable row level security;

create policy "Users can read own source subscriptions"
  on public.user_sources for select
  using (auth.uid() = user_id);

create policy "Users can subscribe to a source"
  on public.user_sources for insert
  with check (auth.uid() = user_id);

create policy "Users can unsubscribe from a source"
  on public.user_sources for delete
  using (auth.uid() = user_id);

-- ---- scrape_snapshots ----
alter table public.scrape_snapshots enable row level security;

create policy "Users can read snapshots for their sources"
  on public.scrape_snapshots for select
  using (
    exists (
      select 1 from public.user_sources
      where user_sources.source_id = scrape_snapshots.source_id
        and user_sources.user_id = auth.uid()
    )
  );

-- ---- updates ----
alter table public.updates enable row level security;

create policy "Users can read updates for their sources"
  on public.updates for select
  using (
    exists (
      select 1 from public.user_sources
      where user_sources.source_id = updates.source_id
        and user_sources.user_id = auth.uid()
    )
  );

-- ---- user_update_reads ----
alter table public.user_update_reads enable row level security;

create policy "Users can read own update reads"
  on public.user_update_reads for select
  using (auth.uid() = user_id);

create policy "Users can mark updates as read"
  on public.user_update_reads for insert
  with check (auth.uid() = user_id);

create policy "Users can unmark update reads"
  on public.user_update_reads for delete
  using (auth.uid() = user_id);
