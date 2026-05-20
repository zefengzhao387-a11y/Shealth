-- Backfill displayname for existing profiles/users
-- Run in Supabase SQL Editor as project owner/postgres role.

begin;

-- Ensure target column exists.
alter table public.profiles
add column if not exists displayname text;

-- Fill missing/empty profiles.displayname from the best available source.
update public.profiles as p
set displayname = coalesce(
  nullif(btrim(p.displayname), ''),
  nullif(btrim(p.display_name), ''),
  nullif(btrim(p.username), ''),
  nullif(btrim(u.raw_user_meta_data ->> 'displayname'), ''),
  nullif(btrim(u.raw_user_meta_data ->> 'display_name'), ''),
  nullif(btrim(u.raw_user_meta_data ->> 'username'), ''),
  nullif(split_part(u.email, '@', 1), ''),
  '花间用户'
)
from auth.users as u
where p.id = u.id
  and (p.displayname is null or btrim(p.displayname) = '');

-- Keep auth metadata aligned for future fallback usage.
update auth.users as u
set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
  'displayname',
  coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'displayname'), ''),
    nullif(btrim(u.raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(p.displayname), ''),
    nullif(btrim(p.username), ''),
    '花间用户'
  )
)
from public.profiles as p
where p.id = u.id
  and (
    u.raw_user_meta_data ->> 'displayname' is null
    or btrim(u.raw_user_meta_data ->> 'displayname') = ''
  );

-- Optional search index for ilike lookups.
create index if not exists idx_profiles_displayname on public.profiles (displayname);

commit;

