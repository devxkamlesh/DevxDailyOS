import Header from '@/components/layout/Header'
import StatsRow from '@/components/dashboard/StatsRow'
import MonthlyGraph from '@/components/dashboard/MonthlyGraph'
import QuickAddSection from '@/components/dashboard/QuickAddSection'
import RecentActivity from '@/components/dashboard/RecentActivity'
import TodaysHabits from '@/components/dashboard/TodaysHabits'

export default function DashboardPage() {
  return (
    <>
      <Header />
      
      <div className="space-y-6">
        {/* Stats Overview */}
        <StatsRow />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Habits & Graph */}
          <div className="lg:col-span-2 space-y-6">
            <TodaysHabits />
            <MonthlyGraph />
          </div>

          {/* Right Column - Quick Actions & Activity */}
          <div className="space-y-6">
            <QuickAddSection />
            <RecentActivity />
          </div>
        </div>
      </div>
    </>
  )
}
