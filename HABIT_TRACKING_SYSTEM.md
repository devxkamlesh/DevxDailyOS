# Habit Tracking System Documentation

## 📊 Overview

The Sadhana habit tracking system provides real-time monitoring of daily habits with automatic progress calculation and streak management. This document explains how the system works, when it updates, and the logic behind daily resets.

---

## ⚠️ Known Issues & Limitations

### **1. Timezone Issue (CRITICAL)**

**Problem**: The system uses `toISOString().split('T')[0]` which converts dates to UTC timezone. This can cause issues for users in different timezones.

**Example**:
- User in IST (UTC+5:30) completes a habit at 11:00 PM on Dec 16
- `toISOString()` converts this to UTC: Dec 16, 5:30 PM UTC
- This is correct, but at 12:30 AM IST on Dec 17, the UTC date is still Dec 16
- User might see habits from "yesterday" until 5:30 AM IST

**Affected Files**:
- `src/components/dashboard/StatsRow.tsx`
- `src/components/dashboard/TodaysHabits.tsx`
- `src/components/dashboard/MonthlyGraph.tsx`
- `src/lib/coins-fixed.ts`
- `src/lib/xp.ts`

**Recommended Fix**:
```typescript
// Instead of:
const today = new Date().toISOString().split('T')[0]

// Use local date:
const now = new Date()
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
```

### **2. Automatic Daily Reset at Midnight IST** ✅ FIXED

**Solution**: The system now automatically resets at 12:00 AM India/Kolkata timezone (IST).

**Implementation**:
- Created `useMidnightReset` hook that schedules reset at midnight IST
- All date operations use `Asia/Kolkata` timezone
- Components auto-refresh when midnight reset triggers
- Also checks on tab visibility change and window focus

**Files**:
- `src/lib/date-utils.ts` - Uses IST timezone for all dates
- `src/hooks/useMidnightReset.ts` - Midnight reset hook
- Dashboard components listen for `midnightReset` event

### **3. Streak Calculation Edge Cases**

**Problem**: Streak calculation uses `toISOString()` which converts to UTC, causing timezone issues.

**Current Code** (in `StatsRow.tsx`):
```typescript
const checkDateStr = checkDate.toISOString().split('T')[0]
```

**Issue**: 
- User in IST at 11:00 PM Dec 16 → UTC is 5:30 PM Dec 16 ✓
- User in IST at 1:00 AM Dec 17 → UTC is 7:30 PM Dec 16 ✗ (wrong day!)

**Fix Required**: Use local date formatting instead of UTC.

### **4. Deep Work Shows 0 Minutes**

**Problem**: Deep Work only counts habits with `target_unit === 'minutes'`.

**Current Logic**:
```typescript
if (habit?.type === 'numeric' && habit?.target_unit === 'minutes' && log.value) {
  deepWorkMinutes += log.value
}
```

**Why It Shows 0**:
- No habits have `target_unit` set to `'minutes'`
- Or habits with minutes haven't been completed today
- Or the `value` field is null/0

**Check**: Verify your habits have the correct `target_unit` in the database.

### **5. Habits Count Mismatch**

**Problem**: "Habits Done 4/6" might not match what user sees in the list.

**Possible Causes**:
- Some habits are marked `is_active: false`
- Numeric habits need to reach `target_value` to count as "done"
- Boolean habits need `completed: true` in logs

---

## 🔄 How the System Works

### **Daily Progress Calculation**

The dashboard shows three key metrics:
- **Habits Done**: `4/6` - Number of completed habits out of total active habits
- **Deep Work**: `0 min` - Total minutes spent on time-based habits
- **Streak**: `1 days` - Current consecutive days with at least one completed habit

### **Data Sources**

```typescript
// Main data fetching happens in StatsRow component
const fetchStats = async () => {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  
  // Get all active habits for the user
  const habits = await supabase
    .from('habits')
    .select('id, type, target_value, target_unit')
    .eq('user_id', user.id)
    .eq('is_active', true)
  
  // Get today's habit logs
  const logs = await supabase
    .from('habit_logs')
    .select('habit_id, completed, value')
    .eq('user_id', user.id)
    .eq('date', today)
}
```

## ⏰ Auto-Update Mechanisms

### **Real-Time Updates**

The system updates **immediately** when:
1. ✅ User marks a habit as complete/incomplete
2. 🔢 User updates numeric habit values
3. ⏱️ User completes a focus session
4. 🔄 User manually refreshes the page

