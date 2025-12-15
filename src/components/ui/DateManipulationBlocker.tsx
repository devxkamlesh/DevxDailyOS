'use client'

import { ShieldAlert, RefreshCw, AlertTriangle } from 'lucide-react'
import { useDate } from '@/contexts/DateContext'

interface DateManipulationBlockerProps {
  children: React.ReactNode
}

export default function DateManipulationBlocker({ children }: DateManipulationBlockerProps) {
  const { isDateManipulated, verificationStatus, refreshVerification } = useDate()

  // Show blocker when date manipulation is detected
  if (isDateManipulated && verificationStatus === 'verified') {
    return (
      <div className="relative">
        {/* Blurred content behind */}
        <div className="blur-sm pointer-events-none select-none opacity-30">
          {children}
        </div>
        
        {/* Blocking overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
          <div className="max-w-md mx-auto p-8 bg-surface border border-red-500/30 rounded-2xl shadow-2xl text-center animate-in fade-in zoom-in-95 duration-300">
            {/* Warning Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
              <ShieldAlert size={40} className="text-red-500" />
            </div>
            
            {/* Title */}
            <h2 className="text-2xl font-bold text-red-400 mb-3">
              System Date Mismatch
            </h2>
            
            {/* Description */}
            <p className="text-foreground-muted mb-6 leading-relaxed">
              Your system date doesn't match the server time. This could be due to incorrect system settings or an attempt to manipulate the date.
            </p>
            
            {/* Warning box */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3 text-left">
                <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-300">
                  <p className="font-medium mb-1">Editing is disabled</p>
                  <p className="text-red-400/80">
                    To protect data integrity, all editing features are disabled until your system date is corrected.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Instructions */}
            <div className="text-sm text-foreground-muted mb-6 text-left bg-background/50 rounded-xl p-4">
              <p className="font-medium mb-2">To fix this:</p>
              <ol className="list-decimal list-inside space-y-1 text-foreground-muted/80">
                <li>Check your system date and time settings</li>
                <li>Enable automatic date/time if available</li>
                <li>Click "Re-verify" below to check again</li>
              </ol>
            </div>
            
            {/* Action button */}
            <button
              onClick={refreshVerification}
              className="w-full py-3 px-6 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
            >
              <RefreshCw size={18} />
              Re-verify Date
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Normal render when no manipulation detected
  return <>{children}</>
}
