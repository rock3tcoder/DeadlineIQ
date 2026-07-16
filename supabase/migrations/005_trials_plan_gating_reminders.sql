-- ============================================================
-- DeadlineIQ — Migration 005: Trials, Plan Gating & Deadline Reminders
-- Run this AFTER 004_seed_sources.sql
--
-- 1. Starts the 14-day free trial automatically at signup
--    (and backfills existing users who never got one).
-- 2. Adds deadline_reminders — tracks which 14-day / 3-day
--    deadline reminder emails have been sent, so the scraper
--    never sends the same reminder twice.
-- 3. Enforces plan entitlements at the database level:
--    users can only subscribe to sources their plan (or active
--    trial) includes, regardless of what the client sends.
-- ============================================================


-- ============================================================
-- 1. FREE TRIAL AT SIGNUP
-- ============================================================

-- New signups: start a 14-day trial immediately
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, subscription_status, trial_ends_at)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'trialing',
    now() + interval '14 days'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Backfill: existing users who never received a trial window.
-- Users with an active/past_due paid subscription don't need one.
update public.users
set trial_ends_at = now() + interval '14 days',
    subscription_status = coalesce(subscription_status, 'trialing')
where trial_ends_at is null
  and (subscription_status is null or subscription_status not in ('active', 'past_due'));


-- ============================================================
-- 2. TABLE: deadline_reminders
-- One row per (update, user, reminder type) that has been sent.
-- Written only by the scraper (service role) — users can read
-- their own rows for a future "reminder history" view.
-- ============================================================
create table public.deadline_reminders (
  id             uuid default gen_random_uuid() primary key,
  update_id      uuid references public.updates(id) on delete cascade not null,
  user_id        uuid references public.users(id) on delete cascade not null,
  reminder_type  text not null check (reminder_type in ('14_day', '3_day')),
  sent_at        timestamptz default now() not null,
  unique(update_id, user_id, reminder_type)
);

create index deadline_reminders_update_id_idx on public.deadline_reminders(update_id);
create index deadline_reminders_user_id_idx   on public.deadline_reminders(user_id);

alter table public.deadline_reminders enable row level security;

create policy "Users can read own deadline reminders"
  on public.deadline_reminders for select
  using (auth.uid() = user_id);

-- No insert/update/delete policies: only the service role writes here.


-- ============================================================
-- 3. PLAN ENTITLEMENTS
--
-- Effective plan resolution:
--   - Paid subscription (active / trialing via Stripe / past_due
--     grace period) → the purchased plan
--   - In-app free trial still running → 'business' (full access)
--   - Otherwise → no access
--
-- Entitlements:
--   starter  → 1 e-commerce platform source (amazon/shopify/tiktok)
--   pro      → all platform sources + IRS federal
--   business → everything (incl. state sales tax)
-- ============================================================

create or replace function public.effective_plan(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when u.plan is not null
     and u.subscription_status in ('active', 'trialing', 'past_due')
      then u.plan
    when u.trial_ends_at is not null and u.trial_ends_at > now()
      then 'business'
    else null
  end
  from public.users u
  where u.id = p_user_id
$$;

create or replace function public.can_subscribe_to_source(p_source_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_plan           text := public.effective_plan(auth.uid());
  v_tag            text;
  v_platform_count int;
begin
  if v_plan is null then
    return false;
  end if;

  select platform_tag into v_tag
  from public.sources
  where id = p_source_id;

  if v_tag is null then
    return false;
  end if;

  if v_plan = 'business' then
    return true;
  end if;

  if v_plan = 'pro' then
    return v_tag in ('amazon', 'shopify', 'tiktok', 'irs');
  end if;

  -- starter: exactly one e-commerce platform source
  if v_tag not in ('amazon', 'shopify', 'tiktok') then
    return false;
  end if;

  select count(*) into v_platform_count
  from public.user_sources us
  join public.sources s on s.id = us.source_id
  where us.user_id = auth.uid()
    and s.platform_tag in ('amazon', 'shopify', 'tiktok');

  return v_platform_count < 1;
end;
$$;

-- Replace the unrestricted insert policy with a plan-aware one
drop policy "Users can subscribe to a source" on public.user_sources;

create policy "Users can subscribe to a source within their plan"
  on public.user_sources for insert
  with check (
    auth.uid() = user_id
    and public.can_subscribe_to_source(source_id)
  );
