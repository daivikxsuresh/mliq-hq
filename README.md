# MLiQ HQ — Capstone Team Tracker

A live, shared command center for the **MLiQ** capstone team (NYU Stern MSBAi '27).
One URL the whole team bookmarks: a real-time **checklist**, **message board**, and
**meeting scheduler** — all synced across teammates via Supabase.

> **Live:** https://daivikxsuresh.github.io/mliq-hq/
> **Passphrase:** set in `assets/config.js` (`TEAM_PASSPHRASE`)

---

## What's inside

| Module | What it does |
|---|---|
| **Command deck** | Days-to-final-presentation countdown, overall progress %, next meeting, who's online now |
| **The team** | Roster of all 6 members + mission + the MLiQ concept |
| **Checklist** | Tasks grouped by CRISP-DM phase, with owners + due dates. Real-time synced. |
| **Message board** | Post announcements, pin the important ones |
| **Meetings & Zooms** | Schedule weekly + ad-hoc calls, RSVP, add-to-calendar (.ics) |
| **Timeline** | CRISP-DM phase ribbon showing where we are |

---

## One-time setup (~5 min)

### 1. Create a Supabase project
1. Go to **https://supabase.com** → sign in → **New project** (free tier is fine).
2. Once it's ready: **Project Settings → API**.
3. Copy two things:
   - **Project URL** (e.g. `https://abcd1234.supabase.co`)
   - **anon / publishable key** (the public one — safe to ship in a webpage)

### 2. Create the database tables
In Supabase, open **SQL Editor → New query**, paste the block below, and click **Run**:

```sql
create extension if not exists pgcrypto;

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  phase text not null,
  title text not null,
  owner text,
  due_date date,
  done boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  zoom_link text,
  recurring boolean not null default false,
  rsvps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Row Level Security ON (required — public schema is exposed via the API)
alter table public.tasks    enable row level security;
alter table public.messages enable row level security;
alter table public.meetings enable row level security;

-- Shared-team model: the whole team uses one identity behind the passphrase
-- gate, so anon may read/write all three tables.
create policy "team rw tasks"    on public.tasks    for all to anon using (true) with check (true);
create policy "team rw messages" on public.messages for all to anon using (true) with check (true);
create policy "team rw meetings" on public.meetings for all to anon using (true) with check (true);

-- Turn on realtime so changes broadcast to everyone instantly
alter publication supabase_realtime add table public.tasks, public.messages, public.meetings;
```

### 3. Wire up the keys
Open `assets/config.js` and fill in:
```js
SUPABASE_URL:      "https://abcd1234.supabase.co",
SUPABASE_ANON_KEY: "eyJhbGciOi...",   // the anon/publishable key
TEAM_PASSPHRASE:   "huncho",          // change to whatever the team agrees on
```
Commit + push. GitHub Pages redeploys in ~1 min.

### 4. Share with the team
Send everyone the URL + the passphrase. Done — everyone sees the same board, live.

---

## Security note (read me)
There's **no individual login** — the whole team shares one identity behind a
passphrase gate. That's a deliberate tradeoff for zero friction on a 6-person
student project. The anon key is public by design; the RLS policies above are
what actually scope access, and they intentionally allow the team to read/write
the three coordination tables. Don't store anything sensitive here. If you ever
want per-person accounts, the upgrade path is Supabase Auth (magic-link) +
`auth.uid()` policies.

---

## Local development
```bash
cd mliq-hq
python3 -m http.server 8080
# open http://localhost:8080
```

## Stack
Plain HTML/CSS/JS · Supabase (Postgres + Realtime) · GitHub Pages · no build step.
Design language matches the MLiQ capstone deck (warm-paper luxe, Cormorant
Garamond + JetBrains Mono).
