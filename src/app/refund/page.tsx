import Link from 'next/link'
import { Flame, ArrowLeft } from 'lucide-react'

export default function RefundPage() {
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
        <h1 className="text-4xl font-bold mb-2">Refund Policy</h1>
        <p className="text-foreground-muted mb-8">Last updated: December 13, 2024</p>

        <div className="space-y-8 text-foreground-muted">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Free Beta Period</h2>
            <p className="leading-relaxed">
              During our beta period, DevX Daily OS is completely free to use. No payment is required, 
              and therefore no refunds are applicable for free usage.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Coin Purchases</h2>
            <p className="leading-relaxed">
              If you purchase coins through our in-app shop using Razorpay:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li><strong>Unused Coins:</strong> Refund requests for unused coins may be considered within 7 days of purchase</li>
              <li><strong>Used Coins:</strong> Coins that have been spent on themes, avatars, or other items are non-refundable</li>
              <li><strong>Technical Issues:</strong> If coins were not credited due to a technical error, we will either credit the coins or process a full refund</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. How to Request a Refund</h2>
            <p className="leading-relaxed">To request a refund:</p>
            <ol className="list-decimal list-inside mt-2 space-y-2">
              <li>Contact us through our <Link href="/contact" className="text-accent-primary hover:underline">contact page</Link></li>
              <li>Provide your registered email address</li>
              <li>Include the transaction ID or order ID</li>
              <li>Explain the reason for your refund request</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Refund Processing</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Refund requests are reviewed within 3-5 business days</li>
              <li>Approved refunds are processed to the original payment method</li>
              <li>Refunds may take 5-10 business days to reflect in your account</li>
              <li>You will receive an email confirmation once the refund is processed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Non-Refundable Items</h2>
            <p className="leading-relaxed">The following are non-refundable:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Coins that have been spent on in-app purchases</li>
              <li>Bonus coins received with purchases</li>
              <li>Virtual items (themes, avatars, features) once unlocked</li>
              <li>Purchases made more than 30 days ago</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Exceptions</h2>
            <p className="leading-relaxed">
              We may make exceptions to this policy in cases of:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Unauthorized transactions (with proper verification)</li>
              <li>Service unavailability for extended periods</li>
              <li>Significant bugs affecting purchased features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Contact Us</h2>
            <p className="leading-relaxed">
              For refund inquiries, please reach out through our{' '}
              <Link href="/contact" className="text-accent-primary hover:underline">contact page</Link>.
              We aim to resolve all refund requests fairly and promptly.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
