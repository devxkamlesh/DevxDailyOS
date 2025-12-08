import Header from '@/components/layout/Header'
import StatsRow from '@/components/dashboard/StatsRow'
import HabitsSection from '@/components/dashboard/HabitsSection'
import MonthlyGraph from '@/components/dashboard/MonthlyGraph'
import QuickAddSection from '@/components/dashboard/QuickAddSection'
import RecentActivity from '@/components/dashboard/RecentActivity'

export default function DashboardPage() {
  return (
    <>
      <Header />
      
      <div className="space-y-6">
        {/* Stats Overview */}
        <StatsRow />

        {/* Monthly Graph - Full Width */}
        <MonthlyGraph />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Habits */}
          <div className="lg:col-span-2 space-y-6">
            <HabitsSection />
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
