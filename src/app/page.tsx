import Link from 'next/link'
import Image from 'next/image'
import { ProductGlimpse } from '@/components/ProductGlimpse'

export default function Home() {
  return (
    <main className="min-h-screen bg-background font-sans relative overflow-x-hidden">
      {/* Vertical Grid Lines - Responsive Width Structure */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="w-full h-full flex justify-center">
          {/* Responsive container: 1600px for screens ≥1920px, 1200px for smaller, but never exceed viewport */}
          <div className="w-full max-w-[1200px] 2xl:max-w-[1600px] h-full flex">
            {/* Left margin with vertical line */}
            <div className="w-[150px] 2xl:w-[200px] border-r border-border-subtle flex-shrink-0"></div>
            {/* Main content area - no additional lines */}
            <div className="flex-1 min-w-0"></div>
            {/* Right margin with vertical line */}
            <div className="w-[150px] 2xl:w-[200px] border-l border-border-subtle flex-shrink-0"></div>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border-subtle relative overflow-x-hidden">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[1200px] 2xl:max-w-[1600px] flex">
            <div className="w-[150px] 2xl:w-[200px] flex-shrink-0"></div>
            <div className="flex-1 min-w-0 px-4 sm:px-8">
              <div className="flex items-center justify-between h-16">
                <Link href="/" className="flex items-center space-x-3">
                  <Image src="/Logo/logo.svg" alt="Sadhana" width={28} height={28} className="rounded-lg" />
                  <span className="text-xl font-bold tracking-tight">Sadhana</span>
                </Link>
                <div className="hidden md:flex items-center space-x-8">
                  <Link href="#features" className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors">
                    Features
                  </Link>
                  <Link href="#how-it-works" className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors">
                    How it works
                  </Link>
                  <Link href="#pricing" className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                  <Link href="/login" className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors">
                    Sign in
                  </Link>
                  <Link href="/dashboard" className="inline-flex items-center px-4 py-2 text-sm font-medium text-foreground bg-accent-primary/10 border border-accent-primary/20 rounded-lg hover:bg-accent-primary/20 transition-all">
                    Get started
                  </Link>
                </div>
              </div>
            </div>
            <div className="w-[150px] 2xl:w-[200px] flex-shrink-0"></div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center z-10 border-b border-border-subtle overflow-x-hidden">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[1200px] 2xl:max-w-[1600px] flex">
            <div className="w-[150px] 2xl:w-[200px] flex-shrink-0"></div>
            <div className="flex-1 min-w-0 text-center px-4 sm:px-8">
              <div className="inline-flex items-center px-3 py-1 mb-8 text-xs font-medium text-foreground-muted bg-surface/50 border border-border-subtle rounded-full">
                A personal discipline system
              </div>
              
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground mb-6">
                Show up.{' '}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-success">
                  Every day.
                </span>
              </h1>
              
              <p className="max-w-2xl mx-auto text-lg sm:text-xl text-foreground-muted mb-10 leading-relaxed">
                Sadhana helps you build consistency without pressure, noise, or motivation hacks.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Link 
                  href="/dashboard" 
                  className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-foreground bg-accent-primary/10 border border-accent-primary/20 rounded-lg hover:bg-accent-primary/20 transition-all"
                >
                  Begin today
                </Link>
                <Link 
                  href="#features" 
                  className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-foreground-muted border border-border-subtle rounded-lg hover:text-foreground hover:border-border-subtle/80 transition-all"
                >
                  See how it works
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-foreground-muted">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-accent-success rounded-full"></div>
                  <span>Built for developers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-accent-success rounded-full"></div>
                  <span>Privacy focused</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-accent-success rounded-full"></div>
                  <span>No streak pressure</span>
                </div>
              </div>
            </div>
            <div className="w-[150px] 2xl:w-[200px] flex-shrink-0"></div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="min-h-screen flex items-center border-b border-border-subtle relative z-10 overflow-x-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-success/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="w-full flex justify-center relative">
          <div className="w-full max-w-[1200px] 2xl:max-w-[1600px] flex">
            <div className="w-[150px] 2xl:w-[200px] flex-shrink-0"></div>
            <div className="flex-1 min-w-0 text-center px-4 sm:px-8">
              {/* Quote Mark */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-primary/10 rounded-2xl mb-8">
                <svg className="w-8 h-8 text-accent-primary/60" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                </svg>
              </div>
              
              <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-12 leading-tight">
                <span className="block">Discipline</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-success">
                  beats motivation.
                </span>
              </h2>
              
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                  <div className="bg-surface/30 border border-border-subtle rounded-2xl p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="text-sm font-semibold text-foreground-muted uppercase tracking-wider">Most Tools</span>
                    </div>
                    <p className="text-lg text-foreground-muted leading-relaxed">
                      Try to excite you with flashy features, endless notifications, and dopamine-driven rewards that fade when the novelty wears off.
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-accent-primary/10 to-accent-success/10 border border-accent-primary/20 rounded-2xl p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 bg-accent-success rounded-full"></div>
                      <span className="text-sm font-semibold text-accent-success uppercase tracking-wider">Sadhana</span>
                    </div>
                    <p className="text-lg text-foreground leading-relaxed">
                      Built to stay with you when excitement fades. No streak guilt. No dopamine tricks. Just daily execution.
                    </p>
                  </div>
                </div>
                
                {/* Philosophy Principles */}
                <div className="flex flex-wrap items-center justify-center gap-6 mt-12">
                  <div className="flex items-center gap-3 px-4 py-2 bg-surface/50 border border-border-subtle rounded-full">
                    <div className="w-2 h-2 bg-accent-primary rounded-full"></div>
                    <span className="text-sm font-medium text-foreground">Consistency over intensity</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 bg-surface/50 border border-border-subtle rounded-full">
                    <div className="w-2 h-2 bg-accent-success rounded-full"></div>
                    <span className="text-sm font-medium text-foreground">Progress over perfection</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 bg-surface/50 border border-border-subtle rounded-full">
                    <div className="w-2 h-2 bg-accent-primary rounded-full"></div>
                    <span className="text-sm font-medium text-foreground">Systems over goals</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-[150px] 2xl:w-[200px] flex-shrink-0"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="min-h-screen flex items-center border-b border-border-subtle relative z-10 overflow-x-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-30">
            <div className="absolute top-1/3 left-1/6 w-1 h-32 bg-gradient-to-b from-accent-primary/20 to-transparent"></div>
            <div className="absolute top-2/3 right-1/4 w-1 h-24 bg-gradient-to-b from-accent-success/20 to-transparent"></div>
            <div className="absolute bottom-1/4 left-1/3 w-1 h-20 bg-gradient-to-b from-accent-primary/15 to-transparent"></div>
          </div>
        </div>
        
        <div className="w-full flex justify-center relative">
          <div className="w-full max-w-[1200px] 2xl:max-w-[1600px] flex">
            <div className="w-[150px] 2xl:w-[200px] flex-shrink-0"></div>
            <div className="flex-1 min-w-0 px-4 sm:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                  Everything you need to{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-success">
                    stay consistent
                  </span>
                </h2>
                
                <p className="max-w-2xl mx-auto text-lg text-foreground-muted leading-relaxed">
                  Four core features that work together as one integrated system.
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Daily Habits */}
                <div className="group relative bg-gradient-to-br from-surface/50 to-surface/30 border border-border-subtle rounded-2xl p-6 hover:border-blue-400/30 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Daily Habits</h3>
                  </div>
                  <p className="text-foreground-muted leading-relaxed mb-4">
                    Track routines without streak pressure. Build momentum through consistency.
                  </p>
                </div>
                
                {/* Focus Sessions */}
                <div className="group relative bg-gradient-to-br from-surface/50 to-surface/30 border border-border-subtle rounded-2xl p-6 hover:border-green-400/30 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Focus Sessions</h3>
                  </div>
                  <p className="text-foreground-muted leading-relaxed mb-4">
                    Deep work blocks with time tracking. Turn distraction into discipline.
                  </p>
                </div>
                
                {/* Project Tracking */}
                <div className="group relative bg-gradient-to-br from-surface/50 to-surface/30 border border-border-subtle rounded-2xl p-6 hover:border-purple-400/30 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Project Tracking</h3>
                  </div>
                  <p className="text-foreground-muted leading-relaxed mb-4">
                    Manage side projects from idea to shipped. Break goals into daily actions.
                  </p>
                </div>
                
                {/* Freelance CRM */}
                <div className="group relative bg-gradient-to-br from-surface/50 to-surface/30 border border-border-subtle rounded-2xl p-6 hover:border-orange-400/30 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Freelance CRM</h3>
                  </div>
                  <p className="text-foreground-muted leading-relaxed mb-4">
                    Complete client pipeline from leads to completion. Manage relationships and revenue.
                  </p>
                </div>
              </div>

            </div>
            <div className="w-[150px] 2xl:w-[200px] flex-shrink-0"></div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="min-h-screen flex items-center border-b border-border-subtle relative z-10 overflow-x-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-accent-success/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-accent-primary/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="w-full flex justify-center relative">
          <div className="w-full max-w-[1200px] 2xl:max-w-[1600px] flex">
            <div className="w-[150px] 2xl:w-[200px] flex-shrink-0"></div>
            <div className="flex-1 min-w-0 px-4 sm:px-8">
              <div className="text-center mb-20">
                <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-accent-success/10 border border-accent-success/20 rounded-full">
                  <div className="w-2 h-2 bg-accent-success rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-accent-success">Trusted by Builders</span>
                </div>
                
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                  Built by developers,{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-success">
                    for builders
                  </span>
                </h2>
                
                <p className="max-w-2xl mx-auto text-xl text-foreground-muted leading-relaxed">
                  Used daily by people who value discipline over motivation and substance over hype.
                </p>
              </div>
              
              <div className="max-w-4xl mx-auto">
                {/* Featured Testimonial */}
                <div className="relative bg-gradient-to-br from-surface/50 to-surface/30 border border-accent-primary/20 rounded-3xl p-8 lg:p-12 mb-12 text-center">
                  <div className="absolute top-6 left-6 w-12 h-12 bg-accent-primary/10 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-accent-primary/60" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                    </svg>
                  </div>
                  
                  <blockquote className="text-2xl lg:text-3xl font-medium text-foreground mb-8 leading-relaxed">
                    "Sadhana is the only tool that doesn't try to excite me. It just helps me show up every day."
                  </blockquote>
                  
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent-primary/20 to-accent-success/20 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-foreground">A</span>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">Alex Chen</p>
                      <p className="text-foreground-muted">Senior Full-stack Developer</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-[150px] 2xl:w-[200px] flex-shrink-0"></div>
          </div>
        </div>
      </section>

      {/* Product Glimpse Section */}
      <section className="py-16 lg:py-24 border-b border-border-subtle relative z-10 overflow-x-hidden">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[1200px] 2xl:max-w-[1600px] flex">
            <div className="w-[150px] 2xl:w-[200px] flex-shrink-0"></div>
            <div className="flex-1 min-w-0 px-4 sm:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-center">
                {/* Title and Description */}
                <div className="lg:col-span-1 text-center lg:text-left">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 lg:mb-6">
                    See it in action
                  </h2>
                  <p className="text-lg lg:text-xl text-foreground-muted leading-relaxed">
                    A clean, focused interface that gets out of your way.
                  </p>
                </div>
                
                {/* ProductGlimpse */}
                <div className="lg:col-span-2 w-full overflow-hidden">
                  <ProductGlimpse />
                </div>
              </div>
            </div>
            <div className="w-[150px] 2xl:w-[200px] flex-shrink-0"></div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="min-h-screen flex items-center border-b border-border-subtle relative z-10 overflow-x-hidden">
        <div className="w-full flex justify-center relative">
          <div className="w-full max-w-[1200px] 2xl:max-w-[1600px] flex">
            <div className="w-[150px] 2xl:w-[200px] flex-shrink-0"></div>
            <div className="flex-1 min-w-0 px-4 sm:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                  Simple to start,{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-success">
                    powerful to scale
                  </span>
                </h2>
                
                <p className="max-w-2xl mx-auto text-lg text-foreground-muted leading-relaxed">
                  No complex setup. No overwhelming features. Just what you need to build consistency.
                </p>
              </div>
              
              <div className="max-w-3xl mx-auto">
                {/* Process Flow */}
                <div className="relative">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
                    {/* Connection Lines - simplified to prevent overflow */}
                    <div className="hidden lg:block absolute top-9 left-0 right-0 h-px z-0">
                      <div className="flex items-center justify-center h-full max-w-full">
                        <div className="w-full max-w-2xl h-px bg-gradient-to-r from-accent-primary/30 via-accent-success/40 to-accent-primary/30"></div>
                      </div>
                    </div>
                    
                    {/* Step 1 */}
                    <div className="relative text-center group">
                      <div className="relative mb-6 flex justify-center">
                        <div className="w-18 h-18 bg-gradient-to-br from-accent-primary/20 to-accent-primary/10 border-2 border-accent-primary/30 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 relative z-20">
                          <svg className="w-7 h-7 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-primary rounded-full flex items-center justify-center z-30">
                          <span className="text-xs font-bold text-white">1</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-foreground mb-3">Create Account</h3>
                      <p className="text-sm text-foreground-muted leading-relaxed">
                        Sign up in seconds. No credit card required, no complex onboarding process.
                      </p>
                      
                      <div className="mt-4 inline-flex items-center gap-2 text-xs text-accent-primary">
                        <div className="w-1 h-1 bg-accent-primary rounded-full"></div>
                        <span>30 seconds</span>
                      </div>
                    </div>
                    
                    {/* Step 2 */}
                    <div className="relative text-center group">
                      <div className="relative mb-6 flex justify-center">
                        <div className="w-18 h-18 bg-gradient-to-br from-accent-success/20 to-accent-success/10 border-2 border-accent-success/30 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 relative z-20">
                          <svg className="w-7 h-7 text-accent-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-success rounded-full flex items-center justify-center z-30">
                          <span className="text-xs font-bold text-white">2</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-foreground mb-3">Add One Habit</h3>
                      <p className="text-sm text-foreground-muted leading-relaxed">
                        Start small. Add a single habit that matters to you. Build from there.
                      </p>
                      
                      <div className="mt-4 inline-flex items-center gap-2 text-xs text-accent-success">
                        <div className="w-1 h-1 bg-accent-success rounded-full"></div>
                        <span>Start simple</span>
                      </div>
                    </div>
                    
                    {/* Step 3 */}
                    <div className="relative text-center group">
                      <div className="relative mb-6 flex justify-center">
                        <div className="w-18 h-18 bg-gradient-to-br from-accent-primary/20 to-accent-success/20 border-2 border-accent-primary/30 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 relative z-20">
                          <svg className="w-7 h-7 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-accent-primary to-accent-success rounded-full flex items-center justify-center z-30">
                          <span className="text-xs font-bold text-white">3</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-foreground mb-3">Show Up Daily</h3>
                      <p className="text-sm text-foreground-muted leading-relaxed">
                        Complete your habit. Track progress. Build momentum through consistency.
                      </p>
                      
                      <div className="mt-4 inline-flex items-center gap-2 text-xs text-accent-primary">
                        <div className="w-1 h-1 bg-gradient-to-r from-accent-primary to-accent-success rounded-full"></div>
                        <span>Build momentum</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Bottom CTA */}
                <div className="text-center mt-16">
                  <Link 
                    href="/dashboard" 
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-accent-primary/20 to-accent-success/20 border border-accent-primary/30 rounded-2xl hover:from-accent-primary/30 hover:to-accent-success/30 transition-all duration-300 transform hover:scale-105"
                  >
                    <span className="text-lg font-semibold text-foreground">Start your first habit</span>
                    <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
            <div className="w-[150px] 2xl:w-[200px] flex-shrink-0"></div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="min-h-screen flex items-center border-b border-border-subtle relative z-10 overflow-x-hidden">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[1200px] 2xl:max-w-[1600px] flex">
            <div className="w-[150px] 2xl:w-[200px] flex-shrink-0"></div>
            <div className="flex-1 min-w-0 px-4 sm:px-8">
              <div className="text-center mb-14">
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  Limited time access
                </h2>
                <p className="text-base text-foreground-muted">
                  Get full access while we're in beta. Pricing starts later.
                </p>
              </div>
              
              <div className="max-w-sm mx-auto">
                <div className="relative bg-gradient-to-br from-surface/50 to-surface/30 border border-accent-primary/20 rounded-3xl p-8 text-center overflow-hidden backdrop-blur-sm">
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-accent-success/5 rounded-3xl"></div>
                  
                  {/* Limited time badge */}
                  <div className="relative inline-flex items-center gap-2 px-3 py-1.5 mb-7 bg-gradient-to-r from-accent-primary/20 to-accent-success/20 border border-accent-primary/30 rounded-full">
                    <div className="w-1.5 h-1.5 bg-accent-success rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold text-foreground">Limited Beta Access</span>
                  </div>
                  
                  <div className="relative mb-8">
                    <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-success mb-2">
                      Free
                    </div>
                    <p className="text-base text-foreground-muted">
                      Full access during beta
                    </p>
                  </div>
                  
                  <div className="relative space-y-3 mb-8">
                    <div className="flex items-center gap-2.5 text-left">
                      <div className="w-5 h-5 bg-accent-success/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-accent-success" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm text-foreground">Everything included</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-left">
                      <div className="w-5 h-5 bg-accent-success/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-accent-success" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm text-foreground">No credit card required</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-left">
                      <div className="w-5 h-5 bg-accent-success/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-accent-success" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm text-foreground">Cancel anytime</span>
                    </div>
                  </div>
                  
                  <Link 
                    href="/dashboard" 
                    className="relative block w-full py-3 text-center text-sm font-semibold text-foreground bg-gradient-to-r from-accent-primary/20 to-accent-success/20 border border-accent-primary/30 rounded-xl hover:from-accent-primary/30 hover:to-accent-success/30 transition-all duration-300 transform hover:scale-105"
                  >
                    Start Free Beta
                  </Link>
                  
                  <p className="relative text-xs text-foreground-muted mt-5 leading-relaxed">
                    Join early adopters shaping the future of personal discipline systems
                  </p>
                </div>
              </div>
            </div>
            <div className="w-[150px] 2xl:w-[200px] flex-shrink-0"></div>
          </div>
        </div>
      </section>

      {/* Final CTA + Footer Section */}
      <section className="py-12 lg:py-16 relative z-10 overflow-x-hidden">
        {/* CTA Content */}
        <div className="mb-14 lg:mb-20">
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[1200px] 2xl:max-w-[1600px] flex">
              <div className="w-[150px] 2xl:w-[200px] flex-shrink-0"></div>
              <div className="flex-1 min-w-0 text-center px-4 sm:px-8">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-5">
                  Begin your practice.
                </h2>
                <p className="text-lg sm:text-xl text-foreground-muted mb-10 max-w-xl mx-auto leading-relaxed">
                  No setup. No pressure. Just today.
                </p>
                <Link 
                  href="/dashboard" 
                  className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-foreground bg-gradient-to-r from-accent-primary/20 to-accent-success/20 border border-accent-primary/30 rounded-2xl hover:from-accent-primary/30 hover:to-accent-success/30 transition-all duration-300 transform hover:scale-105"
                >
                  Start Sadhana
                </Link>
              </div>
              <div className="w-[150px] 2xl:w-[200px] flex-shrink-0"></div>
            </div>
          </div>
        </div>

        {/* Footer Content */}
        <footer className="border-t border-border-subtle pt-12">
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[1200px] 2xl:max-w-[1600px] flex">
              <div className="w-[150px] 2xl:w-[200px] flex-shrink-0"></div>
              <div className="flex-1 min-w-0 px-4 sm:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  <div className="col-span-2 md:col-span-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Image src="/Logo/logo.svg" alt="Sadhana" width={24} height={24} className="rounded-lg" />
                      <span className="text-lg font-bold tracking-tight">Sadhana</span>
                    </div>
                    <p className="text-foreground-muted leading-relaxed text-xs">
                      A personal discipline system for developers, creators, and independent builders who value consistency over motivation.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground mb-3">Product</h4>
                    <ul className="space-y-2 text-xs">
                      <li><Link href="/dashboard" className="text-foreground-muted hover:text-foreground transition-colors">Dashboard</Link></li>
                      <li><Link href="#features" className="text-foreground-muted hover:text-foreground transition-colors">Features</Link></li>
                      <li><Link href="#how-it-works" className="text-foreground-muted hover:text-foreground transition-colors">How it works</Link></li>
                      <li><Link href="#pricing" className="text-foreground-muted hover:text-foreground transition-colors">Pricing</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground mb-3">Company</h4>
                    <ul className="space-y-2 text-xs">
                      <li><Link href="/about" className="text-foreground-muted hover:text-foreground transition-colors">About</Link></li>
                      <li><Link href="/contact" className="text-foreground-muted hover:text-foreground transition-colors">Contact</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground mb-3">Legal</h4>
                    <ul className="space-y-2 text-xs">
                      <li><Link href="/privacy" className="text-foreground-muted hover:text-foreground transition-colors">Privacy</Link></li>
                      <li><Link href="/terms" className="text-foreground-muted hover:text-foreground transition-colors">Terms</Link></li>
                    </ul>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 pb-4">
                  <div className="text-xs text-foreground-muted">
                    © 2025 Sadhana. Built with discipline for practitioners.
                  </div>
                  <div className="text-xs text-foreground-muted">
                    Made in India 🇮🇳
                  </div>
                </div>
              </div>
              <div className="w-[150px] 2xl:w-[200px] flex-shrink-0"></div>
            </div>
          </div>
        </footer>
      </section>
    </main>
  )
}