### **Event-Driven Updates**

```typescript
// Custom event system for real-time updates
window.dispatchEvent(new CustomEvent('habitUpdated'))

// Components listen for this event
window.addEventListener('habitUpdated', handleHabitUpdate)
```

### **No Automatic Midnight Reset**

❌ **The system does NOT automatically reset at 12:00 AM**

The daily reset happens when:
- User refreshes the page after midnight
- User navigates between pages after midnight
- User performs any habit action after midnight

## 📅 Daily Reset Logic

### **Date-Based Separation**

Each day's data is stored separately using the date as a key:

```sql
-- Habit logs table structure
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  habit_id UUID REFERENCES habits(id),
  date DATE NOT NULL,           -- This determines the "day"
  completed BOOLEAN DEFAULT false,
  value INTEGER DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **When New Day Starts**

When the system detects a new date:

1. **Fresh Slate**: All habits show as incomplete for the new day
2. **Previous Data Preserved**: Yesterday's progress remains in the database
3. **Streak Calculation**: System checks if yesterday had any completed habits
4. **New Logs Created**: When user marks habits, new entries are created for today

### **Example Timeline**

```
December 15, 2024 (Yesterday):
- Morning Workout: ✅ Completed
- Read 30 min: ✅ Completed  
- Meditate: ❌ Not completed
- Status: 2/3 habits done

December 16, 2024 (Today):
- Morning Workout: ❌ Not started (fresh state)
- Read 30 min: ❌ Not started (fresh state)
- Meditate: ❌ Not started (fresh state)
- Status: 0/3 habits done (until user starts completing)
```

## 🔥 Streak Calculation

### **Streak Logic**

```typescript
const calculateStreak = (recentLogs) => {
  // Get unique dates with completed habits
  const uniqueDates = [...new Set(recentLogs.map(l => l.date))].sort().reverse()
  const todayDate = new Date()
  
  let streak = 0
  for (let i = 0; i < uniqueDates.length; i++) {
    const checkDate = new Date(todayDate)
    checkDate.setDate(checkDate.getDate() - i)
    const checkDateStr = checkDate.toISOString().split('T')[0]
    
    if (uniqueDates.includes(checkDateStr)) {
      streak++
    } else {
      break // Streak broken
    }
  }
  return streak
}
```

### **Streak Rules**

- ✅ **Streak continues**: If you complete at least 1 habit today
- ❌ **Streak breaks**: If you complete 0 habits for a full day
- 🔄 **Streak resets**: Starts from 1 when you complete habits after a break
- ⏰ **Grace period**: You have until 11:59 PM to maintain your streak

## 📊 Deep Work Calculation

### **Time-Based Habits**

Only habits with `target_unit = 'minutes'` contribute to deep work:

```typescript
// Deep work calculation
let deepWorkMinutes = 0
logs.forEach(log => {
  const habit = habits.find(h => h.id === log.habit_id)
  if (habit?.type === 'numeric' && habit?.target_unit === 'minutes' && log.value) {
    deepWorkMinutes += log.value // Add logged minutes
  }
})
```

### **Focus Session Integration**

When users complete focus sessions:
1. 🎯 Focus session minutes are automatically logged
2. 📊 Deep work total updates immediately
3. ✅ Habit marked as complete if target is reached

## 🔄 Update Triggers

### **Automatic Updates**

The dashboard updates when:

```typescript
// 1. Component mounts
useEffect(() => {
  fetchStats()
}, [])

// 2. Habit completion events
window.addEventListener('habitUpdated', fetchStats)

// 3. Page focus (when user returns to tab)
window.addEventListener('focus', fetchStats)

// 4. Fallback timeout (every 5 seconds if needed)
const timeout = setTimeout(() => {
  setLoading(false)
}, 5000)
```

### **Manual Updates**

Users can force updates by:
- 🔄 Refreshing the page
- 🎯 Completing any habit action
- 📱 Switching between app pages
- ⚡ Using the refresh button (where available)

## 🛠️ Technical Implementation

### **Database Queries**

```sql
-- Get today's progress
SELECT h.id, h.name, h.type, h.target_value, h.target_unit,
       hl.completed, hl.value
FROM habits h
LEFT JOIN habit_logs hl ON h.id = hl.habit_id 
  AND hl.date = CURRENT_DATE 
  AND hl.user_id = $1
WHERE h.user_id = $1 AND h.is_active = true;

