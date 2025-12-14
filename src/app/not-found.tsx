import { FileQuestion, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-surface p-8 rounded-2xl border border-border-subtle text-center">
          <div className="p-4 bg-accent-primary/20 rounded-full w-fit mx-auto mb-6">
            <FileQuestion size={32} className="text-accent-primary" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Page Not Found
          </h1>
          
          <p className="text-foreground-muted mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent-primary text-white rounded-xl hover:opacity-90 transition font-medium"
            >
              <Home size={18} />
              Go to Dashboard
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-background border border-border-subtle text-foreground rounded-xl hover:bg-surface transition font-medium"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}