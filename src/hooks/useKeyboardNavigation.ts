import { useEffect, useCallback } from 'react';

interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: (e: KeyboardEvent) => void;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  enabled?: boolean;
}

export const useKeyboardNavigation = (options: KeyboardNavigationOptions = {}) => {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    preventDefault = true,
    stopPropagation = false,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const { key } = event;

      switch (key) {
        case 'Escape':
          if (onEscape) {
            if (preventDefault) event.preventDefault();
            if (stopPropagation) event.stopPropagation();
            onEscape();
          }
          break;

        case 'Enter':
          if (onEnter) {
            if (preventDefault) event.preventDefault();
            if (stopPropagation) event.stopPropagation();
            onEnter();
          }
          break;

        case 'ArrowUp':
          if (onArrowUp) {
            if (preventDefault) event.preventDefault();
            if (stopPropagation) event.stopPropagation();
            onArrowUp();
          }
          break;

        case 'ArrowDown':
          if (onArrowDown) {
            if (preventDefault) event.preventDefault();
            if (stopPropagation) event.stopPropagation();
            onArrowDown();
          }
          break;

        case 'ArrowLeft':
          if (onArrowLeft) {
            if (preventDefault) event.preventDefault();
            if (stopPropagation) event.stopPropagation();
            onArrowLeft();
          }
          break;

        case 'ArrowRight':
          if (onArrowRight) {
            if (preventDefault) event.preventDefault();
            if (stopPropagation) event.stopPropagation();
            onArrowRight();
          }
          break;

        case 'Tab':
          if (onTab) {
            onTab(event);
          }
          break;

        default:
          break;
      }
    },
    [
      enabled,
      onEscape,
      onEnter,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onTab,
      preventDefault,
      stopPropagation,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  return handleKeyDown;
};