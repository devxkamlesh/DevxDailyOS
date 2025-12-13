'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect to shop page - rewards functionality moved there
export default function RewardsPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/shop')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="text-4xl mb-4">🔄</div>
        <p className="text-foreground-muted">Redirecting to Shop...</p>
      </div>
    </div>
  )
}
