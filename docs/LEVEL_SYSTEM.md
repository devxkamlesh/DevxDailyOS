# Level & XP System Documentation

## Overview
The DevX Daily OS uses an exponential XP system where each level requires progressively more XP to reach.

## XP Formula
```
XP Required = 100 × 1.5^(level - 1)
```

## XP Requirements by Level

| Level | XP Required | Total XP | Difficulty |
|-------|-------------|----------|------------|
| 1 | 100 | 100 | Easy |
| 5 | 506 | 1,519 | Easy |
| 10 | 3,844 | 11,533 | Medium |
| 15 | 29,193 | 87,579 | Medium |
| 20 | 221,807 | 665,421 | Hard |
| 25 | 1,684,831 | 5,054,493 | Hard |
| **30** | **12,794,746** | **38,384,238** | **Badge Unlock** |
| 40 | 738,113,801 | 2.2B | Legendary |
| 50 | 42,566,511,428 | 127.7B | Mythic |
| 75 | 8.1 × 10^15 | 24.3 × 10^15 | Immortal |
| 100 | 1.5 × 10^21 | 4.6 × 10^21 | Transcendent |

## How to Earn XP

| Action | XP Earned |
|--------|-----------|
| Complete a habit | +10 XP |
| Perfect day (all habits) | +50 XP bonus |
| Achievements | +25 to +5,000 XP |
| Streak badges | +150 to +5,000 XP |
| Level badges | +200 to +2,000 coins |

## Level Badges (Hard Mode)
Badges only unlock starting from Level 30. This ensures badges are meaningful achievements.

| Badge | Level | Coin Reward |
|-------|-------|-------------|
| Grandmaster | 30 | 200 |
| Legend | 40 | 300 |
| Mythic | 50 | 500 |
| Divine | 60 | 650 |
| Immortal | 75 | 750 |
| Transcendent | 100 | 1,000 |
| Celestial | 150 | 1,500 |
| Eternal | 200 | 2,000 |

## Streak Badges (Hard Mode)
Streak badges only unlock starting from 30 days. No easy badges.

| Badge | Days | Coin Reward | XP Reward |
|-------|------|-------------|-----------|
| Month Master | 30 | 100 | 150 |
| Discipline King | 60 | 150 | 200 |
| Quarter Champion | 90 | 200 | 300 |
| Half Year Hero | 180 | 350 | 500 |
| Year Legend | 365 | 500 | 1,000 |
| Unstoppable | 500 | 750 | 1,500 |
| Two Year Titan | 730 | 1,000 | 2,000 |
| Immortal | 1,000 | 2,000 | 5,000 |

## Achievement Categories

### Completion Achievements
Track total habits completed (1 to 10,000).

### Streak Achievements  
Track consecutive days of activity (3 to 1,000 days).

### Perfect Day Achievements
Track days where all habits were completed (3 to 500 days).

## Design Philosophy
- **No Easy Badges**: Minimum Level 30 and 30-day streak for badges
- **Exponential Growth**: Each level is 1.5× harder than the previous
- **Long-term Goals**: Ultimate badges require years of dedication
- **Meaningful Rewards**: Coins and XP scale with difficulty
