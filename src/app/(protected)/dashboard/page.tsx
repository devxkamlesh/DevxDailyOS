'use client'

import { useCallback } from 'react'
import Header from '@/components/layout/Header'
import StatsRow from '@/components/dashboard/StatsRow'
import MonthlyGraph from '@/components/dashboard/MonthlyGraph'
import QuickAddSection from '@/components/dashboard/QuickAddSection'
import RecentActivity from '@/components/dashboard/RecentActivity'
import TodaysHabits from '@/components/dashboard/TodaysHabits'
import QuickActions from '@/components/dashboard/QuickActions'
import AnnouncementBanner from '@/components/ui/AnnouncementBanner'
import DateManipulationBlocker from '@/components/ui/DateManipulationBlocker'
import { useMidnightReset } from '@/hooks/useMidnightReset'

export default function DashboardPage() {
  // Auto-reset habits at midnight IST (12:00 AM India/Kolkata)
  const handleMidnightReset = useCallback(() => {
    console.log('[Dashboard] Midnight reset triggered - refreshing all data')
    // The habitUpdated event is already dispatched by the hook
    // Components listening to this event will auto-refresh
  }, [])
  
  useMidnightReset(handleMidnightReset)

  return (
    <DateManipulationBlocker>
      <AnnouncementBanner />
      <Header />
      
      <div className="space-y-8">
        {/* Stats Overview */}
        <StatsRow />

        {/* Monthly Progress & Today's Habits/Events Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[600px]">
          <div className="lg:col-span-2 h-full">
            <MonthlyGraph />
          </div>
          <div className="h-full">
            <TodaysHabits />
          </div>
        </div>

        {/* Bottom Row - Quick Capture, Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <QuickAddSection />
          <RecentActivity />
          <QuickActions />
        </div>
      </div>
    </DateManipulationBlocker>
  )
}
