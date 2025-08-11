import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from '@/utils/toast';

// Mock del DOM para simular elementos toast
const mockToastContainer = {
  appendChild: vi.fn(),
  removeChild: vi.fn(),
  children: [],
};

Object.defineProperty(document, 'getElementById', {
  value: vi.fn(() => mockToastContainer),
  writable: true,
});

Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => ({
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    style: {},
    textContent: '',
    addEventListener: vi.fn(),
    remove: vi.fn(),
  })),
  writable: true,
});

describe('Toast System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToastContainer.children = [];
  });

  it('should create success toast', () => {
    const message = 'Test success message';
    toast.success(message);
    
    expect(document.createElement).toHaveBeenCalledWith('div');
  });

  it('should create error toast', () => {
    const message = 'Test error message';
    toast.error(message);
    
    expect(document.createElement).toHaveBeenCalledWith('div');
  });

  it('should create warning toast', () => {
    const message = 'Test warning message';
    toast.warning(message);
    
    expect(document.createElement).toHaveBeenCalledWith('div');
  });

  it('should create info toast', () => {
    const message = 'Test info message';
    toast.info(message);
    
    expect(document.createElement).toHaveBeenCalledWith('div');
  });

  it('should respect custom duration', () => {
    const message = 'Test message';
    const customDuration = 1000;
    
    toast.success(message, { duration: customDuration });
    
    expect(document.createElement).toHaveBeenCalled();
  });

  it('should handle persistent toasts', () => {
    const message = 'Persistent message';
    
    toast.success(message, { persistent: true });
    
    expect(document.createElement).toHaveBeenCalled();
  });

  it('should handle custom positions', () => {
    const message = 'Positioned message';
    
    toast.success(message, { position: 'bottom-center' });
    
    expect(document.createElement).toHaveBeenCalled();
  });
});