-- Get streak data (last 30 days)
SELECT date, completed 
FROM habit_logs 
WHERE user_id = $1 
  AND completed = true 
  AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
```

### **State Management**

```typescript
// Real-time state updates
const [stats, setStats] = useState({
  habitsCompleted: 0,
  habitsTotal: 0,
  deepWorkMinutes: 0,
  streak: 0
})

// Optimistic updates for better UX
const toggleHabit = async (habit) => {
  // 1. Update UI immediately
  setHabits(prev => prev.map(h => 
    h.id === habit.id ? { ...h, completedToday: !h.completedToday } : h
  ))
  
  // 2. Save to database
  await supabase.from('habit_logs').upsert(...)
  
  // 3. Broadcast update event
  window.dispatchEvent(new CustomEvent('habitUpdated'))
}
```

## 🎯 Best Practices

### **For Users**

1. **Daily Check-in**: Visit the dashboard daily to see progress
2. **Complete Early**: Mark habits as done throughout the day
3. **Use Focus Mode**: For time-based habits, use the built-in timer
4. **Check Streaks**: Monitor your consistency in the analytics page

### **For Developers**

1. **Always use date strings**: `YYYY-MM-DD` format for consistency
2. **Handle timezones**: Use local date components, not UTC
3. **Emit events**: Always dispatch `habitUpdated` after changes
4. **Optimistic updates**: Update UI first, then sync with database

## 🔍 Troubleshooting

### **Common Issues**

**Q: My habits don't reset at midnight**
- A: The system resets when you next visit after midnight, not automatically

**Q: My streak seems wrong**
- A: Streaks are calculated based on days with at least 1 completed habit

**Q: Deep work time is 0 despite completing habits**
- A: Only habits with "minutes" as target unit count toward deep work

**Q: Stats don't update immediately**
- A: Try refreshing the page or completing another habit action

### **Debug Information**

Check browser console for:
```javascript
// Current date being used
console.log('Today:', new Date().toISOString().split('T')[0])

// Habit update events
window.addEventListener('habitUpdated', () => console.log('Habit updated!'))

// Database queries in Network tab
// Look for calls to /rest/v1/habits and /rest/v1/habit_logs
```

## 📈 Future Enhancements

### **Planned Features**

1. **Automatic Midnight Reset**: Background service to reset at 12:00 AM
2. **Timezone Support**: Better handling of different timezones
3. **Streak Notifications**: Alerts when streak is at risk
4. **Weekly/Monthly Views**: Extended progress tracking
5. **Habit Scheduling**: Set specific times for habit reminders

### **Performance Optimizations**

1. **Caching**: Store recent data in localStorage
2. **Batch Updates**: Group multiple habit changes
3. **Real-time Subscriptions**: WebSocket updates for multi-device sync
4. **Offline Support**: Continue tracking without internet

---

## 📞 Support

For technical issues or questions about the habit tracking system:
- Check the browser console for error messages
- Verify your internet connection
- Try refreshing the page
- Contact support if issues persist

**Last Updated**: December 16, 2024
**Version**: 1.0.0


---

## 🔧 Recommended Fixes

### **Fix 1: Timezone-Safe Date Helper**

Create a utility function for consistent local date handling:

```typescript
// src/lib/date-utils.ts

/**
 * Get today's date in YYYY-MM-DD format using LOCAL timezone
 * This avoids UTC conversion issues
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get date X days ago in local timezone
 */
export function getLocalDateDaysAgo(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return getLocalDateString(date)
}

/**
 * Check if two dates are the same day (local timezone)
 */
export function isSameLocalDay(date1: Date, date2: Date): boolean {
  return getLocalDateString(date1) === getLocalDateString(date2)
}
```

### **Fix 2: Update StatsRow.tsx**

Replace UTC date handling with local dates:

```typescript
// Before (problematic):
const today = new Date().toISOString().split('T')[0]
const checkDateStr = checkDate.toISOString().split('T')[0]

// After (fixed):
import { getLocalDateString } from '@/lib/date-utils'

const today = getLocalDateString()
const checkDateStr = getLocalDateString(checkDate)
```

### **Fix 3: Update TodaysHabits.tsx**

Same fix for habit completion:

```typescript
// Before:
const today = new Date().toISOString().split('T')[0]

