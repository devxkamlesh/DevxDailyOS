import Header from '@/components/layout/Header'
import StatsRow from '@/components/dashboard/StatsRow'
import MonthlyGraph from '@/components/dashboard/MonthlyGraph'
import QuickAddSection from '@/components/dashboard/QuickAddSection'
import RecentActivity from '@/components/dashboard/RecentActivity'
import TodaysHabits from '@/components/dashboard/TodaysHabits'
import QuickActions from '@/components/dashboard/QuickActions'

export default function DashboardPage() {
  return (
    <>
      <Header />
      
      <div className="space-y-8">
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

        {/* Bottom Row - Quick Capture, Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <QuickAddSection />
          <RecentActivity />
          <QuickActions />
        </div>
      </div>
    </>
  )
}
