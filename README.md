# Resonance Studios — Tabla Learning Portal

A modern, time-gated student learning portal for an Indian Classical Music
(Tabla) studio. Built with **Next.js (App Router)**, **React**, **Tailwind CSS**,
and **Supabase** (PostgreSQL + Auth).

Content unlocks Khan-Academy-style: modules open a set number of days after a
student enrolls, and admins can grant early access per student.

---

## ✨ Features

- **Auth**: Google OAuth + email/password (Supabase Auth).
- **Time-gated modules**: `unlock_delay_days` measured from `enrollment_date`.
- **Admin override**: unlock any module for any student ahead of schedule.
- **Polymorphic lessons**: `video`, `audio`, `pdf`, `image` (gallery), `text`.
- **Indianized design**: deep indigo + saffron/marigold on warm cream, with a
  subtle mandala/floral background.

---

## 1. Setup & install

```bash
# from the repo root
npm install

# copy env template and fill in your Supabase keys
cp .env.local.example .env.local
```

Fill `.env.local` with values from **Supabase → Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Run the dev server:

```bash
npm run dev
# → http://localhost:3000
```

## 2. Database

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste all of [`supabase/schema.sql`](supabase/schema.sql),
   and run it. This creates the tables, RLS policies, the signup trigger, and
   seed data.
3. Sign up once through the app, then make yourself an admin:

   ```sql
   update public.users set role = 'admin' where email = 'you@example.com';
   ```

## 3. Enable auth providers

In **Supabase → Authentication → Providers**:

- **Email**: enabled by default.
- **Google**: enable it, add your Google OAuth client ID/secret, and add
  `http://localhost:3000/auth/callback` (and your production URL) to the
  provider's **Authorized redirect URLs**.

In **Authentication → URL Configuration**, set the **Site URL** to
`http://localhost:3000` for local dev.

---

## 🗂 Project structure

```
src/
├─ app/
│  ├─ layout.js              # root shell: fonts + mandala background
│  ├─ page.js                # redirects based on auth
│  ├─ login/page.js          # branded auth screen
│  ├─ auth/callback/route.js # OAuth / email-confirm handler
│  └─ (app)/                 # authenticated area (sidebar shell)
│     ├─ layout.js
│     ├─ dashboard/page.js   # hero + module card grid
│     └─ lessons/[id]/page.js
├─ components/
│  ├─ MandalaBackground.js   # fixed decorative SVG layer
│  ├─ Sidebar.js             # module nav (unlocked + countdowns)
│  ├─ ModuleCard.js          # dashboard card
│  ├─ LessonViewer.js        # polymorphic media renderer
│  ├─ AuthForm.js            # Google + email/password
│  └─ ...
├─ lib/
│  ├─ access.js              # ⭐ time-gating logic lives here
│  └─ supabase/{client,server,middleware}.js
└─ middleware.js             # session refresh + route guards
supabase/schema.sql          # ⭐ full DB setup
```

## 🔌 Where to plug in YOUR content

- **Modules / lessons**: insert rows in the `modules` and `lessons` tables
  (via Supabase Table Editor or an admin UI you build later).
- **Video**: paste a YouTube/Vimeo link or an `.mp4` URL into `lessons.media_url`.
- **Audio (bols)**: a URL to an `.mp3`/`.wav` (host in Supabase Storage).
- **Handwritten compositions**: set `media_type = 'image'` and put one or more
  image URLs in `media_url` (comma- or newline-separated → becomes a gallery).
- **Theory/notes**: set `media_type = 'text'` and write into `text_content`
  (supports `**bold**` and `*italic*`).

---

## 🚀 Deploy

Deploy to Vercel, set the three `NEXT_PUBLIC_*` env vars, update
`NEXT_PUBLIC_SITE_URL` to your domain, and add
`https://your-domain.com/auth/callback` to Supabase + Google redirect URLs.
