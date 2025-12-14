/**
 * Health Check API Endpoint (M008)
 * Provides system health status for monitoring
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: CheckResult;
    auth: CheckResult;
  };
}

interface CheckResult {
  status: 'pass' | 'fail';
  latency?: number;
  message?: string;
}

const startTime = Date.now();

/**
 * GET /api/health
 * Returns system health status
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  const uptime = Date.now() - startTime;
  
  const checks: HealthStatus['checks'] = {
    database: { status: 'fail' },
    auth: { status: 'fail' },
  };
  
  // Check database connection
  try {
    const dbStart = Date.now();
    const supabase = await createClient();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    const dbLatency = Date.now() - dbStart;
    
    if (error) {
      checks.database = {
        status: 'fail',
        latency: dbLatency,
        message: error.message,
      };
    } else {
      checks.database = {
        status: 'pass',
        latency: dbLatency,
      };
    }
  } catch (error) {
    checks.database = {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
  
  // Check auth service
  try {
    const authStart = Date.now();
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();
    const authLatency = Date.now() - authStart;
    
    if (error) {
      checks.auth = {
        status: 'fail',
        latency: authLatency,
        message: error.message,
      };
    } else {
      checks.auth = {
        status: 'pass',
        latency: authLatency,
      };
    }
  } catch (error) {
    checks.auth = {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
  
  // Determine overall status
  const allPassing = Object.values(checks).every(c => c.status === 'pass');
  const anyFailing = Object.values(checks).some(c => c.status === 'fail');
  
  let status: HealthStatus['status'] = 'healthy';
  if (anyFailing && !allPassing) {
    status = 'degraded';
  }
  if (Object.values(checks).every(c => c.status === 'fail')) {
    status = 'unhealthy';
  }
  
  const health: HealthStatus = {
    status,
    timestamp,
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    uptime,
    checks,
  };
  
  const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
  
  return NextResponse.json(health, { status: httpStatus });
}

/**
 * HEAD /api/health
 * Quick health check (no body)
 */
export async function HEAD() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) {
      return new NextResponse(null, { status: 503 });
    }
    
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
