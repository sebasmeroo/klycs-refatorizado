import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/types';
import { authService } from '@/services/auth';
import { error as logError } from '@/utils/logger';
import { monitoringService } from '@/services/monitoring';

export const useAuth = () => {
  const { user, firebaseUser, loading, setUser, setFirebaseUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userData = await authService.getUserData(firebaseUser.uid);
          if (userData) {
            setUser(userData);
            // Set user context for monitoring
            monitoringService.setUser({
              id: userData.id,
              email: userData.email,
              name: userData.name
            });
          } else {
            setUser(null);
          }
        } catch (error) {
          logError('Failed to fetch user data', error as Error, { component: 'useAuth', userId: firebaseUser.uid });
          setUser(null);
        }
      } else {
        setUser(null);
        // Clear user context from monitoring
        monitoringService.clearUser();
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setFirebaseUser, setLoading]);

    return {
      user,
      firebaseUser,
      loading,
      isAuthenticated: !!firebaseUser,
      isAdmin: user?.role === 'admin',
      isProfessional: user?.role === 'professional',
      isUser: user?.role === 'user' || !user?.role, // usuarios sin rol definido son 'user' por defecto
    };
};