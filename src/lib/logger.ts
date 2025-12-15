/**
 * Structured Logging Library (M007)
 * Provides consistent logging with levels, context, and formatting
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  userId?: string;
  requestId?: string;
  action?: string;
  component?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Log level priority (higher = more severe)
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Get minimum log level from environment
function getMinLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
  if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
    return envLevel;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

const MIN_LOG_LEVEL = getMinLogLevel();

/**
 * Check if a log level should be logged
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  const { timestamp, level, message, context, error } = entry;
  
  // In production, output JSON for log aggregation
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(entry);
  }
  
  // In development, output human-readable format
  const levelColors: Record<LogLevel, string> = {
    debug: '\x1b[36m', // cyan
    info: '\x1b[32m',  // green
    warn: '\x1b[33m',  // yellow
    error: '\x1b[31m', // red
  };
  const reset = '\x1b[0m';
  const color = levelColors[level];
  
  let output = `${color}[${level.toUpperCase()}]${reset} ${timestamp} - ${message}`;
  
  if (context && Object.keys(context).length > 0) {
    output += ` | ${JSON.stringify(context)}`;
  }
  
  if (error) {
    output += `\n  Error: ${error.name}: ${error.message}`;
    if (error.stack) {
      output += `\n  Stack: ${error.stack}`;
    }
  }
  
  return output;
}

/**
 * Create a log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };
  
  if (context) {
    entry.context = context;
  }
  
  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  
  return entry;
}

/**
 * Output log entry to console
 */
function outputLog(entry: LogEntry): void {
  const formatted = formatLogEntry(entry);
  
  switch (entry.level) {
    case 'debug':
      console.debug(formatted);
      break;
    case 'info':
      console.info(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
  }
}

/**
 * Main logger object
 */
export const logger = {
  debug(message: string, context?: LogContext): void {
    if (shouldLog('debug')) {
      outputLog(createLogEntry('debug', message, context));
    }
  },
  
  info(message: string, context?: LogContext): void {
    if (shouldLog('info')) {
      outputLog(createLogEntry('info', message, context));
    }
  },
  
  warn(message: string, context?: LogContext): void {
    if (shouldLog('warn')) {
      outputLog(createLogEntry('warn', message, context));
    }
  },
  
  error(message: string, error?: Error, context?: LogContext): void {
    if (shouldLog('error')) {
      outputLog(createLogEntry('error', message, context, error));
    }
  },
  
  /**
   * Create a child logger with preset context
   */
  child(defaultContext: LogContext) {
    return {
      debug: (message: string, context?: LogContext) =>
        logger.debug(message, { ...defaultContext, ...context }),
      info: (message: string, context?: LogContext) =>
        logger.info(message, { ...defaultContext, ...context }),
      warn: (message: string, context?: LogContext) =>
        logger.warn(message, { ...defaultContext, ...context }),
      error: (message: string, error?: Error, context?: LogContext) =>
        logger.error(message, error, { ...defaultContext, ...context }),
    };
  },
};

// ============================================================================
// SPECIALIZED LOGGERS
// ============================================================================

/**
 * API request logger
 */
export function logApiRequest(
  method: string,
  path: string,
  context?: LogContext
): void {
  logger.info(`API ${method} ${path}`, {
    action: 'api_request',
    ...context,
  });
}

/**
 * API response logger
 */
export function logApiResponse(
  method: string,
  path: string,
  status: number,
  duration: number,
  context?: LogContext
): void {
  const message = `API ${method} ${path} -> ${status} (${duration}ms)`;
  const logContext = {
    action: 'api_response',
    status,
    duration,
    ...context,
  };
  
  if (status >= 500) {
    logger.error(message, undefined, logContext);
  } else if (status >= 400) {
    logger.warn(message, logContext);
  } else {
    logger.info(message, logContext);
  }
}

/**
 * Database operation logger
 */
export function logDbOperation(
  operation: string,
  table: string,
  duration?: number,
  context?: LogContext
): void {
  logger.debug(`DB ${operation} on ${table}${duration ? ` (${duration}ms)` : ''}`, {
    action: 'db_operation',
    operation,
    table,
    duration,
    ...context,
  });
}

/**
 * Authentication event logger
 */
export function logAuthEvent(
  event: 'login' | 'logout' | 'signup' | 'password_reset' | 'token_refresh',
  userId?: string,
  context?: LogContext
): void {
  logger.info(`Auth: ${event}`, {
    action: 'auth_event',
    event,
    userId,
    ...context,
  });
}

/**
 * Business event logger (for analytics)
 */
export function logBusinessEvent(
  event: string,
  data?: Record<string, unknown>,
  context?: LogContext
): void {
  logger.info(`Event: ${event}`, {
    action: 'business_event',
    event,
    data,
    ...context,
  });
}

/**
 * Performance logger
 */
export function logPerformance(
  operation: string,
  duration: number,
  context?: LogContext
): void {
  const level = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'debug';
  logger[level](`Performance: ${operation} took ${duration}ms`, {
    action: 'performance',
    operation,
    duration,
    ...context,
  });
}

/**
 * Create a timer for measuring operation duration
 */
export function createTimer(operation: string, context?: LogContext) {
  const start = performance.now();
  
  return {
    end(): number {
      const duration = Math.round(performance.now() - start);
      logPerformance(operation, duration, context);
      return duration;
    },
  };
}

export default logger;
