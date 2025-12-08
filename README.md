# DevX Daily OS

A minimal, high-demand daily operating system for developers, creators, and freelancers.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Postgres + Auth + Realtime)
- **Lucide React** (Icons)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run Database Migrations

Run the SQL from `DESIGN.md` section 6 in your Supabase SQL editor to create the database schema.

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

```
src/
├── app/              # Next.js app router pages
│   ├── dashboard/    # Dashboard page
│   ├── login/        # Login page
│   └── ...
├── lib/              # Utilities and configurations
│   └── supabase/     # Supabase client setup
└── components/       # Reusable components (to be added)
```

## Features (MVP)

- ✅ Project setup with Next.js + TypeScript + Tailwind
- ✅ Supabase integration
- ✅ Design system implementation
- 🚧 Authentication (email/password)
- 🚧 Dashboard with stats
- 🚧 Habit tracking
- 🚧 Project management
- 🚧 Task management

## Design Principles

- Minimal UI, no clutter
- Daily use within 2–5 minutes
- Mobile-first, thumb-friendly
- Every screen answers: "What should I do next?"

## Development Roadmap

### Week 1
- Auth + profiles + dashboard skeleton

### Week 2
- Habits list + toggle + logs

### Week 3
- Projects + tasks + quick ideas + deploy to Vercel

## License

MIT
