# DevX Daily OS
_A minimal, high-demand daily operating system for developers, creators, and freelancers._  
**Stack:** Next.js + TypeScript + Tailwind CSS + Supabase (Postgres + Auth + Realtime)

---

## 1. Product Vision

DevX Daily OS is a **personal control center** where a user can:
- Build and track **habits**
- Ship **dev projects**
- Plan & post **Instagram content**
- Manage **freelance pipeline**

All in **one minimal dashboard**, with **one-tap actions** and **clear progress**.

**Principles**
- Minimal UI, no clutter
- Daily use within 2–5 minutes
- Mobile-first, thumb-friendly
- Every screen answers: “_What should I do next?_”

---

## 2. Core User Types

1. **Builder (Primary)**  
   Developer + creator who:
   - Codes projects
   - Posts on Instagram / YouTube
   - Wants freelance clients

2. **Focus Seeker (Secondary)**  
   Just wants:
   - Habit tracking
   - Simple tasks
   - Light analytics

The product should work great for **you (Kamlesh)** but be generic enough for any builder.

---

## 3. Core Flows (Must Be Effortless)

### 3.1 Daily Flow (Main)
1. User opens `/dashboard`
2. Sees:
   - Greeting (“Good Morning, Kamlesh 👋”)
   - 3 key stats (Today’s habits, Deep Work, Streak)
3. One-tap:
   - Mark habits as done
   - Tick top 3 tasks
   - Add 1 idea (project or Instagram)
4. Close app in under 2 minutes.

### 3.2 Habit Flow
- `/habits` → add/edit habits
- Each habit has:
  - Name + emoji
  - Category (morning / work / night / health / focus)
  - Mode: boolean (done/not done) or numeric (e.g. minutes/pages)
- Logs stored per day in `habit_logs`
- Dashboard shows today + streak

### 3.3 Project Flow
- `/projects` → list of projects as cards
- Each project:
  - Status: idea / building / shipped
  - One-liner, tech stack, links
  - Tasks attached
- Today’s “Top 3 tasks” on dashboard are pulled from here.

### 3.4 Instagram Flow
- `/instagram` → content OS
- Track:
  - Ideas
  - Drafts
  - Scheduled
  - Posted
- Each item has:
  - Title, hook, caption, hashtags
  - Content type (Reel, Post, Story)
  - Status

### 3.5 Freelance Flow
- `/freelance` → kanban-style
- Columns:
  - Leads → In Talk → Proposal → Active → Done
- Each client item:
  - Name, platform, value, next action
- Dashboard shows “Next 1–2 actions”.

---

## 4. Information Architecture

**Primary pages**
- `/dashboard` – Today overview
- `/habits` – Habit manager + history
- `/projects` – Dev project OS
- `/instagram` – Content OS
- `/freelance` – Client OS
- `/settings` – Profile, preferences

**MVP priority**
1. `/dashboard`
2. `/habits`
3. `/projects`
Then add Instagram + Freelance.

---

## 5. Design System (Minimal & Modern)

**Colors (Dark theme)**
- Background: `#050816`
- Surface / Card: `#0f172a`
- Accent 1 (primary): `#6366f1` (indigo)
- Accent 2: `#22c55e` (success green)
- Text primary: `#f9fafb`
- Text muted: `#9ca3af`
- Border subtle: `#1f2933`

**Typography**
- Font: Inter (system fallback)
- Heading: semi-bold
- Body: normal
- Small labels for meta info

**Layout**
- Max-width: `1200px`
- Padding: `1.5rem` on mobile, `2.5rem` desktop
- Card radius: `16px`
- Shadow: soft, not too bright

**Components**
- `StatCard` – compact number + label
- `HabitCard` – emoji + title + toggle + streak
- `TaskItem` – checkbox + title + project tag
- `SectionHeader` – title + optional actions (buttons)

**Interaction**
- One-tap habit toggle
- No modals unless necessary
- Inline editing where possible

---

## 6. Supabase Data Model (Minimal)

> Supabase Auth handles users. We create `profiles` linked to `auth.users`.

