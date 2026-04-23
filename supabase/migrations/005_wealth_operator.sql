-- ============================================================
-- Migration 005: Wealth Operator
-- Tables for tracking business acquisition, capital injection,
-- and job opportunities for the autonomous wealth operator.
-- ============================================================

-- ── Opportunity type / grade / status enums ──────────────────

create type wealth_opp_type   as enum ('acquisition', 'capital_injection', 'job');
create type wealth_opp_grade  as enum ('A+', 'A', 'B', 'C');
create type wealth_opp_status as enum ('new', 'reviewed', 'contacted', 'passed', 'pursuing');

-- ── Main opportunities table ─────────────────────────────────

create table public.wealth_opportunities (
  id                    uuid default gen_random_uuid() primary key,
  opportunity_type      wealth_opp_type not null,

  -- Universal fields
  name                  text not null,
  description           text,
  location              text,
  source_url            text,
  source_platform       text,      -- 'bizbuysell' | 'empireflippers' | 'craigslist' | 'indeed' | 'linkedin' | etc.
  external_id           text,      -- unique ID from the source platform (for dedup)
  status                wealth_opp_status not null default 'new',
  grade                 wealth_opp_grade,
  listing_date          date,

  -- ── Business acquisition / capital injection fields ───────
  asking_price          numeric,
  revenue_annual        numeric,
  cash_flow_annual      numeric,   -- EBITDA / SDE
  staff_count           int,
  owner_hours_per_week  int,
  passive_possible      boolean,
  equity_needed         numeric,   -- my equity contribution
  financing_options     text[],    -- ['SBA', 'seller_note', 'earnout', 'partner']
  debt_service_annual   numeric,
  cash_on_cash_return   numeric,   -- as a percentage e.g. 22.5
  risk_score            int check (risk_score between 1 and 10),
  business_type         text,      -- 'car_wash' | 'laundromat' | 'vending' | etc.
  seller_motivation     text,

  -- ── Job fields ────────────────────────────────────────────
  firm_name             text,
  job_title             text,
  estimated_comp_low    numeric,
  estimated_comp_high   numeric,
  fit_score             int check (fit_score between 1 and 10),
  difficulty_score      int check (difficulty_score between 1 and 10),
  warm_outreach         boolean,

  -- ── AI underwriting output ────────────────────────────────
  ai_summary            text,
  ai_rationale          text,
  ai_risks              text,
  ai_action_items       text[],
  ai_next_step          text,

  -- ── Metadata ─────────────────────────────────────────────
  found_at              timestamptz default now() not null,
  updated_at            timestamptz default now() not null,
  alert_sent_at         timestamptz,

  -- Dedup: same external ID on same platform = same listing
  unique (source_platform, external_id)
);

create trigger wealth_opp_updated_at
  before update on public.wealth_opportunities
  for each row execute function public.handle_updated_at();

-- ── Outreach drafts table ────────────────────────────────────

create table public.wealth_outreach (
  id                   uuid default gen_random_uuid() primary key,
  opportunity_id       uuid references public.wealth_opportunities(id) on delete cascade not null,
  outreach_type        text not null check (outreach_type in ('broker', 'owner', 'job')),
  recipient_name       text,
  recipient_email      text,
  subject              text not null,
  body                 text not null,
  sent_at              timestamptz,
  follow_up_due_at     timestamptz,
  response_at          timestamptz,
  created_at           timestamptz default now() not null
);

-- ── Digest log ───────────────────────────────────────────────

create table public.wealth_digest_log (
  id              uuid default gen_random_uuid() primary key,
  sent_at         timestamptz default now() not null,
  recipient_email text not null,
  subject         text,
  total_opps      int,
  a_plus_count    int,
  a_count         int,
  b_count         int
);

-- ── Indexes ──────────────────────────────────────────────────

create index wealth_opp_type_idx     on public.wealth_opportunities(opportunity_type);
create index wealth_opp_grade_idx    on public.wealth_opportunities(grade);
create index wealth_opp_status_idx   on public.wealth_opportunities(status);
create index wealth_opp_found_at_idx on public.wealth_opportunities(found_at desc);
create index wealth_opp_platform_idx on public.wealth_opportunities(source_platform);
create index wealth_outreach_opp_idx on public.wealth_outreach(opportunity_id);
