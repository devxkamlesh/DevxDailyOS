# Load Testing Guide (M002)

## Overview

This document outlines the load testing strategy for Sadhana to ensure the application can handle expected user loads.

---

## 1. Testing Tools

### Recommended Tools

| Tool | Use Case | Installation |
|------|----------|--------------|
| k6 | API load testing | `brew install k6` or `choco install k6` |
| Artillery | HTTP/WebSocket testing | `npm install -g artillery` |
| Lighthouse | Frontend performance | Built into Chrome DevTools |

---

## 2. Test Scenarios

### Scenario 1: Normal Load (1K concurrent users)

```javascript
// k6/normal-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 1000 },  // Stay at 1K
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% under 500ms
    http_req_failed: ['rate<0.01'],    // <1% errors
  },
};

export default function () {
  // Health check
  const healthRes = http.get('https://your-domain.com/api/health');
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });

  // Simulate user flow
  const habitsRes = http.get('https://your-domain.com/api/habits', {
    headers: { Authorization: `Bearer ${__ENV.AUTH_TOKEN}` },
  });
  check(habitsRes, {
    'habits loaded': (r) => r.status === 200,
  });

  sleep(1);
}
```

### Scenario 2: Peak Load (10K concurrent users)

```javascript
// k6/peak-load.js
export const options = {
  stages: [
    { duration: '5m', target: 5000 },
    { duration: '10m', target: 10000 },
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
  },
};
```

### Scenario 3: Stress Test (Find breaking point)

```javascript
// k6/stress-test.js
export const options = {
  stages: [
    { duration: '2m', target: 1000 },
    { duration: '2m', target: 5000 },
    { duration: '2m', target: 10000 },
    { duration: '2m', target: 20000 },
    { duration: '2m', target: 50000 },
    { duration: '5m', target: 0 },
  ],
};
```

### Scenario 4: Spike Test

```javascript
// k6/spike-test.js
export const options = {
  stages: [
    { duration: '10s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '10s', target: 10000 },  // Sudden spike
    { duration: '3m', target: 10000 },
    { duration: '10s', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '10s', target: 0 },
  ],
};
```

---

## 3. Key Endpoints to Test

| Endpoint | Expected Load | Target Response Time |
|----------|---------------|---------------------|
| GET /api/health | 100 req/s | <50ms |
| GET /habits | 500 req/s | <200ms |
| POST /habit-logs | 1000 req/s | <300ms |
| GET /analytics | 100 req/s | <500ms |
| POST /api/shop/purchase | 50 req/s | <500ms |

---

## 4. Database Load Testing

### Connection Pool Test

```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Check connection limits
SHOW max_connections;
```

### Query Performance Test

```sql
-- Enable query timing
\timing on

-- Test habit logs query (should be <100ms)
EXPLAIN ANALYZE
SELECT * FROM habit_logs
WHERE user_id = 'test-user-id'
AND completed_at >= NOW() - INTERVAL '30 days';

-- Test analytics query (should be <500ms)
EXPLAIN ANALYZE
SELECT * FROM get_user_habit_analytics(
  'test-user-id',
  NOW() - INTERVAL '30 days',
  NOW()
);
```

---

## 5. Performance Targets

### Response Time Targets

| Percentile | Target |
|------------|--------|
| p50 | <100ms |
| p90 | <300ms |
| p95 | <500ms |
| p99 | <1000ms |

### Throughput Targets

| User Count | Requests/sec | Error Rate |
|------------|--------------|------------|
| 1,000 | 500 | <0.1% |
| 10,000 | 2,000 | <1% |
| 100,000 | 5,000 | <5% |

---

## 6. Running Tests

### Local Testing

```bash
# Install k6
brew install k6

# Run normal load test
k6 run k6/normal-load.js

# Run with environment variables
k6 run -e AUTH_TOKEN=your-token k6/normal-load.js

# Run with output to file
k6 run --out json=results.json k6/normal-load.js
```

### CI/CD Integration

```yaml
# .github/workflows/load-test.yml
name: Load Test
on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      - name: Run load test
        run: k6 run k6/normal-load.js
        env:
          AUTH_TOKEN: ${{ secrets.LOAD_TEST_TOKEN }}
```

---

## 7. Monitoring During Tests

### Metrics to Watch

1. **Application**
   - Response times (p50, p95, p99)
   - Error rates
   - Request throughput

2. **Database**
   - Connection count
   - Query duration
   - Lock waits

3. **Infrastructure**
   - CPU usage
   - Memory usage
   - Network I/O

### Supabase Dashboard

Monitor via Supabase Dashboard:
- Database > Reports > Query Performance
- Database > Reports > Database Health

---

## 8. Results Template

```markdown
## Load Test Results - [Date]

### Configuration
- Tool: k6
- Duration: 10 minutes
- Peak Users: 1,000

### Results
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| p95 Response Time | 320ms | <500ms | ✅ |
| Error Rate | 0.2% | <1% | ✅ |
| Throughput | 450 req/s | 400 req/s | ✅ |

### Issues Found
- None

### Recommendations
- Consider adding caching for /analytics endpoint
```

---

## 9. Optimization Checklist

After load testing, check:

- [ ] Database indexes are being used
- [ ] No N+1 queries
- [ ] Connection pooling configured
- [ ] CDN caching enabled
- [ ] API responses are compressed
- [ ] Static assets are cached
- [ ] Rate limiting is working
