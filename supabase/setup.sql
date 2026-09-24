-- ============================================================================
--  RESONANCE STUDIOS — COMPLETE ONE-SHOT SETUP
--  Run this once in a fresh Supabase project (SQL Editor → paste → Run).
--  Includes: schema, RLS, Data API grants, admin auto-promotion,
--  seed modules, and the full granular course content.
--  Safe to re-run.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────────────────────
do $$ begin create type user_role as enum ('admin','student'); exception when duplicate_object then null; end $$;
do $$ begin create type media_kind as enum ('video','audio','pdf','image','text'); exception when duplicate_object then null; end $$;

-- ── Tables ──────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role user_role not null default 'student',
  auth_provider text default 'email',
  enrollment_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  unlock_delay_days integer not null default 0,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  media_type media_kind not null default 'text',
  media_url text,
  text_content text,
  video_url text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.user_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  granted_by uuid references public.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  unique (user_id, module_id)
);

create index if not exists idx_lessons_module on public.lessons(module_id, order_index);
create index if not exists idx_modules_order on public.modules(order_index);
create index if not exists idx_overrides_user on public.user_overrides(user_id);

-- ── Signup trigger + admin auto-promotion ────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare admin_emails text[] := array['ar.resonancestudios@gmail.com'];
begin
  insert into public.users (id, email, full_name, auth_provider, role)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_app_meta_data->>'provider', 'email'),
    case when new.email = any(admin_emails) then 'admin'::user_role else 'student'::user_role end
  ) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.users enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.user_overrides enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin');
$$;

drop policy if exists "read own profile" on public.users;
drop policy if exists "admin read profiles" on public.users;
drop policy if exists "update own profile" on public.users;
create policy "read own profile" on public.users for select using (auth.uid() = id);
create policy "admin read profiles" on public.users for select using (public.is_admin());
create policy "update own profile" on public.users for update using (auth.uid() = id);

drop policy if exists "read modules" on public.modules;
drop policy if exists "admin write modules" on public.modules;
create policy "read modules" on public.modules for select using (auth.role() = 'authenticated');
create policy "admin write modules" on public.modules for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read lessons" on public.lessons;
drop policy if exists "admin write lessons" on public.lessons;
create policy "read lessons" on public.lessons for select using (auth.role() = 'authenticated');
create policy "admin write lessons" on public.lessons for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read own overrides" on public.user_overrides;
drop policy if exists "admin manage overrides" on public.user_overrides;
create policy "read own overrides" on public.user_overrides for select using (auth.uid() = user_id or public.is_admin());
create policy "admin manage overrides" on public.user_overrides for all using (public.is_admin()) with check (public.is_admin());

-- ── Data API grants (RLS still governs rows) ─────────────────────────────────
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated;

-- ── Seed modules ─────────────────────────────────────────────────────────────
insert into public.modules (title, description, unlock_delay_days, order_index) values
  ('Foundations: Meeting the Tabla', 'Sit, tune, and produce your first clean strokes on the Dayan and Bayan.', 0, 1),
  ('The Basic Bols', 'Na, Tin, Tete, Ghe — the vocabulary every composition is built from.', 7, 2),
  ('Teentaal: The 16-Beat Cycle', 'The most important taal in Hindustani music, with theka and variations.', 21, 3),
  ('Kaidas & Improvisation', 'Theme-and-variation development — the heart of solo tabla.', 45, 4)
on conflict do nothing;

