'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import {
  Target, Rocket, TrendingUp, CheckCircle2, Shield,
  Calendar, Trophy, Coins, Clock, Users, Flame,
  ArrowRight, Sparkles, Star, ChevronRight, Heart, Globe
} from 'lucide-react'

// Content in both languages
const content = {
  hi: {
    badge: 'Your Personal Operating System',
    sanskritQuote: '॥ योगः कर्मसु कौशलम् ॥',
    tagline: 'साधना — Daily Practice',
    headline: 'Build Habits. Ship Projects. Level Up.',
    subheadline: 'A gamified productivity OS for developers, creators, and freelancers. Transform your daily routine into a journey of growth.',
    cta: 'साधना शुरू करें',
    explore: 'Explore Features',
    joinText: 'Join 100+ साधक',
    philosophyQuote: '"योगः कर्मसु कौशलम्"',
    philosophySource: '— Excellence in action is Yoga (Bhagavad Gita 2.50)',
    stats: [
      { value: '10K+', label: 'Habits Tracked', sublabel: 'अभ्यास' },
      { value: '500+', label: 'Projects Shipped', sublabel: 'कर्म' },
      { value: '99.9%', label: 'Uptime', sublabel: 'स्थिरता' },
      { value: '2 min', label: 'Daily Check-in', sublabel: 'नित्य' },
    ],
    featuresTitle: 'विशेषताएं • Features',
    featuresHeadline: 'Everything You Need',
    featuresSubheadline: 'One dashboard to master your daily practice. Track habits, ship projects, manage clients.',
    features: [
      { title: 'Habit Tracking', subtitle: 'अभ्यास', description: 'Build daily habits with streaks and completion tracking.' },
      { title: 'Project Management', subtitle: 'परियोजना', description: 'Track dev projects from idea to shipped.' },
      { title: 'Content Pipeline', subtitle: 'सामग्री', description: 'Plan content with Kanban workflow.' },
      { title: 'Freelance CRM', subtitle: 'ग्राहक', description: 'Track clients from leads to done.' },
      { title: 'Achievements', subtitle: 'सिद्धि', description: 'Earn XP, coins, and achievements.' },
      { title: 'Time Blocking', subtitle: 'समय', description: 'Plan your day with calendar time blocks.' },
    ],
    gamificationTitle: 'सिद्धि • Achievements',
    gamificationHeadline: 'Level Up Your Practice',
    gamificationSubheadline: 'Transform your daily practice into a game. Earn XP, collect coins, unlock achievements, and compete on leaderboards.',
    gamificationItems: [
      { text: 'Earn coins for completing habits' },
      { text: 'Gain XP and level up' },
      { text: 'Unlock achievements' },
      { text: 'Compete on leaderboards' },
    ],
    howItWorksTitle: 'मार्ग • The Path',
    howItWorksHeadline: 'Begin Your Journey',
    howItWorksSubheadline: 'No complex setup. Just sign up, add your habits, and start your practice.',
    steps: [
      { step: '०१', title: 'Create Account', subtitle: 'आरंभ', description: 'Sign up with email or social login.' },
      { step: '०२', title: 'Add Your Habits', subtitle: 'अभ्यास', description: 'Create habits for morning, work, and night routines.' },
      { step: '०३', title: 'Track & Level Up', subtitle: 'उन्नति', description: 'Check off habits daily and earn rewards.' },
    ],
    testimonialsTitle: 'प्रशंसा • Testimonials',
    testimonialsHeadline: 'Loved by साधक',
    pricingTitle: 'मूल्य • Pricing',
    pricingHeadline: 'Free for Limited Time',
    pricingSubheadline: 'Get full access to all features during beta.',
    pricingCta: 'Start साधना Free',
    finalCtaQuote: '॥ कर्मण्येवाधिकारस्ते ॥',
    finalCtaHeadline: 'Ready to Begin?',
    finalCtaSubheadline: 'Join hundreds of practitioners building better daily routines.',
    finalCtaCta: 'Start साधना Free',
    footerTagline: 'Your daily practice for building habits, shipping projects, and leveling up.',
    footerMadeIn: 'Made in India 🇮🇳',
    footerCopyright: '© 2024 Sadhana. Built with ❤️ for साधक',
  },
  en: {
    badge: 'Your Personal Operating System',
    sanskritQuote: '',
    tagline: 'Sadhana — Daily Practice',
    headline: 'Build Habits. Ship Projects. Level Up.',
    subheadline: 'A gamified productivity OS for developers, creators, and freelancers. Transform your daily routine into a journey of growth.',
    cta: 'Begin Your Sadhana',
    explore: 'Explore Features',
    joinText: 'Join 100+ practitioners',
    philosophyQuote: '"Excellence in action is Yoga"',
    philosophySource: '— Bhagavad Gita 2.50',
    stats: [
      { value: '10K+', label: 'Habits Tracked', sublabel: '' },
      { value: '500+', label: 'Projects Shipped', sublabel: '' },
      { value: '99.9%', label: 'Uptime', sublabel: '' },
      { value: '2 min', label: 'Daily Check-in', sublabel: '' },
    ],
    featuresTitle: 'Features',
    featuresHeadline: 'Everything You Need',
    featuresSubheadline: 'One dashboard to master your daily practice. Track habits, ship projects, manage clients.',
    features: [
      { title: 'Habit Tracking', subtitle: '', description: 'Build daily habits with streaks and completion tracking. Morning, work, and night routines.' },
      { title: 'Project Management', subtitle: '', description: 'Track dev projects from idea to shipped. Manage tasks and progress.' },
      { title: 'Content Pipeline', subtitle: '', description: 'Plan content with Kanban workflow. Ideas, drafts, scheduled, posted.' },
      { title: 'Freelance CRM', subtitle: '', description: 'Track clients from leads to done. Project values and next actions.' },
      { title: 'Achievements', subtitle: '', description: 'Earn XP, coins, and achievements. Level up and compete on leaderboards.' },
      { title: 'Time Blocking', subtitle: '', description: 'Plan your day with calendar time blocks. Schedule focus sessions.' },
    ],
    gamificationTitle: 'Achievements',
    gamificationHeadline: 'Level Up Your Practice',
    gamificationSubheadline: 'Transform your daily practice into a game. Earn XP for completing habits, collect coins, unlock achievements, and compete with others.',
    gamificationItems: [
      { text: 'Earn coins for completing habits' },
      { text: 'Gain XP and level up' },
      { text: 'Unlock achievements' },
      { text: 'Compete on leaderboards' },
    ],
    howItWorksTitle: 'The Path',
    howItWorksHeadline: 'Begin Your Journey',
    howItWorksSubheadline: 'No complex setup. Just sign up, add your habits, and start your practice.',
    steps: [
      { step: '01', title: 'Create Account', subtitle: 'Start', description: 'Sign up with email or social login. Takes less than 30 seconds.' },
      { step: '02', title: 'Add Your Habits', subtitle: 'Practice', description: 'Create habits for morning, work, and night routines.' },
      { step: '03', title: 'Track & Level Up', subtitle: 'Progress', description: 'Check off habits daily, earn rewards, and watch your progress grow.' },
    ],
    testimonialsTitle: 'Testimonials',
    testimonialsHeadline: 'Loved by Practitioners',
    pricingTitle: 'Pricing',
    pricingHeadline: 'Free for Limited Time',
    pricingSubheadline: 'Get full access to all features during beta.',
    pricingCta: 'Start Sadhana Free',
    finalCtaQuote: '',
    finalCtaHeadline: 'Ready to Begin?',
    finalCtaSubheadline: 'Join hundreds of practitioners building better daily routines. Start your practice today.',
    finalCtaCta: 'Start Sadhana Free',
    footerTagline: 'Your daily practice for building habits, shipping projects, and leveling up.',
    footerMadeIn: 'Made in India 🇮🇳',
    footerCopyright: '© 2024 Sadhana. Built with ❤️ for practitioners',
  }
}

