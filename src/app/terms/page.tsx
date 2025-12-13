import Link from 'next/link'
import { Flame, ArrowLeft } from 'lucide-react'

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-foreground-muted mb-8">Last updated: December 13, 2024</p>

        <div className="space-y-8 text-foreground-muted">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing or using DevX Daily OS, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Description of Service</h2>
            <p className="leading-relaxed">
              DevX Daily OS is a productivity platform that provides habit tracking, project management, 
              freelance CRM, content planning, and gamification features. We reserve the right to modify, 
              suspend, or discontinue any part of the service at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. User Accounts</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must notify us immediately of any unauthorized access</li>
              <li>You may not use another person's account without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Acceptable Use</h2>
            <p className="leading-relaxed">You agree not to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use the service for any illegal or harmful purpose</li>
              <li>Interfere with the proper functioning of the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Virtual Currency</h2>
            <p className="leading-relaxed">
              Coins and XP earned within DevX Daily OS are virtual items with no real-world monetary value. 
              They cannot be exchanged for cash or transferred outside the platform. 
              We reserve the right to modify the virtual economy at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Intellectual Property</h2>
            <p className="leading-relaxed">
              All content, features, and functionality of DevX Daily OS are owned by us and are 
              protected by copyright, trademark, and other intellectual property laws. 
              You retain ownership of the content you create within the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Limitation of Liability</h2>
            <p className="leading-relaxed">
              DevX Daily OS is provided "as is" without warranties of any kind. We shall not be liable 
              for any indirect, incidental, special, or consequential damages arising from your use 
              of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Changes to Terms</h2>
            <p className="leading-relaxed">
              We may update these terms from time to time. We will notify you of any material changes 
              by posting the new terms on this page. Your continued use of the service after changes 
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Contact</h2>
            <p className="leading-relaxed">
              For questions about these Terms, please contact us at{' '}
              <Link href="/contact" className="text-accent-primary hover:underline">our contact page</Link>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
