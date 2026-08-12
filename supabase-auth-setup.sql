-- 她健康 / Shealth 注册与用户资料基础配置
-- 在 Supabase SQL Editor 中以项目所有者身份运行一次。

begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  displayname text,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists displayname text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username))
  where username is not null and btrim(username) <> '';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  account_name text;
  visible_name text;
begin
  account_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'username'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'user_' || left(new.id::text, 8)
  );
  visible_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'displayname'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    account_name
  );

  insert into public.profiles (id, username, displayname, display_name)
  values (new.id, account_name, visible_name, visible_name)
  on conflict (id) do update set
    username = excluded.username,
    displayname = excluded.displayname,
    display_name = excluded.display_name;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of raw_user_meta_data on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists "profiles are readable" on public.profiles;
create policy "profiles are readable"
  on public.profiles for select
  using (true);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

commit;

-- 重要：当前产品用“账号@floramotion.app”作为内部邮箱，用户无法接收确认信。
-- 请在 Supabase Dashboard > Authentication > Providers > Email 中关闭 Confirm email。
