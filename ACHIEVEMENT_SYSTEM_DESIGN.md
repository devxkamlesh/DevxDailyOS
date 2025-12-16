# Achievement System Design v2.0

## Overview

This document outlines the redesigned achievement system for DevX Daily OS, featuring tiered progression, risk-based mechanics, and psychological engagement hooks.

---

## 1. Core Design Philosophy

- **Early tiers** = Fast dopamine (quick wins)
- **Mid tiers** = Consistency test (habit formation)
- **Late tiers** = Identity-level commitment (lifestyle integration)

### XP Formula

```
XP = BaseXP × DifficultyMultiplier × ConsistencyBonus × RarityFactor
```

| Factor | Range |
|--------|-------|
| DifficultyMultiplier | 1.0 → 2.5 |
| ConsistencyBonus | up to +25% |
| RarityFactor | Common 1.0 → Mythic 3.0 |

---

## 2. Achievement Categories

### A. Habit Completion (Depth-Based)

Progress from Habit Initiate → Habit Deity

| Tier Name | Requirement | XP | Coins | Rarity |
|-----------|-------------|-----|-------|--------|
| Initiate | 1 habit | +25 | 10 | Common |
| Beginner | 10 habits | +50 | 20 | Common |
| Builder | 50 habits | +100 | 40 | Uncommon |
| Grinder | 150 habits | +200 | 75 | Rare |
| Disciplined | 300 habits | +350 | 120 | Epic |
| Habit Architect | 600 habits | +500 | 200 | Legendary |
| Habit Deity | 1000 habits | +1000 | 500 | Mythic |

**Advanced Rules:**
- XP per habit decreases after 300 completions (anti-farming)
- Habit variety bonus (+10%) if habits span different categories

### B. Streak System (Risk-Based)

Introduces streak pressure instead of simple accumulation.

| Name | Requirement | XP | Effect |
|------|-------------|-----|--------|
| Spark | 3 days | +25 | Unlock streak multiplier |
| Flame | 7 days | +50 | +5% XP boost |
| Inferno | 21 days | +100 | +10% XP |
| Iron Will | 45 days | +200 | Miss 1 day protection |
| Unbreakable | 90 days | +400 | Permanent streak badge |
| Immortal | 180 days | +750 | XP ×1.25 |
| Eternal | 365 days | +1500 | Profile aura + leaderboard tag |

**Advanced Rules:**
- Missing a day resets streak but preserves highest streak record
- "Streak Shield" consumable unlockable after 45 days

### C. Perfect Days (Precision-Based)

Perfect days are harder than streaks → higher value.

| Tier | Requirement | XP | Coins |
|------|-------------|-----|-------|
| Clean Start | 3 perfect days | +50 | 20 |
| Focused | 10 perfect days | +100 | 40 |
| Surgical | 25 perfect days | +250 | 100 |
| Obsessive | 50 perfect days | +500 | 200 |
| Ascetic | 100 perfect days | +1000 | 500 |

**Advanced Rules:**
- Perfect Day = 100% habits completed + no skipped + no cheats
- Back-to-back perfect days grant combo bonus XP

### D. Consistency Challenges (Hidden Difficulty)

Unlock only after user maturity (e.g., 14+ days active).

| Name | Condition | XP |
|------|-----------|-----|
| No Miss Week | 7 days, no habit skipped | +150 |
| Zero Excuse Month | 30 days, zero skips | +400 |
| Comeback King | Restart streak within 24h after break | +100 |
| Night Owl | Complete habits after 10 PM for 7 days | +200 |
| Early Bird | Complete habits before 8 AM for 7 days | +200 |

### E. Meta Achievements (System Mastery)

Reward how the user uses the system.

| Name | Condition | XP |
|------|-----------|-----|
| Organizer | 10 habits across 5 categories | +100 |
| Optimizer | Edit habits based on analytics | +150 |
| Minimalist | 3 habits, 60 days, no misses | +300 |
| Data-Driven | Views insights 30 days in a row | +200 |
| Habit Engineer | Uses focus + journal + streak features | +500 |

### F. Seasonal & Time-Limited (Retention Engine)

