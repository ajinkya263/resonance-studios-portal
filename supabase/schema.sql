-- ============================================================================
--  RESONANCE STUDIOS — Tabla Learning Portal
--  Supabase / PostgreSQL schema
--
--  HOW TO RUN:
--    Supabase Dashboard → SQL Editor → paste this whole file → "Run".
--    It is idempotent-ish (safe drops guarded), so you can re-run during dev.
-- ============================================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
--  ENUMS
-- ----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('admin', 'student');
exception when duplicate_object then null; end $$;

do $$ begin
  create type media_kind as enum ('video', 'audio', 'pdf', 'image', 'text');
exception when duplicate_object then null; end $$;


-- ----------------------------------------------------------------------------
--  USERS  (profile table that mirrors auth.users)
--
--  We DON'T store passwords here — Supabase Auth (auth.users) handles that.
--  This "profiles" table holds app-level data and is linked 1:1 by id.
-- ----------------------------------------------------------------------------
create table if not exists public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text unique not null,
  full_name       text,
  role            user_role not null default 'student',
  auth_provider   text default 'email',           -- 'email' | 'google'
  enrollment_date timestamptz not null default now(),
  created_at      timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
--  MODULES  (top-level, time-gated units)
-- ----------------------------------------------------------------------------
create table if not exists public.modules (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text,
  unlock_delay_days integer not null default 0,     -- days after enrollment
  order_index       integer not null default 0,
  created_at        timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
--  LESSONS  (belong to a module; polymorphic by media_type)
-- ----------------------------------------------------------------------------
create table if not exists public.lessons (
  id           uuid primary key default gen_random_uuid(),
  module_id    uuid not null references public.modules(id) on delete cascade,
  title        text not null,
  media_type   media_kind not null default 'text',
  media_url    text,            -- video/audio/pdf/image source (nullable for 'text')
  text_content text,            -- rich notes / theory (used by 'text', optional elsewhere)
  order_index  integer not null default 0,
  created_at   timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
--  USER_OVERRIDES  (admin manually unlocks a module for a student early)
-- ----------------------------------------------------------------------------
create table if not exists public.user_overrides (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  module_id   uuid not null references public.modules(id) on delete cascade,
  granted_by  uuid references public.users(id) on delete set null,  -- admin id
  granted_at  timestamptz not null default now(),
  unique (user_id, module_id)   -- one override per student/module
);


-- ----------------------------------------------------------------------------
--  INDEXES
-- ----------------------------------------------------------------------------
create index if not exists idx_lessons_module        on public.lessons(module_id, order_index);
create index if not exists idx_modules_order          on public.modules(order_index);
create index if not exists idx_overrides_user         on public.user_overrides(user_id);


-- ============================================================================
--  AUTO-PROVISION PROFILE ON SIGNUP
--  When Supabase Auth creates a row in auth.users, mirror it into public.users.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, auth_provider)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_app_meta_data->>'provider', 'email')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================================
--  ROW LEVEL SECURITY
--  Students may only read their own profile/overrides and unlocked content is
--  filtered in the app layer. Admins get full read/write.
-- ============================================================================
alter table public.users          enable row level security;
alter table public.modules        enable row level security;
alter table public.lessons        enable row level security;
alter table public.user_overrides enable row level security;

-- Helper: is the current auth user an admin?
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  );
$$;

-- ---- USERS ----------------------------------------------------------------
drop policy if exists "read own profile"   on public.users;
drop policy if exists "admin read profiles" on public.users;
drop policy if exists "update own profile" on public.users;

create policy "read own profile"    on public.users for select using (auth.uid() = id);
create policy "admin read profiles" on public.users for select using (public.is_admin());
create policy "update own profile"  on public.users for update using (auth.uid() = id);

-- ---- MODULES (everyone authenticated may read; app enforces time-gate) -----
drop policy if exists "read modules"  on public.modules;
drop policy if exists "admin write modules" on public.modules;

create policy "read modules"        on public.modules for select using (auth.role() = 'authenticated');
create policy "admin write modules" on public.modules for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- LESSONS --------------------------------------------------------------
drop policy if exists "read lessons" on public.lessons;
drop policy if exists "admin write lessons" on public.lessons;

create policy "read lessons"        on public.lessons for select using (auth.role() = 'authenticated');
create policy "admin write lessons" on public.lessons for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- USER_OVERRIDES -------------------------------------------------------
drop policy if exists "read own overrides"  on public.user_overrides;
drop policy if exists "admin manage overrides" on public.user_overrides;

create policy "read own overrides"    on public.user_overrides for select
  using (auth.uid() = user_id or public.is_admin());
create policy "admin manage overrides" on public.user_overrides for all
  using (public.is_admin()) with check (public.is_admin());


-- ============================================================================
--  DATA API GRANTS
--  PostgREST connects as the `anon` / `authenticated` roles. They need table
--  privileges to reach the API at all — Row Level Security (above) still
--  governs which ROWS each role can actually see or change.
-- ============================================================================
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on all tables in schema public to anon, authenticated;
grant usage, select
  on all sequences in schema public to anon, authenticated;

-- Apply the same to any tables/sequences created later.
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;


-- ============================================================================
--  SEED DATA  (safe to delete — here so the UI isn't empty on first run)
-- ============================================================================
insert into public.modules (title, description, unlock_delay_days, order_index) values
  ('Foundations: Meeting the Tabla',
   'Sit, tune, and produce your first clean strokes on the Dayan and Bayan.', 0, 1),
  ('The Basic Bols',
   'Na, Tin, Tete, Ghe — the vocabulary that every composition is built from.', 7, 2),
  ('Teentaal: The 16-Beat Cycle',
   'Learn the most important taal in Hindustani music, with theka and variations.', 21, 3),
  ('Kaidas & Improvisation',
   'Theme-and-variation development — the heart of solo tabla.', 45, 4)
on conflict do nothing;

-- Example lessons for the first module (uses a subquery to grab its id).
insert into public.lessons (module_id, title, media_type, media_url, text_content, order_index)
select m.id, l.title, l.media_type::media_kind, l.media_url, l.text_content, l.order_index
from public.modules m
join (values
  ('Foundations: Meeting the Tabla', 'Welcome & Posture (video)', 'video',
   'https://www.youtube.com/embed/dQw4w9WgXcQ', null, 1),
  ('Foundations: Meeting the Tabla', 'The Sound of "Na" (audio)', 'audio',
   'https://example.com/audio/na-bol.mp3', null, 2),
  ('Foundations: Meeting the Tabla', 'Reading Tabla Notation (theory)', 'text',
   null, 'Tabla compositions are written as **bols** (spoken syllables). Each syllable maps to a specific stroke...', 3),
  ('Foundations: Meeting the Tabla', 'My Handwritten Theka (image)', 'image',
   'https://placehold.co/1200x800/2B1B5A/FBF5EA?text=Handwritten+Composition', null, 4)
) as l(module_title, title, media_type, media_url, text_content, order_index)
  on m.title = l.module_title
on conflict do nothing;

-- ============================================================================
--  MAKE YOURSELF AN ADMIN
--  After you sign up once through the app, run (with your email):
--
--    update public.users set role = 'admin' where email = 'you@example.com';
-- ============================================================================
