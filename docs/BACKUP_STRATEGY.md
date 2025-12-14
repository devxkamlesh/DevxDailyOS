# Sadhana Backup & Recovery Strategy (M010)

## Overview

This document outlines the backup and disaster recovery strategy for the Sadhana habit tracking application.

---

## 1. Database Backups (Supabase)

### Automatic Backups (Supabase Managed)

Supabase provides automatic daily backups for Pro and Enterprise plans:

| Plan | Backup Frequency | Retention |
|------|------------------|-----------|
| Free | None | N/A |
| Pro | Daily | 7 days |
| Team | Daily | 14 days |
| Enterprise | Hourly | 30 days |

### Manual Backup Procedure

For additional safety, perform manual backups:

#### Using Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Create backup
supabase db dump -p <project-ref> > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Using pg_dump
```bash
# Set connection string
export DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Full backup
pg_dump $DATABASE_URL > backup_full_$(date +%Y%m%d).sql

# Schema only
pg_dump $DATABASE_URL --schema-only > backup_schema_$(date +%Y%m%d).sql

# Data only
pg_dump $DATABASE_URL --data-only > backup_data_$(date +%Y%m%d).sql
```

### Backup Schedule

| Type | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| Full Database | Daily (2 AM UTC) | 30 days | Cloud Storage |
| Transaction Logs | Continuous | 7 days | Supabase |
| Schema | Weekly | 90 days | Git Repository |
| Critical Tables | Hourly | 24 hours | Cloud Storage |

### Critical Tables (Priority Backup)

1. `profiles` - User accounts
2. `user_rewards` - Coins, XP, levels
3. `habits` - User habits
4. `habit_logs` - Completion history
5. `payment_transactions` - Payment records
6. `coin_transactions` - Economy audit trail

---

## 2. Application Backups

### Code Repository
- **Primary**: GitHub (private repository)
- **Mirror**: GitLab (automated sync)
- **Local**: Developer machines

### Environment Variables
```bash
# Export all env vars (sanitized)
env | grep -E "^(NEXT_|SUPABASE_|RAZORPAY_)" > .env.backup

# Store securely in:
# 1. Password manager (1Password/Bitwarden)
# 2. Encrypted cloud storage
# 3. Hardware security module (production)
```

### Static Assets
- Stored in `/public` directory
- Backed up with code repository
- CDN caching provides redundancy

---

## 3. Recovery Procedures

### Database Recovery

#### Point-in-Time Recovery (PITR)
```bash
# Supabase Dashboard:
# 1. Go to Database > Backups
# 2. Select "Point in Time Recovery"
# 3. Choose timestamp
# 4. Confirm restoration
```

#### Manual Restoration
```bash
# Restore from SQL dump
psql $DATABASE_URL < backup_full_20251215.sql

# Restore specific tables
psql $DATABASE_URL -c "TRUNCATE TABLE user_rewards CASCADE;"
pg_restore -d $DATABASE_URL -t user_rewards backup.dump
```

### Application Recovery

#### Rollback Deployment
```bash
# Vercel rollback
vercel rollback [deployment-url]

# Or redeploy previous commit
git checkout [previous-commit]
vercel --prod
```

#### Environment Recovery
```bash
# Restore environment variables
vercel env pull .env.local
# Or restore from backup
cp .env.backup .env.local
```

---

## 4. Disaster Recovery Plan

### Severity Levels

| Level | Description | Response Time | Recovery Time |
|-------|-------------|---------------|---------------|
| P1 | Complete outage | 15 minutes | 1 hour |
| P2 | Major feature down | 30 minutes | 4 hours |
| P3 | Minor feature issue | 2 hours | 24 hours |
| P4 | Non-critical bug | 24 hours | 1 week |

### P1 Response Checklist

1. **Identify** - Determine scope of outage
2. **Communicate** - Update status page
3. **Isolate** - Prevent further damage
4. **Recover** - Restore from backup
5. **Verify** - Test all functionality
6. **Document** - Post-mortem report

### Recovery Time Objectives (RTO)

| Component | RTO | RPO |
|-----------|-----|-----|
| Database | 1 hour | 1 hour |
| Application | 30 minutes | 0 (stateless) |
| Authentication | 1 hour | 1 hour |
| Payments | 2 hours | 0 (Razorpay handles) |

*RPO = Recovery Point Objective (max data loss)*

---

## 5. Backup Verification

### Weekly Verification Tasks

```bash
# 1. Verify backup file integrity
sha256sum backup_*.sql > checksums.txt

# 2. Test restoration to staging
pg_restore -d staging_db backup_latest.dump

# 3. Run data integrity checks
psql staging_db -f verify_data_integrity.sql

# 4. Document results
echo "Backup verified: $(date)" >> backup_log.txt
```

### Data Integrity Checks

```sql
-- verify_data_integrity.sql

-- Check user_rewards consistency
SELECT COUNT(*) as orphaned_rewards
FROM user_rewards ur
LEFT JOIN profiles p ON ur.user_id = p.id
WHERE p.id IS NULL;

-- Check habit_logs consistency
SELECT COUNT(*) as orphaned_logs
FROM habit_logs hl
LEFT JOIN habits h ON hl.habit_id = h.id
WHERE h.id IS NULL;

-- Check coin transaction balance
SELECT 
  ur.user_id,
  ur.coins as current_balance,
  COALESCE(SUM(ct.amount), 0) as calculated_balance
FROM user_rewards ur
LEFT JOIN coin_transactions ct ON ur.user_id = ct.user_id
GROUP BY ur.user_id, ur.coins
HAVING ur.coins != COALESCE(SUM(ct.amount), 0);
```

---

## 6. Automation Scripts

### Daily Backup Script

```bash
#!/bin/bash
# backup_daily.sh

set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/sadhana"
RETENTION_DAYS=30

# Create backup
pg_dump $DATABASE_URL > "$BACKUP_DIR/backup_$DATE.sql"

# Compress
gzip "$BACKUP_DIR/backup_$DATE.sql"

# Upload to cloud storage
aws s3 cp "$BACKUP_DIR/backup_$DATE.sql.gz" s3://sadhana-backups/daily/

# Clean old backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log
echo "[$DATE] Backup completed successfully" >> /var/log/sadhana_backup.log
```

### Cron Schedule

```cron
# Daily full backup at 2 AM UTC
0 2 * * * /scripts/backup_daily.sh

# Hourly critical tables backup
0 * * * * /scripts/backup_critical.sh

# Weekly verification
0 4 * * 0 /scripts/verify_backups.sh
```

---

## 7. Contact Information

### Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| Primary On-Call | [email] | 24/7 |
| Database Admin | [email] | Business hours |
| Supabase Support | support@supabase.io | 24/7 (Pro+) |
| Vercel Support | support@vercel.com | 24/7 (Pro+) |

### Escalation Path

1. On-Call Engineer (15 min)
2. Team Lead (30 min)
3. CTO (1 hour)
4. External Support (as needed)

---

## 8. Testing Schedule

| Test Type | Frequency | Last Tested | Next Test |
|-----------|-----------|-------------|-----------|
| Backup Restoration | Monthly | - | - |
| Failover Drill | Quarterly | - | - |
| Full DR Test | Annually | - | - |

---

## Changelog

- **2025-12-15**: Initial backup strategy document created
