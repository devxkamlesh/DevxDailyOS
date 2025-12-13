'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { ArrowLeft, Mail, MessageSquare, Clock, CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error: submitError } = await supabase
        .from('contact_submissions')
        .insert({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message
        })

      if (submitError) throw submitError

      setSuccess(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <nav className="border-b border-border-subtle">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/Logo/logo.svg" alt="Sadhana" width={32} height={32} className="rounded-lg" />
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
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-accent-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-accent-success" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Message Sent!</h2>
                <p className="text-foreground-muted mb-6">
                  Thank you for reaching out. We'll get back to you soon.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="text-accent-primary hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-6">Send us a Message</h2>
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:border-accent-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:border-accent-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <select 
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:border-accent-primary transition"
                    >
                      <option value="">Select a topic</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Feedback & Suggestions">Feedback & Suggestions</option>
                      <option value="Billing & Payments">Billing & Payments</option>
                      <option value="Bug Report">Bug Report</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <textarea
                      rows={4}
                      placeholder="How can we help you?"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:border-accent-primary transition resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-accent-primary text-white rounded-xl font-medium hover:bg-accent-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* FAQ Link */}
        <div className="mt-12 text-center">
          <p className="text-foreground-muted">
            Looking for quick answers? Check out our{' '}
            <Link href="/about" className="text-accent-primary hover:underline">About page</Link>{' '}
            for more information about Sadhana.
          </p>
        </div>
      </div>
    </main>
  )
}
