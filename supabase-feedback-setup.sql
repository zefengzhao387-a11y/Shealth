-- 她健康 / Shealth 用户评价与建议
-- 在 Supabase Dashboard -> SQL Editor 中以项目所有者身份运行一次。

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  category text not null check (category in ('使用体验', '功能建议', '内容反馈', '问题报告')),
  message text not null check (char_length(message) between 4 and 500),
  page_path text,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

drop policy if exists "Users submit own feedback" on public.feedback;
create policy "Users submit own feedback"
on public.feedback for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users read own feedback" on public.feedback;
create policy "Users read own feedback"
on public.feedback for select to authenticated
using ((select auth.uid()) = user_id);

create index if not exists feedback_created_at_idx
on public.feedback (created_at desc);

create index if not exists feedback_user_id_idx
on public.feedback (user_id, created_at desc);
