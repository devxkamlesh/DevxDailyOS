import Header from '@/components/layout/Header'
import StatsRow from '@/components/dashboard/StatsRow'
import MonthlyGraph from '@/components/dashboard/MonthlyGraph'
import QuickAddSection from '@/components/dashboard/QuickAddSection'
import RecentActivity from '@/components/dashboard/RecentActivity'
import TodaysHabits from '@/components/dashboard/TodaysHabits'
import QuickStats from '@/components/dashboard/QuickStats'

export default function DashboardPage() {
  return (
    <>
      <Header />
      
      <div className="space-y-6">
        {/* Stats Overview */}
        <StatsRow />

        {/* Monthly Progress & Today's Habits Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[600px]">
          <div className="lg:col-span-2 h-full">
            <MonthlyGraph />
          </div>
          <div className="h-full">
            <TodaysHabits />
          </div>
        </div>

        {/* Bottom Row - Quick Capture, Recent Activity & Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickAddSection />
          <RecentActivity />
          <QuickStats />
        </div>
      </div>
    </>
  )
}
