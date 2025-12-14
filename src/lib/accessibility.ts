/**
 * Accessibility Utilities (M014)
 * ARIA helpers, keyboard navigation, and screen reader support
 */

// ============================================================================
// ARIA HELPERS
// ============================================================================

/**
 * Generate unique IDs for ARIA relationships
 */
let idCounter = 0;
export function generateId(prefix: string = 'aria'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * ARIA live region announcer for screen readers
 */
class Announcer {
  private container: HTMLElement | null = null;
  
  private getContainer(): HTMLElement {
    if (typeof document === 'undefined') {
      throw new Error('Announcer requires DOM');
    }
    
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'true');
      this.container.setAttribute('role', 'status');
      this.container.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;
      document.body.appendChild(this.container);
    }
    
    return this.container;
  }
  
  /**
   * Announce a message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const container = this.getContainer();
    container.setAttribute('aria-live', priority);
    
    // Clear and set message (triggers announcement)
    container.textContent = '';
    requestAnimationFrame(() => {
      container.textContent = message;
    });
  }
  
  /**
   * Announce immediately (for urgent messages)
   */
  announceUrgent(message: string): void {
    this.announce(message, 'assertive');
  }
}

export const announcer = new Announcer();

// ============================================================================
// KEYBOARD NAVIGATION
// ============================================================================

export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const;

/**
 * Check if event is an activation key (Enter or Space)
 */
export function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === KEYS.ENTER || event.key === KEYS.SPACE;
}

/**
 * Handle keyboard navigation for lists/menus
 */
export function handleListKeyDown(
  event: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  options: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical';
    onSelect?: (index: number) => void;
  } = {}
): number {
  const { loop = true, orientation = 'vertical', onSelect } = options;
  const isVertical = orientation === 'vertical';
  
  const prevKey = isVertical ? KEYS.ARROW_UP : KEYS.ARROW_LEFT;
  const nextKey = isVertical ? KEYS.ARROW_DOWN : KEYS.ARROW_RIGHT;
  
  let newIndex = currentIndex;
  
  switch (event.key) {
    case prevKey:
      event.preventDefault();
      newIndex = currentIndex - 1;
      if (newIndex < 0) {
        newIndex = loop ? items.length - 1 : 0;
      }
      break;
      
    case nextKey:
      event.preventDefault();
      newIndex = currentIndex + 1;
      if (newIndex >= items.length) {
        newIndex = loop ? 0 : items.length - 1;
      }
      break;
      
    case KEYS.HOME:
      event.preventDefault();
      newIndex = 0;
      break;
      
    case KEYS.END:
      event.preventDefault();
      newIndex = items.length - 1;
      break;
      
    case KEYS.ENTER:
    case KEYS.SPACE:
      event.preventDefault();
      onSelect?.(currentIndex);
      return currentIndex;
  }
  
  if (newIndex !== currentIndex && items[newIndex]) {
    items[newIndex].focus();
  }
  
  return newIndex;
}

/**
 * Trap focus within a container (for modals)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');
  
  const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelector);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== KEYS.TAB) return;
    
    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };
  
  container.addEventListener('keydown', handleKeyDown);
  firstElement?.focus();
  
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

// ============================================================================
// FOCUS MANAGEMENT
// ============================================================================

/**
 * Save and restore focus (for modals/dialogs)
 */
export function createFocusManager() {
  let previouslyFocused: HTMLElement | null = null;
  
  return {
    save(): void {
      previouslyFocused = document.activeElement as HTMLElement;
    },
    
    restore(): void {
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
      previouslyFocused = null;
    },
  };
}

/**
 * Check if element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  if (element.tabIndex < 0) return false;
  if (element.hasAttribute('disabled')) return false;
  
  const tagName = element.tagName.toLowerCase();
  
  if (tagName === 'input' || tagName === 'select' || tagName === 'textarea' || tagName === 'button') {
    return !element.hasAttribute('disabled');
  }
  
  if (tagName === 'a') {
    return element.hasAttribute('href');
  }
  
  return element.tabIndex >= 0;
}

// ============================================================================
// REDUCED MOTION
// ============================================================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation duration based on user preference
 */
export function getAnimationDuration(defaultMs: number): number {
  return prefersReducedMotion() ? 0 : defaultMs;
}

// ============================================================================
// COLOR CONTRAST
// ============================================================================

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: more)').matches;
}

// ============================================================================
// SCREEN READER UTILITIES
// ============================================================================

/**
 * Visually hidden but accessible to screen readers
 */
export const visuallyHiddenStyles: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

/**
 * Format number for screen readers
 */
export function formatNumberForSR(num: number, label: string): string {
  return `${num.toLocaleString()} ${label}${num !== 1 ? 's' : ''}`;
}

/**
 * Format percentage for screen readers
 */
export function formatPercentageForSR(value: number): string {
  return `${Math.round(value)} percent`;
}

/**
 * Format date for screen readers
 */
export function formatDateForSR(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ============================================================================
// COMPONENT HELPERS
// ============================================================================

/**
 * Props for accessible buttons that look like other elements
 */
export function getButtonProps(onClick: () => void) {
  return {
    role: 'button',
    tabIndex: 0,
    onClick,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (isActivationKey(e.nativeEvent)) {
        e.preventDefault();
        onClick();
      }
    },
  };
}

/**
 * Props for accessible checkboxes
 */
export function getCheckboxProps(checked: boolean, onChange: (checked: boolean) => void) {
  return {
    role: 'checkbox',
    'aria-checked': checked,
    tabIndex: 0,
    onClick: () => onChange(!checked),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === KEYS.SPACE) {
        e.preventDefault();
        onChange(!checked);
      }
    },
  };
}

/**
 * Props for progress indicators
 */
export function getProgressProps(value: number, max: number = 100, label?: string) {
  const percentage = Math.round((value / max) * 100);
  return {
    role: 'progressbar',
    'aria-valuenow': value,
    'aria-valuemin': 0,
    'aria-valuemax': max,
    'aria-valuetext': label || `${percentage}%`,
    'aria-label': label,
  };
}
