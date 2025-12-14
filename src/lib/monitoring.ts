/**
 * Monitoring and Error Tracking (L007)
 * Client-side performance monitoring and error tracking
 */

import { logger } from './logger';

// ============================================================================
// TYPES
// ============================================================================

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  tags?: Record<string, string>;
}

export interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  timestamp: number;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  /**
   * Initialize performance monitoring
   */
  init(): void {
    if (typeof window === 'undefined') return;

    // Monitor Largest Contentful Paint
    this.observeLCP();
    
    // Monitor First Input Delay
    this.observeFID();
    
    // Monitor Cumulative Layout Shift
    this.observeCLS();
    
    // Monitor long tasks
    this.observeLongTasks();
    
    // Monitor resource loading
    this.observeResources();
  }

  /**
   * Observe Largest Contentful Paint
   */
  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.recordMetric({
          name: 'LCP',
          value: lastEntry.startTime,
          unit: 'ms',
          timestamp: Date.now(),
        });
      });
      
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(observer);
    } catch {
      // LCP not supported
    }
  }

  /**
   * Observe First Input Delay
   */
  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          const fidEntry = entry as PerformanceEventTiming;
          this.recordMetric({
            name: 'FID',
            value: fidEntry.processingStart - fidEntry.startTime,
            unit: 'ms',
            timestamp: Date.now(),
          });
        }
      });
      
      observer.observe({ type: 'first-input', buffered: true });
      this.observers.push(observer);
    } catch {
      // FID not supported
    }
  }

  /**
   * Observe Cumulative Layout Shift
   */
  private observeCLS(): void {
    try {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value;
          }
        }
        
        this.recordMetric({
          name: 'CLS',
          value: clsValue,
          unit: 'count',
          timestamp: Date.now(),
        });
      });
      
      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(observer);
    } catch {
      // CLS not supported
    }
  }

  /**
   * Observe long tasks (>50ms)
   */
  private observeLongTasks(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            this.recordMetric({
              name: 'LongTask',
              value: entry.duration,
              unit: 'ms',
              timestamp: Date.now(),
              tags: { name: entry.name },
            });
          }
        }
      });
      
      observer.observe({ type: 'longtask', buffered: true });
      this.observers.push(observer);
    } catch {
      // Long tasks not supported
    }
  }

  /**
   * Observe resource loading times
   */
  private observeResources(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          
          // Only track slow resources (>1s)
          if (resource.duration > 1000) {
            this.recordMetric({
              name: 'SlowResource',
              value: resource.duration,
              unit: 'ms',
              timestamp: Date.now(),
              tags: {
                url: resource.name,
                type: resource.initiatorType,
              },
            });
          }
        }
      });
      
      observer.observe({ type: 'resource', buffered: true });
      this.observers.push(observer);
    } catch {
      // Resource timing not supported
    }
  }

  /**
   * Record a custom metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Log significant metrics
    if (metric.name === 'LCP' && metric.value > 2500) {
      logger.warn(`Slow LCP: ${metric.value}ms`, { metric: metric.name });
    }
    if (metric.name === 'FID' && metric.value > 100) {
      logger.warn(`High FID: ${metric.value}ms`, { metric: metric.name });
    }
    if (metric.name === 'CLS' && metric.value > 0.1) {
      logger.warn(`High CLS: ${metric.value}`, { metric: metric.name });
    }
  }

  /**
   * Measure a function execution time
   */
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
    });
    
    return result;
  }

  /**
   * Measure an async function execution time
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
    });
    
    return result;
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get Web Vitals summary
   */
  getWebVitals(): Record<string, number | null> {
    const findLatest = (name: string) => {
      const metrics = this.metrics.filter(m => m.name === name);
      return metrics.length > 0 ? metrics[metrics.length - 1].value : null;
    };

    return {
      LCP: findLatest('LCP'),
      FID: findLatest('FID'),
      CLS: findLatest('CLS'),
    };
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Cleanup observers
   */
  destroy(): void {
    for (const observer of this.observers) {
      observer.disconnect();
    }
    this.observers = [];
  }
}

// ============================================================================
// ERROR TRACKING
// ============================================================================

class ErrorTracker {
  private errors: ErrorReport[] = [];
  private userId: string | null = null;

  /**
   * Initialize error tracking
   */
  init(): void {
    if (typeof window === 'undefined') return;

    // Global error handler
    window.onerror = (message, source, lineno, colno, error) => {
      this.captureError(error || new Error(String(message)), {
        source,
        lineno,
        colno,
      });
    };

    // Unhandled promise rejection handler
    window.onunhandledrejection = (event) => {
      this.captureError(
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason)),
        { type: 'unhandledrejection' }
      );
    };
  }

  /**
   * Set user ID for error reports
   */
  setUser(userId: string | null): void {
    this.userId = userId;
  }

  /**
   * Capture an error
   */
  captureError(error: Error, metadata?: Record<string, unknown>): void {
    const report: ErrorReport = {
      message: error.message,
      stack: error.stack,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: Date.now(),
      userId: this.userId || undefined,
      metadata,
    };

    this.errors.push(report);
    
    // Log error
    logger.error(error.message, error, { ...metadata });

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToService(report);
    }
  }

  /**
   * Capture a message (non-error)
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    const report: ErrorReport = {
      message,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: Date.now(),
      userId: this.userId || undefined,
      metadata: { level },
    };

    this.errors.push(report);
    logger[level === 'warning' ? 'warn' : level](message);
  }

  /**
   * Send error to tracking service
   */
  private async sendToService(report: ErrorReport): Promise<void> {
    // Placeholder for error tracking service integration
    // Could be Sentry, LogRocket, etc.
    try {
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report),
      // });
      console.debug('Error report:', report);
    } catch {
      // Silently fail
    }
  }

  /**
   * Get all captured errors
   */
  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  /**
   * Clear errors
   */
  clear(): void {
    this.errors = [];
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

export const performanceMonitor = new PerformanceMonitor();
export const errorTracker = new ErrorTracker();

/**
 * Initialize all monitoring
 */
export function initMonitoring(): void {
  performanceMonitor.init();
  errorTracker.init();
}

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useEffect, useRef } from 'react';

/**
 * Hook to track component render performance
 */
export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current++;
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (renderCount.current > 1 && timeSinceLastRender < 16) {
      // Rapid re-renders (more than 60fps)
      logger.debug(`Rapid re-render in ${componentName}`, {
        renderCount: renderCount.current,
        timeSinceLastRender,
      });
    }
  });
}

/**
 * Hook to track component mount/unmount
 */
export function useComponentLifecycle(componentName: string) {
  useEffect(() => {
    const mountTime = performance.now();
    logger.debug(`${componentName} mounted`);

    return () => {
      const lifetime = performance.now() - mountTime;
      logger.debug(`${componentName} unmounted after ${lifetime.toFixed(0)}ms`);
    };
  }, [componentName]);
}

export default { performanceMonitor, errorTracker, initMonitoring };