const featureIcons = [Target, Rocket, TrendingUp, Users, Trophy, Calendar]
const featureColors = [
  { color: 'from-accent-primary to-blue-400', bgColor: 'bg-accent-primary/10' },
  { color: 'from-purple-500 to-pink-400', bgColor: 'bg-purple-500/10' },
  { color: 'from-pink-500 to-rose-400', bgColor: 'bg-pink-500/10' },
  { color: 'from-yellow-500 to-orange-400', bgColor: 'bg-yellow-500/10' },
  { color: 'from-accent-success to-emerald-400', bgColor: 'bg-accent-success/10' },
  { color: 'from-cyan-500 to-blue-400', bgColor: 'bg-cyan-500/10' },
]
const stepIcons = [Users, Target, TrendingUp]
const gamificationIcons = [Coins, Flame, Trophy, Users]

export default function Home() {
  const [lang, setLang] = useState<'hi' | 'en'>('hi')
  const t = content[lang]

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Image src="/Logo/logo.svg" alt="Sadhana" width={36} height={36} className="rounded-xl group-hover:animate-pulse transition-transform" />
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight">Sadhana</span>
              {lang === 'hi' && <span className="text-[10px] text-foreground-muted leading-tight">साधना</span>}
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-foreground-muted">
            <Link href="#features" className="hover:text-foreground transition">Features</Link>
            <Link href="#achievements" className="hover:text-foreground transition">Achievements</Link>
            <Link href="#how-it-works" className="hover:text-foreground transition">How it Works</Link>
            <Link href="#pricing" className="hover:text-foreground transition">Pricing</Link>
            <Link href="/about" className="hover:text-foreground transition">About</Link>
          </div>
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border-subtle rounded-lg text-sm hover:bg-background transition"
            >
              <Globe size={14} />
              <span>{lang === 'hi' ? 'EN' : 'हिं'}</span>
            </button>
            <Link href="/login" className="px-4 py-2 text-foreground-muted hover:text-foreground transition text-sm font-medium hidden sm:block">
              Sign In
            </Link>
            <Link href="/signup" className="px-5 py-2.5 bg-gradient-to-r from-accent-primary to-purple-500 text-white rounded-xl hover:opacity-90 transition text-sm font-medium shadow-lg shadow-accent-primary/20">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary/20 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-pulse [animation-delay:1s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[128px] animate-pulse [animation-delay:2s]" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            {lang === 'hi' && t.sanskritQuote && (
              <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-surface/80 backdrop-blur rounded-full border border-border-subtle animate-[fadeIn_0.5s_ease-out]">
                <span className="text-orange-400 font-medium">॥</span>
                <span className="text-sm text-foreground-muted">{t.sanskritQuote.replace(/॥/g, '').trim()}</span>
                <span className="text-orange-400 font-medium">॥</span>
              </div>
            )}
            {lang === 'en' && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface/80 backdrop-blur rounded-full border border-border-subtle animate-[fadeIn_0.5s_ease-out]">
                <Sparkles size={14} className="text-yellow-400 animate-pulse" />
                <span className="text-sm text-foreground-muted">{t.badge}</span>
              </div>
            )}

            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight animate-[fadeInUp_0.6s_ease-out]">
                <span className="bg-gradient-to-r from-white via-white to-foreground-muted bg-clip-text text-transparent">Sadhana</span>
              </h1>
              <p className="text-2xl md:text-3xl text-foreground-muted font-light animate-[fadeInUp_0.6s_ease-out_0.1s_both]">
                {t.tagline}
              </p>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold tracking-tight animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
              <span className="bg-gradient-to-r from-accent-primary via-purple-400 to-orange-400 bg-clip-text text-transparent">{t.headline}</span>
            </h2>

            <p className="text-lg md:text-xl text-foreground-muted max-w-2xl mx-auto leading-relaxed animate-[fadeInUp_0.6s_ease-out_0.3s_both]">{t.subheadline}</p>

            <div className="flex gap-4 justify-center flex-wrap pt-4 animate-[fadeInUp_0.6s_ease-out_0.4s_both]">
              <Link href="/signup" className="group px-8 py-4 bg-gradient-to-r from-accent-primary via-purple-500 to-orange-500 text-white rounded-xl hover:scale-105 transition-all font-semibold text-lg flex items-center gap-2 shadow-lg shadow-accent-primary/25">
                {t.cta}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="#features" className="px-8 py-4 bg-surface text-foreground rounded-xl hover:bg-surface/80 hover:scale-105 transition-all border border-border-subtle font-semibold text-lg">
                {t.explore}
              </Link>
            </div>

            <div className="flex items-center justify-center gap-8 pt-8 text-foreground-muted text-sm animate-[fadeIn_0.6s_ease-out_0.6s_both]">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {(lang === 'hi' ? ['स', 'अ', 'ध', 'न'] : ['S', 'A', 'D', 'H']).map((letter, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-purple-500 border-2 border-background flex items-center justify-center text-xs font-bold text-white hover:scale-110 transition-transform">
                      {letter}
                    </div>
                  ))}
                </div>
                <span>{t.joinText}</span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-orange-400 text-orange-400" />)}
                <span className="ml-1">5.0</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-16 border-y border-border-subtle bg-gradient-to-r from-orange-500/5 via-purple-500/5 to-accent-primary/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xl md:text-2xl text-foreground-muted italic leading-relaxed">{t.philosophyQuote}</p>
          <p className="text-foreground-muted mt-2">{t.philosophySource}</p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-b border-border-subtle bg-surface/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {t.stats.map((stat, i) => {
              const icons = [Target, Rocket, Shield, Clock]
              const Icon = icons[i]
              return (
                <div key={i} className="text-center group hover:scale-105 transition-transform">
                  <Icon size={24} className="mx-auto mb-3 text-accent-primary group-hover:scale-110 transition-transform" />
                  <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                  <div className="text-foreground-muted text-sm">{stat.label}</div>
                  {stat.sublabel && <div className="text-orange-400 text-xs mt-1">{stat.sublabel}</div>}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-primary/10 rounded-full text-accent-primary text-sm font-medium mb-4">
              <Sparkles size={14} />
              {t.featuresTitle}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.featuresHeadline}</h2>
            <p className="text-foreground-muted text-lg max-w-2xl mx-auto">{t.featuresSubheadline}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.features.map((feature, i) => {
              const Icon = featureIcons[i]
              const colors = featureColors[i]
              return (
                <div key={i} className="group relative bg-surface p-6 rounded-2xl border border-border-subtle hover:border-transparent hover:scale-[1.02] transition-all duration-300 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${colors.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  <div className={`${colors.bgColor} p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    {feature.subtitle && <span className="text-orange-400 text-sm">{feature.subtitle}</span>}
                  </div>
                  <p className="text-foreground-muted leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>


      {/* Achievements Section */}
      <section id="achievements" className="py-24 bg-surface/50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 rounded-full text-orange-400 text-sm font-medium mb-4">
                <Trophy size={14} />
                {t.gamificationTitle}
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="text-transparent bg-gradient-to-r from-accent-primary to-orange-400 bg-clip-text">{t.gamificationHeadline}</span>
              </h2>
              <p className="text-foreground-muted text-lg mb-8 leading-relaxed">{t.gamificationSubheadline}</p>
              <div className="space-y-4">
                {t.gamificationItems.map((item, i) => {
                  const Icon = gamificationIcons[i]
                  return (
                    <div key={i} className="flex items-center gap-3 group">
                      <div className="p-2 bg-accent-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                        <Icon size={18} className="text-accent-primary" />
                      </div>
                      <span className="text-foreground-muted">{item.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/20 via-purple-500/20 to-orange-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-surface border border-border-subtle rounded-3xl p-8 hover:scale-[1.02] transition-transform">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent-primary via-purple-500 to-orange-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">🧘</span>
                  </div>
                  <div>
                    <div className="font-bold text-lg">{lang === 'hi' ? 'साधक' : 'Practitioner'}</div>
                    <div className="text-foreground-muted text-sm">Level 12 • 2,450 XP</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="flex items-center gap-1 text-orange-400">
                      <Coins size={16} />
                      <span className="font-bold">1,250</span>
                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-foreground-muted">Progress to Level 13</span>
                    <span className="text-accent-primary">450/1000 XP</span>
                  </div>
                  <div className="h-3 bg-background rounded-full overflow-hidden">
                    <div className="h-full w-[45%] bg-gradient-to-r from-accent-primary via-purple-500 to-orange-500 rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Streak', value: '14', icon: '🔥' },
                    { label: 'Habits', value: '156', icon: '✅' },
                    { label: 'Rank', value: '#23', icon: '🏆' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-background/50 rounded-xl p-3 text-center hover:scale-105 transition-transform">
                      <div className="text-xl mb-1">{stat.icon}</div>
                      <div className="font-bold">{stat.value}</div>
                      <div className="text-foreground-muted text-xs">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-xl p-4 flex items-center gap-3">
                  <div className="text-3xl">🏅</div>
                  <div>
                    <div className="font-semibold text-orange-400">Week Warrior {lang === 'hi' && <span className="text-xs">• योद्धा</span>}</div>
                    <div className="text-foreground-muted text-sm">Complete all habits for 7 days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-success/10 rounded-full text-accent-success text-sm font-medium mb-4">
              <Clock size={14} />
              {t.howItWorksTitle}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.howItWorksHeadline}</h2>
            <p className="text-foreground-muted text-lg max-w-2xl mx-auto">{t.howItWorksSubheadline}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {t.steps.map((item, i) => {
              const Icon = stepIcons[i]
              return (
                <div key={i} className="relative group">
                  {i < 2 && <div className="hidden md:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-border-subtle to-transparent z-0" />}
                  <div className="relative bg-surface border border-border-subtle rounded-2xl p-8 text-center hover:scale-[1.02] transition-transform">
                    <div className="text-5xl font-bold text-orange-400/30 mb-4">{item.step}</div>
                    <div className="w-14 h-14 bg-accent-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Icon size={28} className="text-accent-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-1">{item.title}</h3>
                    {item.subtitle && <p className="text-orange-400 text-sm mb-2">{item.subtitle}</p>}
                    <p className="text-foreground-muted">{item.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-surface/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 rounded-full text-purple-400 text-sm font-medium mb-4">
              <Star size={14} />
              {t.testimonialsTitle}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.testimonialsHeadline}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: 'Finally, a habit tracker that feels meaningful. The achievements keep me consistent every day.', author: 'Arjun Sharma', role: 'Full-Stack Developer', avatar: lang === 'hi' ? 'अ' : 'A' },
              { quote: "I've shipped 3 side projects since using Sadhana. The project tracking is exactly what I needed.", author: 'Priya Patel', role: 'Indie Hacker', avatar: lang === 'hi' ? 'प्र' : 'P' },
              { quote: 'The freelance CRM alone is worth it. I have never been this organized with my client pipeline.', author: 'Rahul Verma', role: 'Freelance Designer', avatar: lang === 'hi' ? 'र' : 'R' },
            ].map((testimonial, i) => (
              <div key={i} className="bg-surface border border-border-subtle rounded-2xl p-6 hover:scale-[1.02] transition-transform">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} size={16} className="fill-orange-400 text-orange-400" />)}
                </div>
                <p className="text-foreground-muted mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-accent-primary via-purple-500 to-orange-500 rounded-full flex items-center justify-center font-bold text-white">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-foreground-muted text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-success/10 rounded-full text-accent-success text-sm font-medium mb-4">
              <Coins size={14} />
              {t.pricingTitle}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.pricingHeadline}</h2>
            <p className="text-foreground-muted text-lg">{t.pricingSubheadline}</p>
          </div>
          <div className="max-w-md mx-auto">
            <div className="relative bg-gradient-to-br from-accent-primary/10 via-purple-500/10 to-orange-500/10 border border-accent-primary/30 rounded-2xl p-8 hover:scale-[1.02] transition-transform">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-accent-primary to-orange-500 text-white text-xs font-medium rounded-full">
                LIMITED TIME
              </div>
              <div className="text-accent-primary text-sm font-medium mb-2">BETA ACCESS</div>
              <div className="text-4xl font-bold mb-4">₹0<span className="text-lg text-foreground-muted font-normal"> free</span></div>
              <p className="text-foreground-muted mb-6">Full access to all features during beta</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited habits',
                  'Project tracking',
                  'Freelance CRM',
                  'Content pipeline',
                  'Time blocking',
                  'Achievements & XP',
                  'Premium themes',
                  'All features unlocked',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-foreground-muted">
                    <CheckCircle2 size={18} className="text-accent-success" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block w-full py-3 text-center bg-gradient-to-r from-accent-primary via-purple-500 to-orange-500 text-white rounded-xl font-medium hover:opacity-90 transition">
                {t.pricingCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative overflow-hidden bg-gradient-to-br from-accent-primary via-purple-600 to-orange-500 rounded-3xl p-12 md:p-16 text-center group hover:scale-[1.01] transition-transform">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="relative">
              {t.finalCtaQuote && <p className="text-white/80 text-lg mb-2">{t.finalCtaQuote}</p>}
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{t.finalCtaHeadline}</h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">{t.finalCtaSubheadline}</p>
              <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-accent-primary rounded-xl font-semibold text-lg hover:bg-white/90 hover:scale-105 transition-all shadow-lg">
                {t.finalCtaCta}
                <ChevronRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-16 bg-surface/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Image src="/Logo/logo.svg" alt="Sadhana" width={36} height={36} className="rounded-xl" />
                <div className="flex flex-col">
                  <span className="font-bold text-lg leading-tight">Sadhana</span>
                  {lang === 'hi' && <span className="text-[10px] text-foreground-muted leading-tight">साधना</span>}
                </div>
              </Link>
              <p className="text-foreground-muted text-sm leading-relaxed">{t.footerTagline}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-foreground-muted">
                <li><Link href="#features" className="hover:text-foreground transition">Features</Link></li>
                <li><Link href="#achievements" className="hover:text-foreground transition">Achievements</Link></li>
                <li><Link href="#how-it-works" className="hover:text-foreground transition">How it Works</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground transition">Pricing</Link></li>
                <li><Link href="/signup" className="hover:text-foreground transition">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-foreground-muted">
                <li><Link href="/about" className="hover:text-foreground transition">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-foreground-muted">
                <li><Link href="/privacy" className="hover:text-foreground transition">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition">Terms of Service</Link></li>
                <li><Link href="/refund" className="hover:text-foreground transition">Refund Policy</Link></li>
                <li><Link href="/disclaimer" className="hover:text-foreground transition">Disclaimer</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border-subtle flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-foreground-muted text-sm flex items-center gap-1">
              {t.footerCopyright.includes('❤️') ? (
                <>{t.footerCopyright.split('❤️')[0]}<Heart size={14} className="inline text-orange-400 fill-orange-400" />{t.footerCopyright.split('❤️')[1]}</>
              ) : t.footerCopyright}
            </div>
            <div className="text-foreground-muted text-sm">{t.footerMadeIn}</div>
          </div>
        </div>
      </footer>
    </main>
  )
}
