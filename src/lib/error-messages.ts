/**
 * User-Friendly Error Messages (L002)
 * Provides actionable, human-readable error messages
 */

// ============================================================================
// ERROR TYPES
// ============================================================================

export type ErrorCategory =
  | 'auth'
  | 'network'
  | 'validation'
  | 'permission'
  | 'notFound'
  | 'conflict'
  | 'rateLimit'
  | 'payment'
  | 'server'
  | 'unknown';

export interface UserFriendlyError {
  title: string;
  message: string;
  action?: string;
  actionLabel?: string;
  category: ErrorCategory;
  retryable: boolean;
}

// ============================================================================
// ERROR MESSAGE MAPPINGS
// ============================================================================

const errorMessages: Record<string, UserFriendlyError> = {
  // Authentication Errors
  'auth/invalid-credentials': {
    title: 'Login Failed',
    message: 'The email or password you entered is incorrect.',
    action: '/forgot-password',
    actionLabel: 'Reset Password',
    category: 'auth',
    retryable: true,
  },
  'auth/email-not-verified': {
    title: 'Email Not Verified',
    message: 'Please check your inbox and verify your email address to continue.',
    actionLabel: 'Resend Verification',
    category: 'auth',
    retryable: false,
  },
  'auth/session-expired': {
    title: 'Session Expired',
    message: 'Your session has expired. Please log in again to continue.',
    action: '/login',
    actionLabel: 'Log In',
    category: 'auth',
    retryable: false,
  },
  'auth/account-locked': {
    title: 'Account Locked',
    message: 'Too many failed attempts. Please try again in 15 minutes or reset your password.',
    action: '/forgot-password',
    actionLabel: 'Reset Password',
    category: 'auth',
    retryable: false,
  },
  'auth/user-not-found': {
    title: 'Account Not Found',
    message: "We couldn't find an account with that email. Would you like to create one?",
    action: '/signup',
    actionLabel: 'Sign Up',
    category: 'auth',
    retryable: false,
  },
  
  // Network Errors
  'network/offline': {
    title: 'No Internet Connection',
    message: "You appear to be offline. Please check your connection and try again.",
    category: 'network',
    retryable: true,
  },
  'network/timeout': {
    title: 'Request Timed Out',
    message: 'The server took too long to respond. Please try again.',
    category: 'network',
    retryable: true,
  },
  'network/server-unreachable': {
    title: 'Server Unavailable',
    message: "We're having trouble connecting to our servers. Please try again in a moment.",
    category: 'network',
    retryable: true,
  },
  
  // Validation Errors
  'validation/invalid-email': {
    title: 'Invalid Email',
    message: 'Please enter a valid email address.',
    category: 'validation',
    retryable: true,
  },
  'validation/password-weak': {
    title: 'Password Too Weak',
    message: 'Password must be at least 8 characters with a mix of letters and numbers.',
    category: 'validation',
    retryable: true,
  },
  'validation/required-field': {
    title: 'Missing Information',
    message: 'Please fill in all required fields.',
    category: 'validation',
    retryable: true,
  },
  'validation/invalid-input': {
    title: 'Invalid Input',
    message: 'Some of the information you entered is invalid. Please check and try again.',
    category: 'validation',
    retryable: true,
  },
  
  // Permission Errors
  'permission/unauthorized': {
    title: 'Access Denied',
    message: "You don't have permission to perform this action.",
    category: 'permission',
    retryable: false,
  },
  'permission/admin-required': {
    title: 'Admin Access Required',
    message: 'This action requires administrator privileges.',
    category: 'permission',
    retryable: false,
  },
  
  // Not Found Errors
  'notFound/resource': {
    title: 'Not Found',
    message: "The item you're looking for doesn't exist or has been removed.",
    action: '/',
    actionLabel: 'Go Home',
    category: 'notFound',
    retryable: false,
  },
  'notFound/page': {
    title: 'Page Not Found',
    message: "The page you're looking for doesn't exist.",
    action: '/',
    actionLabel: 'Go Home',
    category: 'notFound',
    retryable: false,
  },
  
  // Conflict Errors
  'conflict/duplicate': {
    title: 'Already Exists',
    message: 'An item with this name already exists. Please choose a different name.',
    category: 'conflict',
    retryable: true,
  },
  'conflict/version': {
    title: 'Update Conflict',
    message: 'This item was modified by someone else. Please refresh and try again.',
    category: 'conflict',
    retryable: true,
  },
  
  // Rate Limit Errors
  'rateLimit/exceeded': {
    title: 'Too Many Requests',
    message: "You're doing that too fast. Please wait a moment and try again.",
    category: 'rateLimit',
    retryable: true,
  },
  
  // Payment Errors
  'payment/failed': {
    title: 'Payment Failed',
    message: 'Your payment could not be processed. Please check your payment details and try again.',
    category: 'payment',
    retryable: true,
  },
  'payment/insufficient-funds': {
    title: 'Insufficient Funds',
    message: "You don't have enough coins for this purchase.",
    action: '/shop',
    actionLabel: 'Get More Coins',
    category: 'payment',
    retryable: false,
  },
  'payment/cancelled': {
    title: 'Payment Cancelled',
    message: 'Your payment was cancelled. No charges were made.',
    category: 'payment',
    retryable: true,
  },
  
  // Server Errors
  'server/internal': {
    title: 'Something Went Wrong',
    message: "We're experiencing technical difficulties. Our team has been notified.",
    category: 'server',
    retryable: true,
  },
  'server/maintenance': {
    title: 'Under Maintenance',
    message: "We're currently performing maintenance. Please check back soon.",
    category: 'server',
    retryable: false,
  },
  
  // Habit-specific Errors
  'habit/limit-reached': {
    title: 'Habit Limit Reached',
    message: "You've reached the maximum number of habits. Archive some habits to add new ones.",
    category: 'validation',
    retryable: false,
  },
  'habit/already-completed': {
    title: 'Already Completed',
    message: "You've already completed this habit today. Great job!",
    category: 'conflict',
    retryable: false,
  },
  
  // Default
  'unknown': {
    title: 'Unexpected Error',
    message: 'Something unexpected happened. Please try again or contact support if the problem persists.',
    category: 'unknown',
    retryable: true,
  },
};

