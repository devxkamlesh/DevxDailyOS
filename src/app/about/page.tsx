import Link from 'next/link'
import { Flame, Target, Rocket, Heart, ArrowLeft } from 'lucide-react'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border-subtle">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-primary via-purple-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Flame size={18} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold leading-tight">Sadhana</span>
              <span className="text-[10px] text-foreground-muted leading-tight">साधना</span>
            </div>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition text-sm">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">About Sadhana</h1>
        <p className="text-orange-400/60 mb-8">साधना के बारे में</p>
        
        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Target className="text-accent-primary" size={24} />
              Our Vision • दृष्टि
            </h2>
            <p className="text-foreground-muted leading-relaxed">
              <strong>Sadhana</strong> (साधना) means "daily practice" in Sanskrit — the disciplined pursuit 
              of mastery through consistent effort. This ancient concept inspired us to build a modern 
              productivity platform that honors the wisdom of daily practice.
            </p>
            <p className="text-foreground-muted leading-relaxed mt-4">
              We believe that developers, creators, and freelancers need more than just tools — they need 
              a system that makes daily practice enjoyable and rewarding. Sadhana combines habit tracking, 
              project management, client CRM, and content planning with gamification to keep you motivated.
            </p>
            <p className="text-foreground-muted leading-relaxed mt-4 italic border-l-2 border-orange-400 pl-4">
              "अभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते" — Through practice and detachment, it is mastered. (Bhagavad Gita 6.35)
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Rocket className="text-purple-400" size={24} />
              What We're Building
            </h2>
            <ul className="space-y-3 text-foreground-muted">
              <li className="flex items-start gap-3">
                <span className="text-accent-success">✓</span>
                <span><strong>Habit Tracking</strong> — Build and maintain daily habits with streaks, categories, and completion tracking</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent-success">✓</span>
                <span><strong>Project Management</strong> — Track your side projects from idea to shipped with tasks and progress</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent-success">✓</span>
                <span><strong>Freelance CRM</strong> — Manage clients, track deals, and never miss a follow-up</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent-success">✓</span>
                <span><strong>Content Pipeline</strong> — Plan and schedule your social media content</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent-success">✓</span>
                <span><strong>Gamification</strong> — Earn XP, coins, achievements, and compete on leaderboards</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Heart className="text-orange-400" size={24} />
              Built for साधक (Practitioners)
            </h2>
            <p className="text-foreground-muted leading-relaxed">
              Sadhana is built by developers, for developers. We understand the unique 
              challenges of balancing coding, content creation, freelance work, and personal growth. 
              That's why we've designed every feature with your workflow in mind.
            </p>
            <p className="text-foreground-muted leading-relaxed mt-4">
              We're currently in beta and actively building new features based on user feedback. 
              Your input shapes the future of this product. Join our community of साधक (practitioners) 
              committed to daily growth.
            </p>
          </section>

          <section className="bg-surface rounded-2xl p-8 border border-border-subtle">
            <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
            <p className="text-foreground-muted mb-4">
              Have questions, feedback, or just want to say hi? We'd love to hear from you.
            </p>
            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-accent-primary text-white rounded-xl font-medium hover:opacity-90 transition">
              Contact Us
            </Link>
          </section>
        </div>
      </div>
    </main>
  )
}
