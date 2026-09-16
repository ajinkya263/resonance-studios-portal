-- ============================================================================
--  MIGRATION 002 — Teentaal lesson content + Admin auto-promotion
--
--  Run this in Supabase → SQL Editor AFTER the base schema.sql.
--  Safe to re-run (idempotent).
-- ============================================================================

-- ----------------------------------------------------------------------------
--  1. AUTO-PROMOTE STUDIO ACCOUNTS TO ADMIN
--     Any email in this allowlist becomes an admin automatically on signup,
--     and existing rows are promoted immediately.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  admin_emails text[] := array['ar.resonancestudios@gmail.com'];
begin
  insert into public.users (id, email, full_name, auth_provider, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_app_meta_data->>'provider', 'email'),
    case when new.email = any(admin_emails) then 'admin'::user_role
         else 'student'::user_role end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Promote the studio account now, in case it already signed up.
update public.users set role = 'admin'
where email = 'ar.resonancestudios@gmail.com';


-- ----------------------------------------------------------------------------
--  2. TEENTAAL LESSON CONTENT
--     Populates the existing "Teentaal: The 16-Beat Cycle" module.
--     Interactive lessons use media_type='text' with a media_url of the form
--     'interactive:<key>' — the front-end swaps in a React widget for that key.
-- ----------------------------------------------------------------------------
insert into public.lessons (module_id, title, media_type, media_url, text_content, order_index)
select m.id, v.title, v.media_type::media_kind, v.media_url, v.text_content, v.order_index
from public.modules m
cross join (values

  -- 1) Glossary ------------------------------------------------------------
  ('Glossary of Taal', 'text', null::text, $txt$Before you touch the drums, learn the language of rhythm.

**Taal** — A repeating rhythmic cycle of a set number of beats: the rhythmic framework (like 4/4 in Western music, but richer).

**Matra** — The fundamental beat, the *pulse*. Teentaal has **16 matras**.

**Bol** — The spoken "words"/syllables for strokes on the tabla (e.g. *Dha, Dhin, Ta, Tin*). Each bol maps to a specific sound and hand technique. This is the language of tabla.

**Laya** — The tempo:
• *Vilambit* — slow
• *Madhya* — medium
• *Drut* — fast

**Taali** — Literally "clap." The stressed, accented beats that divide the taal into sections.

**Khali & Bhari** — *Khali* means "empty": the unaccented part of the cycle (in Teentaal, matra 9). *Bhari* uses the Bayan more for a fuller sound; Khali lifts off the Bayan for an emptier sound.

**Sam** — The first matra of the cycle. The most important beat — the point of resolution, the "home base." Phrases ultimately land on the Sam.

**Theka** — The standard set of bols that defines a taal (e.g. *Dha Dhin Dhin Dha…* for Teentaal). Your base groove.

**Padhant** — Reciting the bols aloud while marking Taali, Khali and matras with the hands. Critical for developing nikaas.

**Nikaas** — Clarity of bol and language when playing.$txt$, 1),

  -- 2) Foundation ----------------------------------------------------------
  ('The Foundation — Posture, Anatomy & First Bols', 'text', null::text, $txt$Your goal is not speed — it is a clear, resonant sound for **each** bol.

**Posture & Placement**
• Sit cross-legged with a straight, erect spine — comfortable and relaxed.
• The *Dayan* (high-pitch drum) tilts slightly away from you; the *Bayan* (bass drum) sits parallel to the ground. Keep them close together and close to you.

**Drum Anatomy**
• *Syahi* — the black weighted circle in the center; most sound focuses here.
• *Maidan* — the open, lighter skin between the syahi and the edge.
• *Kinar* — the outer rim of the drum head.
• *Gajra* — the woven outer rim of the drum.

**Basic Dayan Bols (right hand)**
• *Ta / Na* — strike the Kinar with a stiff index finger, then lift immediately. Sharp and ringing.
• *Tin* — strike the Maidan (between syahi and kinar) with the index finger and lift. Ringing and open.
Practice slowly: *Ta Ta Ta Ta*  |  *Tin Tin Tin Tin*.

**Basic Bayan Bols (left hand)**
Rest the edge of your fingers on the kinar; the base of the palm sits behind the syahi.
• *Ge / Ga* — open, resonant bass. Rest the wrist and strike with index/middle finger, letting it ring. Relaxed hand.
• *Ka / Ke* — closed, muted bass. Strike with a flat palm/fingers and do **not** lift.
• *Kat* — closed bass, but remove the palm entirely first, then play Ka.
Practice: *Ge Ge Ge Ge*  |  *Ka Ka Ka Ka* — hear the open "boom" vs the closed "thud."

**First Combined Bols (both hands)**
• *Dha* — the most important bol: *Ge + Ta* played at exactly the same time.
• *Dhin* — *Ge + Tin* together.
Practice slowly for one single, powerful, combined sound: *Dha Dha Dha Dha*, then *Dhin Dhin Dhin Dhin*.$txt$, 2),

  -- 3) Interactive trainer -------------------------------------------------
  ('Teentaal — Interactive Cycle Trainer', 'text', 'interactive:teentaal-trainer',
   $txt$Teentaal is a **16-matra** cycle in **4 vibhags** of 4 beats each. Use the trainer below to internalise the cycle: press play, pick a laya, and recite the bols aloud (padhant) while watching the Sam (X), Taali (2, 3) and Khali (0) markers. Never play faster than you can clearly recite.$txt$, 3),

  -- 4) Theka & Paltas ------------------------------------------------------
  ('The Theka, Paltas & Riyaz', 'text', null::text, $txt$**Teentaal specs**
• Matras: 16   • Vibhags: 4 (4+4+4+4)
• Matra 1 = Sam (X, clap) · Matra 5 = Taali (2, clap) · Matra 9 = Khali (0, wave) · Matra 13 = Taali (3, clap)

**Padhant practice** — set a metronome to 60–80 BPM and recite 1–16, clapping on 1, 5, 13 and waving on 9, until you *feel* the 16-beat cycle. Never play until you can recite it.

**The Theka**
```
X  Dha  Dhin Dhin Dha
2  Dha  Dhin Dhin Dha
0  Dha  Tin  Tin  Ta
3  Ta   Dhin Dhin Dha
```

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

**New bols — TeTe & Tu**
• *TeTe* — strike the middle of the syahi with index + middle finger (closed sound).
• *Tu* — strike the middle of the syahi with the index finger (open sound).

**Palta #3 — add TeTe**
```
Dha  Dhin Dhin Dha
Dha  Dhin Dhin Dha
Dha  Tin  Tin  Ta
Tete Dhin Dhin Dha
```

**Riyaz phrase**
```
DhaDha Tete DhaDha Tuna
TaTa   Tete DhaDha Dhina
```$txt$, 4),

  -- 5) Kaida ---------------------------------------------------------------
  ('Delhi Gharana Kaida', 'text', null::text, $txt$A **kaida** is a theme-and-variation form — the heart of solo tabla. Learn the base line (the *mukh*), then develop its paltas.

**The Kaida (base line)**
```
Dha Tete Dha Tete DhaDha
Tete Dhage TunaKena
```

**Palta #1**
```
(Dha Tete Dha Tete DhaDha) x2  +  full kaida line
```

**Palta #2**
```
Dha Tete Dha Tete DhaDha - ½ Dha Tete DhaDha - ½ Dha Tete DhaDha
Tete Dhage Tuna Kena
Ta Tete Ta Tete TaTa - ½ Ta Tete TaTa - ½ Ta Tete TaTa
Tete Dhage DhinaGina
```

*Legend:*  `-` = full-beat pause · `½` = half-beat pause$txt$, 5)

) as v(title, media_type, media_url, text_content, order_index)
where m.title = 'Teentaal: The 16-Beat Cycle'
  and not exists (
    select 1 from public.lessons l
    where l.module_id = m.id and l.title = v.title
  );
