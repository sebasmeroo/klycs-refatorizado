/**
 * React Singleton - Ensures single React instance
 * Exposes React globally for debugging in development
 */
import * as ReactImport from 'react'

// Expose React globally for debugging in development only
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).__REACT__ = ReactImport;
  (window as any).__REACT_VERSION__ = ReactImport.version;
}

export {}
