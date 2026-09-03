-- Run once in Supabase Dashboard -> SQL Editor.
-- Stores one row for every date the user marks as a period day.

create table if not exists public.period_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  record_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, record_date)
);

alter table public.period_records enable row level security;

drop policy if exists "Users read own period records" on public.period_records;
create policy "Users read own period records"
on public.period_records for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users create own period records" on public.period_records;
create policy "Users create own period records"
on public.period_records for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete own period records" on public.period_records;
create policy "Users delete own period records"
on public.period_records for delete to authenticated
using ((select auth.uid()) = user_id);

create index if not exists period_records_user_date_idx
on public.period_records (user_id, record_date desc);
