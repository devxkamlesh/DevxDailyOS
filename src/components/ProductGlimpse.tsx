export function ProductGlimpse() {
  return (
    <div className="relative w-full max-w-4xl mx-auto transform scale-90 origin-center overflow-hidden">
      {/* Browser Frame */}
      <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-2xl">
        {/* Browser Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-surface/50 border-b border-border-subtle">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-red-500/60 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500/60 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500/60 rounded-full"></div>
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-background/50 rounded-md px-3 py-1 text-xs text-foreground-muted">
              sadhana.app/dashboard
            </div>
          </div>
        </div>
        
        {/* Dashboard Content */}
        <div className="aspect-[16/9] lg:aspect-[16/10] bg-background overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between p-4 lg:p-6 border-b border-border-subtle">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-accent-primary/20 rounded-xl flex items-center justify-center">
                  <div className="w-4 h-4 lg:w-5 lg:h-5 bg-accent-primary/50 rounded"></div>
                </div>
                <div>
                  <div className="h-4 lg:h-5 w-20 lg:w-24 bg-foreground-muted/30 rounded mb-1"></div>
                  <div className="h-2.5 lg:h-3 w-16 lg:w-20 bg-foreground-muted/20 rounded"></div>
                </div>
              </div>
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="flex items-center gap-2 px-2 lg:px-3 py-1 lg:py-1.5 bg-accent-success/10 rounded-lg border border-accent-success/20">
                  <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-accent-success rounded-full"></div>
                  <div className="h-2.5 lg:h-3 w-6 lg:w-8 bg-accent-success/40 rounded"></div>
                </div>
                <div className="h-6 lg:h-8 w-16 lg:w-20 bg-accent-primary/20 rounded-lg"></div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col lg:flex-row min-h-0">
              {/* Main Dashboard Area */}
              <div className="flex-1 p-4 lg:p-6 min-w-0">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
                  {[
                    { label: 'Habits', value: '12', color: 'bg-blue-500/20' },
                    { label: 'Streak', value: '7', color: 'bg-green-500/20' },
                    { label: 'Projects', value: '3', color: 'bg-purple-500/20' },
                    { label: 'Focus', value: '2h', color: 'bg-orange-500/20' }
                  ].map((stat, i) => (
                    <div key={i} className={`${stat.color} rounded-xl p-3 lg:p-4 border border-border-subtle`}>
                      <div className="h-2.5 lg:h-3 w-10 lg:w-12 bg-foreground-muted/20 rounded mb-2"></div>
                      <div className="h-4 lg:h-5 w-6 lg:w-8 bg-foreground-muted/40 rounded"></div>
                    </div>
                  ))}
                </div>
                
                {/* Progress Chart */}
                <div className="bg-surface/30 rounded-xl p-4 lg:p-6 border border-border-subtle">
                  <div className="flex items-center justify-between mb-3 lg:mb-4">
                    <div className="h-3 lg:h-4 w-24 lg:w-32 bg-foreground-muted/30 rounded"></div>
                    <div className="h-2.5 lg:h-3 w-12 lg:w-16 bg-foreground-muted/20 rounded"></div>
                  </div>
                  <div className="flex items-end gap-0.5 lg:gap-1 h-16 lg:h-20">
                    {[45, 65, 35, 85, 55, 75, 50, 95, 40, 70, 60, 80].map((height, i) => (
                      <div 
                        key={i} 
                        className="flex-1 bg-gradient-to-t from-accent-primary/40 to-accent-primary/20 rounded-sm" 
                        style={{height: `${height}%`}}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Today's Habits Sidebar */}
              <div className="w-full lg:w-64 xl:w-80 bg-surface/30 border-t lg:border-t-0 lg:border-l border-border-subtle p-4 lg:p-6">
                <div className="flex items-center justify-between mb-3 lg:mb-4">
                  <div className="h-4 lg:h-5 w-16 lg:w-20 bg-foreground-muted/30 rounded"></div>
                  <div className="h-3 lg:h-4 w-10 lg:w-12 bg-foreground-muted/20 rounded"></div>
                </div>
                
                {/* Progress Bar */}
                <div className="h-2 bg-background rounded-full mb-4 lg:mb-6 overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-accent-primary to-accent-success rounded-full"></div>
                </div>
                
                {/* Habit List */}
                <div className="space-y-2 lg:space-y-3">
                  {/* Completed Habit */}
                  <div className="flex items-center gap-2 lg:gap-3 p-2.5 lg:p-3 bg-accent-success/10 rounded-xl border border-accent-success/20">
                    <div className="w-4 h-4 lg:w-5 lg:h-5 bg-accent-success/60 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-accent-success rounded-full"></div>
                    </div>
                    <div className="w-3 h-3 lg:w-4 lg:h-4 bg-accent-success/30 rounded"></div>
                    <div className="h-2.5 lg:h-3 w-16 lg:w-20 bg-foreground-muted/30 rounded"></div>
                  </div>
                  
                  {/* Pending Habits */}
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-2 lg:gap-3 p-2.5 lg:p-3 bg-background/50 rounded-xl border border-border-subtle">
                      <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-foreground-muted/30 rounded-full"></div>
                      <div className="w-3 h-3 lg:w-4 lg:h-4 bg-foreground-muted/20 rounded"></div>
                      <div className="h-2.5 lg:h-3 w-18 lg:w-24 bg-foreground-muted/20 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Caption */}
      <div className="text-center mt-4 lg:mt-6">
        <p className="text-base lg:text-lg font-medium text-foreground mb-2">Everything in one place. Nothing unnecessary.</p>
        <p className="text-sm lg:text-base text-foreground-muted">Clean, focused, and built for daily use.</p>
      </div>
    </div>
  )
}