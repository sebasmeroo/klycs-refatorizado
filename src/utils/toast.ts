/**
 * Simple toast notification system
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

let toastContainer: HTMLElement | null = null;

const createToastContainer = () => {
  if (toastContainer) return toastContainer;
  
  toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  `;
  document.body.appendChild(toastContainer);
  return toastContainer;
};

const createToastElement = (message: string, type: ToastType): HTMLElement => {
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${getToastColor(type)};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    max-width: 350px;
    pointer-events: auto;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  
  const icon = getToastIcon(type);
  toast.innerHTML = `${icon} ${message}`;
  
  return toast;
};

const getToastColor = (type: ToastType): string => {
  switch (type) {
    case 'success': return '#10b981';
    case 'error': return '#ef4444';
    case 'warning': return '#f59e0b';
    case 'info': return '#3b82f6';
    default: return '#6b7280';
  }
};

const getToastIcon = (type: ToastType): string => {
  switch (type) {
    case 'success': return '✓';
    case 'error': return '✕';
    case 'warning': return '⚠';
    case 'info': return 'ℹ';
    default: return '•';
  }
};

export const showToast = (
  message: string, 
  type: ToastType = 'info', 
  options: ToastOptions = {}
) => {
  const { duration = 4000 } = options;
  
  const container = createToastContainer();
  const toast = createToastElement(message, type);
  
  container.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
  });
  
  // Auto dismiss
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
      // Clean up container if empty
      if (container.children.length === 0) {
        document.body.removeChild(container);
        toastContainer = null;
      }
    }, 300);
  }, duration);
  
  // Click to dismiss
  toast.addEventListener('click', () => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
    }, 300);
  });
};

// Convenience methods
export const toast = {
  success: (message: string, options?: ToastOptions) => showToast(message, 'success', options),
  error: (message: string, options?: ToastOptions) => showToast(message, 'error', options),
  warning: (message: string, options?: ToastOptions) => showToast(message, 'warning', options),
  info: (message: string, options?: ToastOptions) => showToast(message, 'info', options),
};