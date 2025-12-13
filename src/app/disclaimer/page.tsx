import Link from 'next/link'
import { Flame, ArrowLeft } from 'lucide-react'

export default function DisclaimerPage() {
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
        <h1 className="text-4xl font-bold mb-2">Disclaimer</h1>
        <p className="text-foreground-muted mb-8">Last updated: December 13, 2024</p>

        <div className="space-y-8 text-foreground-muted">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. General Information</h2>
            <p className="leading-relaxed">
              The information provided by DevX Daily OS is for general informational and productivity 
              purposes only. All information on the platform is provided in good faith, however, we 
              make no representation or warranty of any kind, express or implied, regarding the 
              accuracy, adequacy, validity, reliability, availability, or completeness of any 
              information on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. No Professional Advice</h2>
            <p className="leading-relaxed">
              DevX Daily OS is a productivity tool and does not provide professional advice of any kind. 
              The platform is not a substitute for professional advice in areas including but not limited to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Medical or health advice</li>
              <li>Financial or investment advice</li>
              <li>Legal advice</li>
              <li>Mental health counseling</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Beta Software</h2>
            <p className="leading-relaxed">
              DevX Daily OS is currently in beta. This means:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li>Features may change, be added, or removed without notice</li>
              <li>Bugs and issues may occur</li>
              <li>Data loss is possible (though we take precautions to prevent it)</li>
              <li>Service interruptions may happen during updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Results Disclaimer</h2>
            <p className="leading-relaxed">
              While DevX Daily OS is designed to help improve productivity and build habits, 
              we cannot guarantee specific results. Your success depends on various factors 
              including your commitment, consistency, and individual circumstances. 
              Testimonials and examples used are not guarantees of similar results.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Third-Party Links</h2>
            <p className="leading-relaxed">
              Our platform may contain links to third-party websites or services that are not 
              owned or controlled by DevX Daily OS. We have no control over, and assume no 
              responsibility for, the content, privacy policies, or practices of any third-party 
              websites or services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Limitation of Liability</h2>
            <p className="leading-relaxed">
              Under no circumstances shall DevX Daily OS be liable for any direct, indirect, 
              incidental, consequential, special, or exemplary damages arising out of or in 
              connection with your use of the platform. This includes, but is not limited to, 
              damages for loss of profits, goodwill, data, or other intangible losses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Accuracy of Information</h2>
            <p className="leading-relaxed">
              We strive to keep information accurate and up-to-date, but we make no guarantees 
              about the completeness, reliability, or accuracy of this information. Any action 
              you take based on the information on our platform is strictly at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Contact</h2>
            <p className="leading-relaxed">
              If you have any questions about this Disclaimer, please contact us through our{' '}
              <Link href="/contact" className="text-accent-primary hover:underline">contact page</Link>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