-- ── Course content ───────────────────────────────────────────────────────────
insert into public.lessons (module_id, title, media_type, media_url, text_content, order_index)
select m.id, v.title, v.media_type::media_kind, v.media_url, v.text_content, v.order_index
from public.modules m cross join (values
  ('What is Taal? — Taal, Matra & Laya', 'text', null::text, $txt$Before you touch the drums, learn the language of rhythm.

**Taal** — A repeating rhythmic cycle of a set number of beats: the framework of a piece, like a time signature in Western music, but richer.

**Matra** — The fundamental beat, the *pulse* of the taal. Teentaal has **16 matras**.

**Bol** — The spoken syllables for each stroke (*Dha, Dhin, Ta, Tin…*). Every bol maps to a specific sound and hand technique — this is the language of tabla.

**Laya** — The tempo:
• *Vilambit* — slow
• *Madhya* — medium
• *Drut* — fast$txt$, 1),
  ('The Cycle — Sam, Taali, Khali & Bhari', 'text', null::text, $txt$Every taal is shaped by accents.

**Sam** — The *first* matra of the cycle: the most important beat, the point of resolution and "home base." Every phrase ultimately lands on the Sam.

**Taali** — Literally "clap." The stressed, accented beats that divide the cycle into sections.

**Khali** — Literally "empty": the unaccented section. In Teentaal the **9th matra** is the Khali, marked by a wave of the hand instead of a clap.

**Bhari vs Khali** — *Bhari* leans on the Bayan for a fuller, heavier sound; *Khali* lifts off the Bayan, leaving an emptier, lighter sound.$txt$, 2),
  ('Theka, Padhant & Nikaas', 'text', null::text, $txt$**Theka** — The standard set of bols that defines a taal (*Dha Dhin Dhin Dha…* for Teentaal). It is the groove you return to.

**Padhant** — Reciting the bols aloud while marking the Taali, Khali and matras with your hands. Master the recitation before you ever play.

**Nikaas** — Clarity of bol and language when playing. Clean, distinct strokes are the goal — never speed.$txt$, 3),
  ('Anatomy of the Tabla', 'text', 'interactive:anatomy', $txt$The tabla is a pair of drums. Tap each part below to see where it sits — you'll strike these zones to produce every bol.$txt$, 4),
  ('Posture & Placement', 'text', null::text, $txt$**Posture** — Sit cross-legged with a straight, erect spine. Stay relaxed.

**Placement** — The *Dayan* (high-pitch drum) tilts slightly away from you; the *Bayan* (bass drum) sits parallel to the ground. Place them close together and close to your body.

Your goal this first week is not speed — it is a clear, resonant sound for **each** bol.$txt$, 5)
) as v(title, media_type, media_url, text_content, order_index)
where m.title = 'Foundations: Meeting the Tabla'
  and not exists (select 1 from public.lessons l where l.module_id = m.id and l.title = v.title);

insert into public.lessons (module_id, title, media_type, media_url, text_content, order_index)
select m.id, v.title, v.media_type::media_kind, v.media_url, v.text_content, v.order_index
from public.modules m cross join (values
  ('Ta ( Na )', 'text', 'interactive:bol:ta',   $txt$Your first Dayan (right-hand) bol — a clean, ringing tone struck off the rim.$txt$, 1),
  ('Tin',       'text', 'interactive:bol:tin',  $txt$A rounder, open ring from the middle of the skin.$txt$, 2),
  ('Ge ( Ga )', 'text', 'interactive:bol:ge',   $txt$Your first Bayan (left-hand, bass) bol — a deep, open, resonant boom.$txt$, 3),
  ('Ka ( Ke )', 'text', 'interactive:bol:ka',   $txt$The closed bass — a flat, muted thud, and the counterpart to Ge.$txt$, 4),
  ('Kat',       'text', 'interactive:bol:kat',  $txt$A closed bass played with the palm lifted fully away first.$txt$, 5),
  ('Dha',       'text', 'interactive:bol:dha',  $txt$The most important bol — Ge and Ta struck together as one powerful sound.$txt$, 6),
  ('Dhin',      'text', 'interactive:bol:dhin', $txt$Ge joined with Tin — full and resonant.$txt$, 7),
  ('TeTe',      'text', 'interactive:bol:tete', $txt$Two fingers on the syahi for a short, dry, closed sound.$txt$, 8),
  ('Tu',        'text', 'interactive:bol:tu',   $txt$A single finger on the syahi for an open ring.$txt$, 9)
) as v(title, media_type, media_url, text_content, order_index)
where m.title = 'The Basic Bols'
  and not exists (select 1 from public.lessons l where l.module_id = m.id and l.title = v.title);

insert into public.lessons (module_id, title, media_type, media_url, text_content, order_index)
select m.id, v.title, v.media_type::media_kind, v.media_url, v.text_content, v.order_index
from public.modules m cross join (values
  ('Teentaal — Theory & Structure', 'text', null::text, $txt$**Teentaal** is the most important taal in Hindustani music.

• **Matras:** 16
• **Vibhags:** 4 (of 4 matras each: 4 + 4 + 4 + 4)

**The Taali / Khali structure**
• Matra 1 — **Sam** (clap, marked X)
• Matra 5 — Taali (clap, marked 2)
• Matra 9 — **Khali** (wave, marked 0)
• Matra 13 — Taali (clap, marked 3)

**Padhant** — recite "1 2 3 … 16" at 60–80 BPM, clapping on 1, 5, 13 and waving on 9.$txt$, 1),
  ('Interactive Cycle Trainer', 'text', 'interactive:teentaal-trainer', $txt$Press play, choose a laya, and recite the bols aloud while the cycle turns. Never play faster than you can clearly recite.$txt$, 2),
  ('Playing the Theka', 'text', null::text, $txt$Never play until you can recite it. Set a slow Vilambit laya; aim only for clarity and timing.
```
X  Dha  Dhin Dhin Dha
2  Dha  Dhin Dhin Dha
0  Dha  Tin  Tin  Ta
3  Ta   Dhin Dhin Dha
```$txt$, 3),
  ('Theka Paltas', 'text', null::text, $txt$Variations that develop the theka. Keep them even and clear.

**Palta #1**
```
DhaDha Dhin Dhin Dha
DhaDha Dhin Dhin Dha
DhaDha Tin  Tin  Ta
TaTa   Dhin Dhin Dha
```

**Palta #2**
```
DhaDha DhinDhin Dhin Dha
DhaDha DhinDhin Dhin Dha
DhaDha TinTin   Tin  Ta
DhaDha DhinDhin Dhin Dha
```

**Palta #3 — add TeTe**
```
Dha  Dhin Dhin Dha
Dha  Dhin Dhin Dha
Dha  Tin  Tin  Ta
Tete Dhin Dhin Dha
```$txt$, 4),
  ('Riyaz Phrase', 'text', null::text, $txt$A practice phrase joining your new bols.
```
DhaDha Tete DhaDha Tuna
TaTa   Tete DhaDha Dhina
```

**Palta #1**
```
(DhaDha Tete) x3
DhaDha Tete DhaDha TuNa
(TaTa Tete) x3
DhaDha Tete DhaDha Dhina
```

**Palta #2**
```
DhaDha Tete Tete Tete
DhaDha Tete DhaDha Tuna
TaTa   Tete Tete Tete
DhaDha Tete DhaDha Dhina
```$txt$, 5)
) as v(title, media_type, media_url, text_content, order_index)
where m.title = 'Teentaal: The 16-Beat Cycle'
  and not exists (select 1 from public.lessons l where l.module_id = m.id and l.title = v.title);

insert into public.lessons (module_id, title, media_type, media_url, text_content, order_index)
select m.id, v.title, v.media_type::media_kind, v.media_url, v.text_content, v.order_index
from public.modules m cross join (values
  ('Delhi Gharana Kaida — The Mukh', 'text', null::text, $txt$A **kaida** is a theme-and-variation form — the heart of solo tabla. Learn the base line (the *mukh*), then develop its paltas, always returning to the theme.

**The Kaida (base line)**
```
Dha Tete Dha Tete DhaDha
Tete Dhage TunaKena
Ta  Tete Ta  Tete TaTa
Tete Dhage DhinaGina
```$txt$, 1),
  ('Kaida Paltas', 'text', null::text, $txt$**Palta #1**
```
(Dha Tete Dha Tete DhaDha) x2 + full kaida line
(Ta  Tete Ta  Tete TaTa)  x2 + full kaida line
```

**Palta #2**
```
Dha Tete Dha Tete DhaDha - ½ Dha Tete DhaDha - ½ Dha Tete DhaDha
Tete Dhage Tuna Kena
Ta Tete Ta Tete TaTa - ½ Ta Tete TaTa - ½ Dha Tete DhaDha
Tete Dhage DhinaGina
```

**Palta #3**
```
Dha Tete Dha Tete DhaDha TeteTeTe DhaDha Tete + full kaida line
Ta  Tete Ta  Tete TaTa   TeTe TaTa TeTe      + full kaida line
```

**Palta #4**
```
Dha Tete Dha Tete DhaDha TeteTeteTeteTete + full kaida line
Ta  Tete Ta  Tete TaTa   TeteTeteTeteTete + full kaida line
```

**Palta #5**
```
(Tete DhaDha Tete) x2 DhaDha Tete + full kaida line
(Tete TaTa Tete)   x2 TaTa Tete   + full kaida line
```$txt$, 2)
) as v(title, media_type, media_url, text_content, order_index)
where m.title = 'Kaidas & Improvisation'
  and not exists (select 1 from public.lessons l where l.module_id = m.id and l.title = v.title);
