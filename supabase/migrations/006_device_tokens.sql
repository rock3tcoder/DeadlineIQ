-- ============================================================
-- DeadlineIQ — Migration 006: Device Tokens (mobile push)
-- Run this AFTER 005_trials_plan_gating_reminders.sql
--
-- Stores FCM registration tokens for the native mobile apps.
-- The web app (running inside the Capacitor WebView) upserts the
-- device token after the user grants notification permission; the
-- scraper reads tokens (service role) to send urgent policy alerts
-- via Firebase Cloud Messaging, and deletes tokens FCM reports as
-- unregistered.
-- ============================================================

create table public.device_tokens (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.users(id) on delete cascade not null,
  token       text not null unique,
  platform    text not null check (platform in ('ios', 'android', 'web')),
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create index device_tokens_user_id_idx on public.device_tokens(user_id);

create trigger device_tokens_updated_at
  before update on public.device_tokens
  for each row execute function public.handle_updated_at();

alter table public.device_tokens enable row level security;

create policy "Users can read own device tokens"
  on public.device_tokens for select
  using (auth.uid() = user_id);

create policy "Users can register own device tokens"
  on public.device_tokens for insert
  with check (auth.uid() = user_id);

-- Upsert path: refreshing a token you already own.
-- (If a device switches accounts, the old row is removed by the
-- scraper when FCM reports the token unregistered, or on sign-out.)
create policy "Users can update own device tokens"
  on public.device_tokens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can remove own device tokens"
  on public.device_tokens for delete
  using (auth.uid() = user_id);
