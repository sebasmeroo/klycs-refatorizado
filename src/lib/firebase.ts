import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getFunctions } from "firebase/functions";
import { info } from '@/utils/logger';

// Firebase configuration - Real production values
const firebaseConfig = {
  apiKey: "AIzaSyBQnoi57s3oL_yHl4yxehHooXafykzT974",
  authDomain: "klycs-58190.firebaseapp.com",
  projectId: "klycs-58190",
  storageBucket: "klycs-58190.firebasestorage.app",
  messagingSenderId: "222603073619",
  appId: "1:222603073619:web:ca9f968c9c7553daddcea6",
  measurementId: "G-JENV802PEF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Initialize analytics only in browser with error handling
export const analytics = typeof window !== 'undefined' ? (() => {
  try {
    // Skip analytics in development to avoid errors
    if (import.meta.env.NODE_ENV === 'development') {
      info('Analytics disabled in development mode', { component: 'firebase' });
      return null;
    }
    
    const analyticsInstance = getAnalytics(app);
    return analyticsInstance;
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
    return null;
  }
})() : null;

// Log initialization
info('Firebase initialized successfully', { 
  component: 'firebase', 
  projectId: firebaseConfig.projectId 
});

export default app;
