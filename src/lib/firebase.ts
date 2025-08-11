import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getFunctions } from "firebase/functions";
import { info } from '@/utils/logger';

// Validate required environment variables
const requiredEnvVars = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key, ]) => `VITE_FIREBASE_${key.toUpperCase()}`);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}. ` +
    'Please check your .env file and ensure all Firebase configuration variables are set.'
  );
}

const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey,
  authDomain: requiredEnvVars.authDomain,
  projectId: requiredEnvVars.projectId,
  // El bucket de Firebase Storage debe terminar en '.appspot.com'. Con un nombre incorrecto se producen errores 403 (storage/unauthorized).
  storageBucket: requiredEnvVars.storageBucket,
  messagingSenderId: requiredEnvVars.messagingSenderId,
  appId: requiredEnvVars.appId,
  measurementId: requiredEnvVars.measurementId,
  // Disable dynamic config fetching to prevent 403 errors
  automaticDataCollectionEnabled: false
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Initialize analytics only in browser with error handling and config
export const analytics = typeof window !== 'undefined' ? (() => {
  try {
    // Only initialize analytics if measurement ID is available and not in development
    if (!requiredEnvVars.measurementId) {
      if (import.meta.env.NODE_ENV === 'development') {
        // Silent in development
        return null;
      }
      console.warn('Analytics measurement ID not provided - analytics disabled');
      return null;
    }
    
    // Skip analytics in development to avoid 403 errors
    if (import.meta.env.NODE_ENV === 'development') {
      info('Analytics disabled in development mode', { component: 'firebase' });
      return null;
    }
    
    const analyticsInstance = getAnalytics(app);
    
    // Configure analytics settings to prevent dynamic config fetch
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', requiredEnvVars.measurementId, {
        // Disable automatic page view tracking
        send_page_view: false,
        // Use local config only to prevent 403 errors
        custom_map: {},
        // Disable data collection until explicitly enabled
        disable_collection: import.meta.env.NODE_ENV === 'development'
      });
    }
    
    return analyticsInstance;
  } catch (error) {
    // Silent warning in development
    if (import.meta.env.NODE_ENV !== 'development') {
      console.warn('Analytics initialization failed:', error);
    }
    return null;
  }
})() : null;

// Log initialization
info('Firebase initialized successfully', { component: 'firebase', projectId: firebaseConfig.projectId });

export default app;