```sql
create extension if not exists "pgcrypto";

-- 1. Profiles
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- 2. Habits
create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  emoji text,
  description text,
  category text, -- morning, work, night, health, focus
  type text default 'boolean', -- 'boolean' | 'numeric'
  target_value int, -- e.g. 5 (pages, minutes, etc)
  target_unit text, -- 'pages', 'min', 'reps', etc
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Habit logs (per day)
create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  habit_id uuid references habits(id) on delete cascade,
  date date not null,
  completed boolean default false,
  value int,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint habit_logs_unique unique (user_id, habit_id, date)
);

-- 4. Projects
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  slug text,
  description text,
  status text default 'idea', -- idea | building | shipped
  tech_stack text[],
  live_url text,
  github_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Tasks
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  title text not null,
  description text,
  priority text default 'medium', -- low | medium | high
  status text default 'pending',  -- pending | in_progress | done
  is_today boolean default false,
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. Instagram content
create table instagram_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text,
  hook text,
  caption text,
  hashtags text,
  format text, -- reel | post | story
  status text default 'idea', -- idea | draft | scheduled | posted
  scheduled_for timestamptz,
  posted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. Freelance clients
create table freelance_clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  platform text, -- upwork | fiverr | dm | other
  project_title text,
  value numeric,
  currency text default 'INR',
  stage text default 'lead', -- lead | in_talk | proposal | active | done
  next_action text,
  next_action_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 8. Settings (optional)
create table user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  timezone text,
  start_of_week text default 'monday',
  theme text default 'dark',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

## 7. Dashboard Layout (Flow)

**Route:** `/dashboard`

### 7.1 Header
- Greeting: “Good Morning, Kamlesh 👋”
- Today’s date, local time
- User avatar + quick settings

### 7.2 Row 1 — Key Stats (StatCards)
- `✅ Habits done / total`
- `🎓 Deep work time (today)` (from numeric habit or manual log)
- `🔥 Streak (days logged)`

### 7.3 Row 2 — Today’s Habits
A list/grid of `HabitCard`:

Each card:
- Emoji + name (e.g. `⏰ Wake up at 6AM`)
- Toggle (done/not)
- Streak mini-indicator (optional later)

Actions:
- Tap card → toggle `completed` in `habit_logs` for today
- Long-press / click chevron → open habit detail in `/habits`

### 7.4 Row 3 — Today’s Tasks
Section "Top 3 Tasks":
- Limited to 3 visible tasks, `is_today = true` or closest deadlines
- Each `TaskItem`:
  - Checkbox
  - Title
  - Project tag (colored pill)
- Button: “View all tasks → /projects”

### 7.5 Row 4 — Quick Ideas
Two mini-inputs:
- “+ Add project idea” → creates `projects` with status `idea`
- “+ Add IG hook” → creates `instagram_posts` with status `idea`

Goal: capture ideas **without leaving the dashboard**.

---

## 8. Habits Page

**Route:** `/habits`

Sections:
1. **Header:** “Habits” + `+ New Habit` button
2. **Tabs:** [All] [Morning] [Work] [Night] [Health] [Focus]
3. **List:** Habit rows/cards with:
   - Emoji + name
   - Type (boolean/numeric)
   - Target (e.g. 10 pages, 30 min)
   - Edit icon → opens side panel / modal
4. **History View (later):**
   - Simple heatmap per habit (last 30 days)
   - Or a small bar chart

Creation form fields:
- Name
- Emoji (simple text input)
- Category (select)
- Type (boolean / numeric)
- Target value + unit

---

## 9. Projects Page

**Route:** `/projects`

Layout:
- Top: `+ New Project` button
- View toggle: [Cards] [List]

Project card:
- Name
- Status chip (idea/building/shipped)
- Tech stack tags
- Links (Live / GitHub)
- “Open” button → project detail

Project detail:
- Description
- Task list (filtered by `project_id`)
- `+ Add task` inline

---

## 10. Instagram Page

**Route:** `/instagram`

Sections:
1. **Content Pipeline**
   - Columns: Idea | Draft | Scheduled | Posted
2. **Add new idea**
   - Fields: title, hook, format
3. **Calendar (later)**
   - Monthly view of `scheduled_for`

Goal: make it easy to move one card through pipeline.

---

## 11. Freelance Page

**Route:** `/freelance`

Structure:
- Kanban columns:
  - Leads
  - In Talk
  - Proposal
  - Active
  - Done

Card content:
- Name
- Platform
- Project title
- Value + currency
- Next action + date

Quick actions:
- Change stage (drag/drop or dropdown)
- Edit next action inline

---

## 12. Implementation Notes (Dev Flow)

1. **Setup Supabase**
   - Create project
   - Configure Auth (email + magic link or email+password)
   - Run SQL in section 6
   - Generate types with `supabase gen types typescript` (optional)

2. **Next.js Project**
   - `npx create-next-app@latest devx-daily-os --ts`
   - Add Tailwind, Supabase JS, Auth helpers, Lucide

3. **Auth Layout**
   - Public routes: `/login`, `/signup`
   - Protected routes: dashboard, habits, etc.
   - Use middleware or layout-level protection

4. **Data Hooks**
   - `useProfile`
   - `useHabits` + `useTodayHabits`
   - `useTasks`
   - `useProjects`
   - `useInstagramPosts`
   - `useFreelanceClients`

5. **MVP Scope (3 weeks)**
   - Week 1: Auth + profiles + dashboard skeleton
   - Week 2: Habits list + toggle + logs
   - Week 3: Projects + tasks + quick ideas + deploy to Vercel

---

## 13. Future Upgrades (High-Demand Features)

- Streak-based rewards (XP, levels)
- Export data (CSV/JSON)
- Mobile PWA support
- Reminders (email / notifications)
- Team/shared mode (later)
- AI suggestions:
  - “Next best task”
  - “Content hooks based on past posts”

---

## 14. Summary

DevX Daily OS is:
- **Niche:** For builders (devs + creators + freelancers)
- **Simple:** One main dashboard, minimal friction
- **Scalable:** Supabase + Next.js architecture
- **Monetizable:** Future SaaS with pro features

You can ship an MVP fast, use it yourself daily, then turn it into a product others will pay for.

---

_Created for Kamlesh (DevX Kamlesh) — redesigned with minimal, high-demand, user-friendly flow._
