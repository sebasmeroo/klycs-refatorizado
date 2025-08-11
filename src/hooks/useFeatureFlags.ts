import { useState, useEffect, useCallback } from 'react';
import { featureFlagsService, UseFeatureFlagOptions, UseFeatureFlagsOptions } from '@/services/featureFlagsService';
import { info, warn } from '@/utils/logger';

// Hook for single feature flag
export function useFeatureFlag(flagId: string, options: UseFeatureFlagOptions = {}) {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkFlag = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const isEnabled = await featureFlagsService.isEnabled(
        flagId, 
        options.userId, 
        options.context
      );
      
      setEnabled(isEnabled);
      
      info('Feature flag evaluated', {
        component: 'useFeatureFlag',
        flagId,
        enabled: isEnabled,
        userId: options.userId
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setEnabled(false);
      
      warn('Feature flag evaluation failed', {
        component: 'useFeatureFlag',
        flagId,
        error: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [flagId, options.userId, options.context]);

  useEffect(() => {
    checkFlag();

    // Set up listener for flag updates
    const unsubscribe = featureFlagsService.onFlagUpdate(flagId, () => {
      checkFlag();
    });

    // Set up polling if specified
    let pollInterval: NodeJS.Timeout | null = null;
    if (options.pollInterval && options.pollInterval > 0) {
      pollInterval = setInterval(checkFlag, options.pollInterval);
    }

    return () => {
      unsubscribe();
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [checkFlag, flagId, options.pollInterval]);

  return {
    enabled,
    loading,
    error,
    refresh: checkFlag
  };
}

// Hook for multiple feature flags
export function useFeatureFlags(options: UseFeatureFlagsOptions) {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkFlags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const flagResults = await featureFlagsService.getMultipleFlags(
        options.flags,
        options.userId,
        options.context
      );
      
      setFlags(flagResults);
      
      info('Multiple feature flags evaluated', {
        component: 'useFeatureFlags',
        flags: options.flags,
        results: flagResults,
        userId: options.userId
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      // Set all flags to false on error
      const fallbackFlags: Record<string, boolean> = {};
      options.flags.forEach(flagId => {
        fallbackFlags[flagId] = false;
      });
      setFlags(fallbackFlags);
      
      warn('Multiple feature flags evaluation failed', {
        component: 'useFeatureFlags',
        flags: options.flags,
        error: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [options.flags, options.userId, options.context]);

  useEffect(() => {
    checkFlags();

    // Set up listeners for all flag updates
    const unsubscribes = options.flags.map(flagId =>
      featureFlagsService.onFlagUpdate(flagId, () => {
        checkFlags();
      })
    );

    // Set up polling if specified
    let pollInterval: NodeJS.Timeout | null = null;
    if (options.pollInterval && options.pollInterval > 0) {
      pollInterval = setInterval(checkFlags, options.pollInterval);
    }

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [checkFlags, options.flags, options.pollInterval]);

  return {
    flags,
    loading,
    error,
    refresh: checkFlags,
    isEnabled: (flagId: string) => flags[flagId] || false
  };
}

// Hook for feature flag management (admin use)
export function useFeatureFlagManagement() {
  const [allFlags, setAllFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshFlags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const flags = await featureFlagsService.getAllFlags();
      setAllFlags(flags);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      warn('Failed to fetch all feature flags', {
        component: 'useFeatureFlagManagement',
        error: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFlags();
  }, [refreshFlags]);

  const createFlag = useCallback(async (flagData: any) => {
    try {
      const flagId = await featureFlagsService.createFlag(flagData);
      await refreshFlags(); // Refresh the list
      return flagId;
    } catch (err) {
      throw err;
    }
  }, [refreshFlags]);

  const updateFlag = useCallback(async (flagId: string, updates: any) => {
    try {
      await featureFlagsService.updateFlag(flagId, updates);
      await refreshFlags(); // Refresh the list
    } catch (err) {
      throw err;
    }
  }, [refreshFlags]);

  const deleteFlag = useCallback(async (flagId: string) => {
    try {
      await featureFlagsService.deleteFlag(flagId);
      await refreshFlags(); // Refresh the list
    } catch (err) {
      throw err;
    }
  }, [refreshFlags]);

  return {
    flags: allFlags,
    loading,
    error,
    refresh: refreshFlags,
    createFlag,
    updateFlag,
    deleteFlag
  };
}

// Utility hook for feature flag context (user info, app version, etc.)
export function useFeatureFlagContext() {
  const [context, setContext] = useState<any>({});

  useEffect(() => {
    // Gather context information
    const appVersion = process.env.REACT_APP_VERSION || '1.0.0';
    const platform = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    const userAgent = navigator.userAgent;

    // Try to get user location (optional)
    let region = 'unknown';
    try {
      region = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
    } catch (err) {
      // Fallback if timezone detection fails
    }

    setContext({
      version: appVersion,
      platform,
      userAgent,
      region,
      timestamp: new Date().toISOString()
    });
  }, []);

  return {
    context,
    updateContext: (newContext: any) => setContext({ ...context, ...newContext })
  };
}