| Name | Condition | XP | Period |
|------|-----------|-----|--------|
| January Reset | 14-day streak in January | +300 | Jan 1-31 |
| Monsoon Discipline | 30 perfect days | +500 | Jul-Aug |
| New Year Beast Mode | 60-day streak starting Jan 1 | +1000 | Jan-Mar |
| Summer Grind | 100 completions in June | +400 | June |

**Properties:**
- Limited time availability
- High XP rewards
- Badge-exclusive (unique visuals)

---

## 3. Rarity System

| Rarity | Color | XP Multiplier | Drop Rate |
|--------|-------|---------------|-----------|
| Common | Gray | 1.0× | 60% |
| Uncommon | Green | 1.25× | 25% |
| Rare | Blue | 1.5× | 10% |
| Epic | Purple | 2.0× | 4% |
| Legendary | Orange | 2.5× | 0.9% |
| Mythic | Red/Gold | 3.0× | 0.1% |

---

## 4. Anti-Farming & Integrity Rules

1. **XP Decay**: Same habit repeated excessively = diminishing XP returns
2. **Skip Penalty**: Manual skips reduce perfect-day eligibility
3. **Cheat Detection**: Soft-locks achievements (not bans) for suspicious activity
4. **Time Gates**: Some achievements require minimum account age
5. **Variety Bonus**: Completing different habit categories grants bonus XP

---

## 5. Database Schema Integration

### Badges Table Structure

```sql
-- Current badges table supports this system
CREATE TABLE badges (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text,
  rarity text DEFAULT 'common', -- common, uncommon, rare, epic, legendary, mythic
  category text, -- completion, streak, perfect_days, consistency, meta, seasonal
  requirement_type text, -- completions, streak, perfect_days, custom
  requirement_value integer,
  xp_reward integer DEFAULT 0,
  coin_reward integer DEFAULT 0,
  is_seasonal boolean DEFAULT false,
  season_start date,
  season_end date,
  is_hidden boolean DEFAULT false, -- for hidden achievements
  created_at timestamptz DEFAULT now()
);
```

### User Badge Progress

```sql
-- Track progress toward achievements
CREATE TABLE user_badge_progress (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  badge_id uuid REFERENCES badges(id),
  current_progress integer DEFAULT 0,
  target_value integer,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  claimed boolean DEFAULT false
);
```

---

## 6. Psychological Hooks

| Hook | Mechanism | Effect |
|------|-----------|--------|
| Fast early wins | Low-tier achievements | Motivation boost |
| Mid-game friction | Increasing requirements | Identity shift |
| Late-game prestige | Rare badges | Ego retention |
| Hidden achievements | Discovery system | Curiosity loop |
| Risk-based streaks | Loss aversion | Emotional investment |
| Seasonal exclusives | FOMO | Return engagement |

---

## 7. Implementation Priority

### Phase 1 (MVP)
- [ ] Habit completion tiers (Initiate → Deity)
- [ ] Basic streak milestones (Spark → Inferno)
- [ ] Perfect day tracking
- [ ] Rarity colors in UI

### Phase 2 (Enhancement)
- [ ] Streak shields (consumable)
- [ ] Hidden achievements
- [ ] Meta achievements
- [ ] XP decay system

### Phase 3 (Engagement)
- [ ] Seasonal achievements
- [ ] Leaderboard integration
- [ ] Achievement unlock animations
- [ ] Profile auras/badges

---

## 8. Admin Configuration

Admins can tune via the badges admin panel:
- XP/Coin rewards per badge
- Requirement thresholds
- Rarity assignments
- Seasonal date ranges
- Enable/disable specific achievements

---

## 9. Related Files

- `/src/app/admin/badges/page.tsx` - Badge management
- `/src/app/(protected)/challenges/page.tsx` - User challenges view
- `/src/lib/xp.ts` - XP calculation logic
- `/supabase/migrations/database.sql` - Database schema
__|____________________|____
  |                    |
  |                    |
  |                    |
  |                    |
  |                    |
  |                    |
  |                    |
__|____________________|____
  |                    |
  |                    |
  |                    |
  |                    |
  |                    |
  |                    |
  |                    |
__|____________________|____
  |                    |
  |                    |
  |                    |
  |                    |
  |                    |
  |                    |
  |                    |
__|____________________|____
  |                    |
  |                    |
  |                    |
  |                    |
  |                    |
  |                    |
  |                    |
__|____________________|____