// ============================================================================
// ERROR HELPERS
// ============================================================================

/**
 * Get user-friendly error message from error code
 */
export function getErrorMessage(code: string): UserFriendlyError {
  return errorMessages[code] || errorMessages['unknown'];
}

/**
 * Parse error from various sources and return user-friendly message
 */
export function parseError(error: unknown): UserFriendlyError {
  // Handle null/undefined
  if (!error) {
    return errorMessages['unknown'];
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return getErrorMessage(error);
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('fetch') || message.includes('network')) {
      return errorMessages['network/offline'];
    }
    if (message.includes('timeout')) {
      return errorMessages['network/timeout'];
    }
    
    // Auth errors
    if (message.includes('unauthorized') || message.includes('401')) {
      return errorMessages['auth/session-expired'];
    }
    if (message.includes('forbidden') || message.includes('403')) {
      return errorMessages['permission/unauthorized'];
    }
    
    // Not found
    if (message.includes('not found') || message.includes('404')) {
      return errorMessages['notFound/resource'];
    }
    
    // Rate limit
    if (message.includes('rate limit') || message.includes('429')) {
      return errorMessages['rateLimit/exceeded'];
    }
    
    // Server errors
    if (message.includes('500') || message.includes('server')) {
      return errorMessages['server/internal'];
    }
  }
  
  // Handle objects with code property
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    
    if (typeof errorObj.code === 'string') {
      return getErrorMessage(errorObj.code);
    }
    
    if (typeof errorObj.error === 'string') {
      return getErrorMessage(errorObj.error);
    }
  }
  
  return errorMessages['unknown'];
}

/**
 * Get error icon based on category
 */
export function getErrorIcon(category: ErrorCategory): string {
  const icons: Record<ErrorCategory, string> = {
    auth: '🔐',
    network: '📡',
    validation: '⚠️',
    permission: '🚫',
    notFound: '🔍',
    conflict: '⚡',
    rateLimit: '⏱️',
    payment: '💳',
    server: '🔧',
    unknown: '❓',
  };
  return icons[category];
}

/**
 * Get error color based on category
 */
export function getErrorColor(category: ErrorCategory): string {
  const colors: Record<ErrorCategory, string> = {
    auth: 'text-yellow-500',
    network: 'text-orange-500',
    validation: 'text-yellow-500',
    permission: 'text-red-500',
    notFound: 'text-gray-500',
    conflict: 'text-purple-500',
    rateLimit: 'text-orange-500',
    payment: 'text-red-500',
    server: 'text-red-500',
    unknown: 'text-gray-500',
  };
  return colors[category];
}

export default errorMessages;
