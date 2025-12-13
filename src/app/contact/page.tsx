import Link from 'next/link'
import { Flame, ArrowLeft, Mail, MessageSquare, Clock } from 'lucide-react'

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
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
        <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-foreground-muted mb-12 text-lg">
          Have questions, feedback, or need support? We'd love to hear from you.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-accent-primary/10 rounded-lg">
                  <Mail size={20} className="text-accent-primary" />
                </div>
                <h3 className="font-semibold">Email Support</h3>
              </div>
              <p className="text-foreground-muted text-sm mb-3">
                For general inquiries and support
              </p>
              <a href="mailto:support@sadhana.app" className="text-accent-primary hover:underline">
                support@sadhana.app
              </a>
            </div>

            <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <MessageSquare size={20} className="text-purple-400" />
                </div>
                <h3 className="font-semibold">Feedback</h3>
              </div>
              <p className="text-foreground-muted text-sm mb-3">
                Share your ideas and suggestions
              </p>
              <a href="mailto:feedback@sadhana.app" className="text-accent-primary hover:underline">
                feedback@sadhana.app
              </a>
            </div>

            <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-accent-success/10 rounded-lg">
                  <Clock size={20} className="text-accent-success" />
                </div>
                <h3 className="font-semibold">Response Time</h3>
              </div>
              <p className="text-foreground-muted text-sm">
                We typically respond within 24-48 hours during business days. 
                For urgent issues, please mention "URGENT" in your subject line.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-surface rounded-2xl p-8 border border-border-subtle">
            <h2 className="text-xl font-semibold mb-6">Send us a Message</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:border-accent-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:border-accent-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <select className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:border-accent-primary transition">
                  <option value="">Select a topic</option>
                  <option value="support">Technical Support</option>
                  <option value="feedback">Feedback & Suggestions</option>
                  <option value="billing">Billing & Payments</option>
                  <option value="bug">Bug Report</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  rows={4}
                  placeholder="How can we help you?"
                  className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:border-accent-primary transition resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-accent-primary text-white rounded-xl font-medium hover:opacity-90 transition"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>

        {/* FAQ Link */}
        <div className="mt-12 text-center">
          <p className="text-foreground-muted">
            Looking for quick answers? Check out our{' '}
            <Link href="/about" className="text-accent-primary hover:underline">About page</Link>{' '}
            for more information about DevX Daily OS.
          </p>
        </div>
      </div>
    </main>
  )
}
