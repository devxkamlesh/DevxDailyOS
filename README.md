# DevX Daily OS

A gamified habit tracking and productivity app for developers, creators, and freelancers.

## Features

- **Habit Tracking** - Boolean and numeric habits with daily logging
- **XP & Level System** - Earn XP for completing habits, level up automatically
- **Coin System** - Earn coins to unlock themes and profile icons
- **Achievements** - 18 achievements to unlock and claim rewards
- **Streak Tracking** - Current streak, longest streak, perfect days
- **Themes** - 8 customizable themes (Ocean, Sunset, Forest, Purple, Gold, Rose, Midnight)
- **Profile Icons** - 36 icons (6 free, 30 premium)
- **Leaderboard** - Compete with other users
- **Analytics** - Charts and insights for your progress
- **Projects & Tasks** - Manage side projects and todos
- **Instagram Planner** - Plan and schedule content
- **Freelance CRM** - Track clients and projects
- **Daily Journal** - Mood tracking and reflections

## Tech Stack

- **Next.js 16** (App Router + Turbopack)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Supabase** (Postgres + Auth)
- **Recharts** (Analytics)
- **Lucide React** (Icons)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Setup Database

1. Go to Supabase Dashboard → SQL Editor
2. Copy & paste `supabase-master-schema-v1.sql`
3. Click Run

### 4. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database

Single schema file: `supabase-master-schema-v1.sql`

**Tables (15):**
- profiles, habits, habit_logs
- user_rewards, coin_awards, xp_awards
- user_achievements, weekly_challenge_claims
- notification_settings
- projects, tasks
- instagram_posts, freelance_clients
- user_settings, daily_journal

**Includes:**
- All RLS policies
- 30+ indexes for performance
- 11 auto-update triggers
- Data validation constraints
- Public profiles view for leaderboard

## Project Structure

```
src/
├── app/
│   ├── (protected)/     # Auth-required pages
│   │   ├── dashboard/
│   │   ├── habits/
│   │   ├── achievements/
│   │   ├── shop/
│   │   ├── leaderboard/
│   │   ├── analytics/
│   │   ├── settings/
│   │   └── ...
│   └── login/
├── components/
│   ├── dashboard/       # Dashboard widgets
│   ├── layout/          # Sidebar, navigation
│   └── ThemeProvider.tsx
└── lib/
    ├── supabase/        # Supabase clients
    ├── xp.ts            # XP & level system
    ├── coins-fixed.ts   # Coin system
    ├── achievements.ts  # Achievement claiming
    └── profile-icons.tsx
```

## License

MIT