// After:
import { getLocalDateString } from '@/lib/date-utils'
const today = getLocalDateString()
```

### **Fix 4: Update All Affected Files**

Files that need the timezone fix:
1. `src/components/dashboard/StatsRow.tsx`
2. `src/components/dashboard/TodaysHabits.tsx`
3. `src/components/dashboard/MonthlyGraph.tsx`
4. `src/components/dashboard/QuickStats.tsx`
5. `src/components/dashboard/HabitsSection.tsx`
6. `src/components/dashboard/MiniCalendar.tsx`
7. `src/components/habits/HabitCard.tsx`
8. `src/components/habits/Gamification.tsx`
9. `src/lib/coins-fixed.ts`
10. `src/lib/xp.ts`

---

## 📋 Issue Checklist

| Issue | Status | Priority | Fix Available |
|-------|--------|----------|---------------|
| Timezone UTC conversion | ✅ Fixed | HIGH | Applied (IST) |
| Auto midnight reset | ✅ Fixed | HIGH | Applied (12 AM IST) |
| Streak calculation timezone | ✅ Fixed | HIGH | Applied |
| Deep Work shows 0 | ⚠️ Data Issue | MEDIUM | Check DB |
| Habits count mismatch | ⚠️ Logic Issue | MEDIUM | Verify |

### **Files Fixed**:
- ✅ `src/lib/date-utils.ts` - IST timezone (Asia/Kolkata) for all dates
- ✅ `src/hooks/useMidnightReset.ts` - Auto-reset at 12:00 AM IST
- ✅ `src/components/dashboard/StatsRow.tsx` - Using IST dates + midnight listener
- ✅ `src/components/dashboard/TodaysHabits.tsx` - Using IST dates + midnight listener
- ✅ `src/components/dashboard/MonthlyGraph.tsx` - Using IST dates
- ✅ `src/components/dashboard/QuickStats.tsx` - Using IST dates
- ✅ `src/components/dashboard/HabitsSection.tsx` - Using IST dates
- ✅ `src/components/dashboard/MiniCalendar.tsx` - Using IST dates
- ✅ `src/lib/coins-fixed.ts` - Using IST dates
- ✅ `src/lib/xp.ts` - Using IST dates
- ✅ `src/app/(protected)/dashboard/page.tsx` - Midnight reset trigger

---

## 🧪 Testing Checklist

### **Manual Tests**

1. **Timezone Test**:
   - [ ] Change system timezone to UTC+12
   - [ ] Complete a habit at 11:00 PM local time
   - [ ] Verify it shows for the correct day
   - [ ] Check streak calculation

2. **Midnight Rollover Test**:
   - [ ] Leave app open past midnight
   - [ ] Refresh page after midnight
   - [ ] Verify habits reset to uncompleted
   - [ ] Verify streak is correct

3. **Deep Work Test**:
   - [ ] Create a habit with `target_unit: 'minutes'`
   - [ ] Complete a focus session
   - [ ] Verify Deep Work minutes update

4. **Streak Test**:
   - [ ] Complete habits for 3 consecutive days
   - [ ] Verify streak shows 3
   - [ ] Skip a day
   - [ ] Verify streak resets to 0 or 1

### **Database Verification**

```sql
-- Check habit configuration
SELECT id, name, type, target_value, target_unit, is_active 
FROM habits 
WHERE user_id = 'YOUR_USER_ID';

-- Check today's logs
SELECT hl.*, h.name, h.type, h.target_value
FROM habit_logs hl
JOIN habits h ON hl.habit_id = h.id
WHERE hl.user_id = 'YOUR_USER_ID'
  AND hl.date = CURRENT_DATE;

-- Check streak data
SELECT date, COUNT(*) as completed_count
FROM habit_logs
WHERE user_id = 'YOUR_USER_ID'
  AND completed = true
  AND date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY date
ORDER BY date DESC;
```

---

## 📞 Quick Debugging

### **Check Current Date Being Used**

Add this to browser console:
```javascript
// What the app thinks "today" is
const appToday = new Date().toISOString().split('T')[0]
console.log('App Today (UTC):', appToday)

// What it should be (local)
const now = new Date()
const localToday = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
console.log('Local Today:', localToday)

// Are they different?
console.log('Timezone Issue:', appToday !== localToday)
```

### **Check Your Timezone Offset**

```javascript
const offset = new Date().getTimezoneOffset()
console.log('Timezone offset (minutes):', offset)
console.log('Timezone offset (hours):', offset / 60)
// Negative = ahead of UTC, Positive = behind UTC
```

---

**Document Version**: 1.1.0
**Last Updated**: December 16, 2024
**Issues Found**: 5
**Critical Issues**: 2 (Timezone related)