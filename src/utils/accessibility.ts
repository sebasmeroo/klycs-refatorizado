// Screen reader announcements
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Focus management
export const focusElement = (selector: string | HTMLElement, options?: FocusOptions) => {
  const element = typeof selector === 'string' 
    ? document.querySelector(selector) as HTMLElement
    : selector;
    
  if (element && typeof element.focus === 'function') {
    element.focus(options);
    return true;
  }
  return false;
};

// Skip link functionality
export const createSkipLink = (targetId: string, text: string = 'Saltar al contenido principal') => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50';
  
  document.body.insertBefore(skipLink, document.body.firstChild);
  
  return skipLink;
};

// Check if element is visible to screen readers
export const isVisibleToScreenReader = (element: HTMLElement): boolean => {
  const style = getComputedStyle(element);
  
  return !(
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    element.hidden ||
    element.getAttribute('aria-hidden') === 'true' ||
    style.opacity === '0'
  );
};

// Get accessible name of an element
export const getAccessibleName = (element: HTMLElement): string => {
  // Check aria-label first
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;
  
  // Check aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy);
    if (labelElement) return labelElement.textContent || '';
  }
  
  // Check associated label
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
    const id = element.getAttribute('id');
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent || '';
    }
  }
  
  // Check title attribute
  const title = element.getAttribute('title');
  if (title) return title;
  
  // Check alt attribute for images
  if (element.tagName === 'IMG') {
    const alt = element.getAttribute('alt');
    if (alt) return alt;
  }
  
  // Fallback to text content
  return element.textContent || '';
};

// Manage focus trap for modals and dropdowns
export const createFocusTrap = (container: HTMLElement) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>;
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };
  
  container.addEventListener('keydown', handleTabKey);
  
  // Focus first element
  firstElement?.focus();
  
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
};

// Color contrast checker (WCAG 2.1)
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const getSRGB = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    
    return 0.2126 * getSRGB(r) + 0.7152 * getSRGB(g) + 0.0722 * getSRGB(b);
  };
  
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  
  const lightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  
  return (lightest + 0.05) / (darkest + 0.05);
};

export const meetsWCAGContrast = (
  color1: string, 
  color2: string, 
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean => {
  const ratio = getContrastRatio(color1, color2);
  
  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7;
  } else {
    return size === 'large' ? ratio >= 3 : ratio >= 4.5;
  }
};

// Reduced motion preference
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// High contrast preference
export const prefersHighContrast = (): boolean => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

// Generate unique IDs for accessibility
let idCounter = 0;
export const generateId = (prefix: string = 'klycs'): string => {
  return `${prefix}-${++idCounter}`;
};