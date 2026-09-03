-- Run once in Supabase Dashboard -> SQL Editor.
-- Adds media fields for community posts/comments and creates a public media bucket.

alter table public.posts
  add column if not exists media_url text,
  add column if not exists media_type text;

alter table public.comments
  add column if not exists media_url text,
  add column if not exists media_type text;

-- Older deployments stored post images in image_url. Backfill only when that
-- legacy column exists so fresh schemas can run this migration safely.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'posts'
      and column_name = 'image_url'
  ) then
    execute $sql$
      update public.posts
      set media_url = image_url, media_type = 'image'
      where media_url is null and image_url is not null
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'posts_media_type_check') then
    alter table public.posts
      add constraint posts_media_type_check check (media_type is null or media_type in ('image', 'video'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'comments_media_type_check') then
    alter table public.comments
      add constraint comments_media_type_check check (media_type is null or media_type in ('image', 'video'));
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-media',
  'community-media',
  true,
  31457280,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Community users upload own media" on storage.objects;
create policy "Community users upload own media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'community-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Community users delete own media" on storage.objects;
create policy "Community users delete own media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'community-media'
  and owner_id = (select auth.uid()::text)
);
