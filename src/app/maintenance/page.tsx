'use client'

import { Wrench, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500/10 rounded-full mb-6">
          <Wrench size={40} className="text-yellow-500" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Under Maintenance</h1>
        
        <p className="text-foreground-muted mb-8">
          We're currently performing scheduled maintenance to improve your experience. 
          Please check back soon!
        </p>
        
        <div className="space-y-4">
          <div className="p-4 bg-surface rounded-xl border border-border-subtle">
            <p className="text-sm text-foreground-muted">
              Expected downtime: <span className="text-foreground font-medium">A few minutes</span>
            </p>
          </div>
          
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-accent-primary hover:underline"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
