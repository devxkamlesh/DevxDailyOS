<div align="center">

# 🔥 Sadhana — साधना

### Your Daily Practice for Building Habits & Leveling Up

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**Build better habits. Ship projects. Level up your life.**

Made in India 🇮🇳

[Live Demo](https://sadhana.app) · [Report Bug](https://github.com/devxkamlesh/sadhana/issues) · [Request Feature](https://github.com/devxkamlesh/sadhana/issues)

</div>

---

## 🎯 About The Project

Sadhana (साधना - meaning "Daily Practice") is a gamified productivity OS designed for developers, creators, and freelancers. Track daily habits, complete focus sessions, earn rewards, and compete on leaderboards — all in a beautiful dark-themed interface.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| � **Habiti Tracking** | Create, track, and complete daily habits with streaks |
| ⏱️ **Focus Timer** | Pomodoro-style timer integrated with habits |
| 🏆 **Achievements** | Earn XP, coins, level up, and unlock achievements |
| �  **Shop System** | Purchase avatars, themes, and features with coins |
| 💳 **Razorpay Integration** | Buy coin packages with real money |
| 🏅 **Leaderboard** | Compete with other users globally |
| � **Caleyndar View** | Visualize your habit completion history |
| �  **Daily Journal** | Reflect on your day with mood tracking |
| 🔔 **Notifications** | Custom notification sounds and reminders |
| 🎨 **Themes & Avatars** | Personalize your experience |
| 👑 **Admin Panel** | Complete admin dashboard for management |

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Styling:** Tailwind CSS
- **Payments:** Razorpay
- **Icons:** Lucide React
- **Deployment:** Vercel

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Razorpay account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/devxkamlesh/sadhana.git
   cd sadhana
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   ALLOWED_ADMIN_EMAILS=your_email@example.com
   
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
   ```

4. **Set up the database**
   - Go to Supabase SQL Editor
   - Run the contents of `supabase/migrations/database.sql`
   - Run `supabase/migrations/20241214_auto_create_profile.sql` for auto profile creation

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

---

## 📁 Project Structure

```
sadhana/
├── src/
│   ├── app/
│   │   ├── (protected)/      # Auth-protected routes
│   │   │   ├── dashboard/
│   │   │   ├── habits/
│   │   │   ├── focus/
│   │   │   ├── achievements/
│   │   │   ├── shop/
│   │   │   ├── leaderboard/
│   │   │   └── settings/
│   │   ├── admin/            # Admin panel
│   │   ├── api/              # API routes
│   │   └── login/
│   ├── components/
│   │   ├── admin/
│   │   ├── dashboard/
│   │   ├── layout/
│   │   └── ui/
│   ├── lib/
│   │   └── supabase/
│   └── types/
├── supabase/
│   ├── migrations/
│   │   └── database.sql
│   └── email-templates/
├── public/
└── package.json
```

---

## 🗄️ Database Schema

The database includes **30+ tables** covering:

| Category | Tables |
|----------|--------|
| **Users** | profiles, user_rewards, user_settings, user_achievements |
| **Habits** | habits, habit_logs, habit_focus_sessions, habit_time_logs |
| **Achievements** | coin_awards, xp_awards, weekly_challenges, user_challenge_progress |
| **Shop** | shop_plans, coin_packages, coupons |
| **Payments** | payment_orders, payment_transactions |
| **Content** | projects, tasks, instagram_posts, freelance_clients, daily_journal |
| **Social** | user_friends, social_challenges, challenge_participants |
| **System** | system_settings, notification_settings |

---

## 👑 Admin Panel

Access the admin panel at `/admin` (restricted to whitelisted emails).

### Admin Features:
- 📊 Dashboard with platform statistics
- 👥 User management & tracking
- 🛒 Shop items management
- 💰 Coin packages & coupons
- 💳 Transaction monitoring
- ⚙️ System settings (maintenance mode, limits)

---

## 🔐 Security

- **Row Level Security (RLS)** on all tables
- **Email whitelist** for admin access
- **Secure authentication** via Supabase Auth
- **Environment variables** for sensitive data
- **Server-side validation** for all operations

---

## 🎨 Customization

### Themes
The app uses CSS variables for theming:
```css
--background: #000000
--surface: #111111
--border-subtle: #222222
--accent-primary: #3b82f6
--accent-success: #22c55e
```

### Adding New Habits Categories
Edit the category options in `src/app/(protected)/habits/page.tsx`

---

## 📧 Email Templates

Custom branded email templates for Supabase Auth:
- Confirm Signup
- Invite User
- Reset Password
- Confirm Email Change
- Magic Link
- Confirm Reauthentication

Located in `supabase/email-templates/`

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

<div align="center">

**Kamlesh Choudhary**

[![GitHub](https://img.shields.io/badge/GitHub-devxkamlesh-181717?style=for-the-badge&logo=github)](https://github.com/devxkamlesh)
[![Twitter](https://img.shields.io/badge/Twitter-@devxkamlesh-1DA1F2?style=for-the-badge&logo=twitter)](https://twitter.com/devxkamlesh)

</div>

---

## ⭐ Show Your Support

Give a ⭐ if this project helped you!

---

<div align="center">

**Built with ❤️ in India by [devxkamlesh](https://github.com/devxkamlesh)**

॥ योगः कर्मसु कौशलम् ॥

</div>
