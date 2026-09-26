-- ============================================================================
--  MIGRATION 004 — Lesson progress tracking (mark-complete + streaks)
--  Run in Supabase → SQL Editor. Safe to re-run.
-- ============================================================================

create table if not exists public.lesson_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  lesson_id    uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index if not exists idx_progress_user on public.lesson_progress(user_id);
create index if not exists idx_progress_lesson on public.lesson_progress(lesson_id);

alter table public.lesson_progress enable row level security;

drop policy if exists "own progress read"   on public.lesson_progress;
drop policy if exists "admin read progress"  on public.lesson_progress;
drop policy if exists "own progress insert"  on public.lesson_progress;
drop policy if exists "own progress delete"  on public.lesson_progress;

create policy "own progress read"  on public.lesson_progress for select using (auth.uid() = user_id);
create policy "admin read progress" on public.lesson_progress for select using (public.is_admin());
create policy "own progress insert" on public.lesson_progress for insert with check (auth.uid() = user_id);
create policy "own progress delete" on public.lesson_progress for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.lesson_progress to anon, authenticated;
