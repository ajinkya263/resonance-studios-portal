-- ============================================================================
--  MIGRATION 003 — Granular, animated course + per-lesson video slot
--
--  • Adds lessons.video_url  (attach a demo video to ANY lesson/bol page)
--  • Resets lesson content into a part-by-part, one-bol-per-page structure
--
--  Run in Supabase → SQL Editor AFTER 001 + 002.  Safe to re-run.
-- ============================================================================

alter table public.lessons add column if not exists video_url text;

-- Clean slate for lesson content (modules + overrides are preserved).
delete from public.lessons;


-- ── FOUNDATIONS: MEETING THE TABLA ──────────────────────────────────────────
insert into public.lessons (module_id, title, media_type, media_url, text_content, order_index)
select m.id, v.title, v.media_type::media_kind, v.media_url, v.text_content, v.order_index
from public.modules m
cross join (values
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

  ('Theka, Padhant & Nikaas', 'text', null::text, $txt$**Theka** — The standard set of bols that defines a taal (*Dha Dhin Dhin Dha…* for Teentaal). It is the groove you return to — your base rhythmic cycle.

**Padhant** — Reciting the bols aloud while marking the Taali, Khali and matras with your hands. Master the recitation before you ever play.

**Nikaas** — Clarity of bol and language when playing. Clean, distinct strokes are the goal — never speed.$txt$, 3),

  ('Anatomy of the Tabla', 'text', 'interactive:anatomy', $txt$The tabla is a pair of drums. Tap each part below to see where it sits — you'll strike these zones to produce every bol.$txt$, 4),

  ('Posture & Placement', 'text', null::text, $txt$**Posture** — Sit cross-legged with a straight, erect spine. Stay comfortable and relaxed.

**Placement** — The *Dayan* (high-pitch drum) tilts slightly away from you; the *Bayan* (bass drum) sits parallel to the ground. Place them in front of you, close together and close to your body.

Your goal this first week is not speed — it is a clear, resonant sound for **each** bol.$txt$, 5)
) as v(title, media_type, media_url, text_content, order_index)
where m.title = 'Foundations: Meeting the Tabla';


-- ── THE BASIC BOLS  (one page per bol) ──────────────────────────────────────
insert into public.lessons (module_id, title, media_type, media_url, text_content, order_index)
select m.id, v.title, v.media_type::media_kind, v.media_url, v.text_content, v.order_index
from public.modules m
cross join (values
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
where m.title = 'The Basic Bols';


-- ── TEENTAAL: THE 16-BEAT CYCLE ─────────────────────────────────────────────
insert into public.lessons (module_id, title, media_type, media_url, text_content, order_index)
select m.id, v.title, v.media_type::media_kind, v.media_url, v.text_content, v.order_index
from public.modules m
cross join (values
  ('Teentaal — Theory & Structure', 'text', null::text, $txt$**Teentaal** is the most important taal in Hindustani music.

• **Matras:** 16
• **Vibhags:** 4 (of 4 matras each: 4 + 4 + 4 + 4)

**The Taali / Khali structure**
• Matra 1 — **Sam** (clap, marked X)
• Matra 5 — Taali (clap, marked 2)
• Matra 9 — **Khali** (wave, marked 0)
• Matra 13 — Taali (clap, marked 3)

**Padhant practice** — set a metronome to 60–80 BPM and recite "1 2 3 … 16", clapping on 1, 5, 13 and waving on 9, until you *feel* the 16-beat cycle.$txt$, 1),

  ('Interactive Cycle Trainer', 'text', 'interactive:teentaal-trainer', $txt$Press play, choose a laya, and recite the bols aloud while the cycle turns. Watch the Sam (X), Taali (2, 3) and Khali (0) markers. Never play faster than you can clearly recite.$txt$, 2),

  ('Playing the Theka', 'text', null::text, $txt$Never play until you can recite it. Set a very slow Vilambit laya and aim only for clarity and timing.
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
where m.title = 'Teentaal: The 16-Beat Cycle';


-- ── KAIDAS & IMPROVISATION ──────────────────────────────────────────────────
insert into public.lessons (module_id, title, media_type, media_url, text_content, order_index)
select m.id, v.title, v.media_type::media_kind, v.media_url, v.text_content, v.order_index
from public.modules m
cross join (values
  ('Delhi Gharana Kaida — The Mukh', 'text', null::text, $txt$A **kaida** is a theme-and-variation form — the heart of solo tabla. Learn the base line (the *mukh*), then develop its paltas, always returning to the theme.

**The Kaida (base line)**
```
Dha Tete Dha Tete DhaDha
Tete Dhage TunaKena
Ta  Tete Ta  Tete TaTa
Tete Dhage DhinaGina
```

*Legend:*  `-` = full-beat pause · `½` = half-beat pause$txt$, 1),

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
where m.title = 'Kaidas & Improvisation';
