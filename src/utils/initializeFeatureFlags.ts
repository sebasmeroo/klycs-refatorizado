import { collection, doc, getDoc, setDoc, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_FEATURE_FLAGS, ENVIRONMENT_OVERRIDES } from '@/config/featureFlags';
import { info, warn, error } from '@/utils/logger';

/**
 * Initialize default feature flags in Firestore
 * This should be called once during app initialization
 */
export async function initializeDefaultFeatureFlags(): Promise<void> {
  try {
    info('Initializing default feature flags...', { component: 'initializeFeatureFlags' });

    // Get current environment
    const environment = process.env.NODE_ENV || 'development';
    
    // Skip automatic initialization in development to avoid permission errors
    if (environment === 'development') {
      info('Skipping feature flags initialization in development - using local defaults', {
        component: 'initializeFeatureFlags',
        environment
      });
      return;
    }
    
    const envOverrides = ENVIRONMENT_OVERRIDES[environment as keyof typeof ENVIRONMENT_OVERRIDES]?.overrides || {};

    // Check if flags are already initialized
    const flagsQuery = query(collection(db, 'featureFlags'));
    
    try {
      const existingFlags = await getDocs(flagsQuery);
      
      if (existingFlags.size > 0) {
        info('Feature flags already initialized', { 
          component: 'initializeFeatureFlags',
          existingCount: existingFlags.size 
        });
        return;
      }
    } catch (permissionError) {
      // If we don't have permission to read, it might be a rules issue
      warn('Cannot read feature flags collection - checking permissions', {
        component: 'initializeFeatureFlags',
        error: permissionError instanceof Error ? permissionError.message : 'Unknown error'
      });
      
      // Skip initialization if we don't have permissions
      warn('Skipping feature flags initialization due to permissions - using local defaults', {
        component: 'initializeFeatureFlags',
        environment
      });
      return;
    }

    // Initialize each default flag
    let createdCount = 0;
    let failedCount = 0;

    for (const flagConfig of DEFAULT_FEATURE_FLAGS) {
      try {
        const flagRef = doc(collection(db, 'featureFlags'));
        const now = new Date();

        // Apply environment overrides
        const finalConfig = {
          ...flagConfig,
          ...envOverrides,
          createdAt: now,
          updatedAt: now
        };

        await setDoc(flagRef, finalConfig);

        info('Created feature flag', {
          component: 'initializeFeatureFlags',
          flagId: flagRef.id,
          flagName: flagConfig.name,
          environment
        });

        createdCount++;

      } catch (err) {
        error('Failed to create feature flag', err as Error, {
          component: 'initializeFeatureFlags',
          flagName: flagConfig.name
        });
        failedCount++;
      }
    }

    info('Feature flags initialization completed', {
      component: 'initializeFeatureFlags',
      created: createdCount,
      failed: failedCount,
      total: DEFAULT_FEATURE_FLAGS.length,
      environment
    });

    // Create admin flag management collection if it doesn't exist
    await initializeFlagManagementCollection();

  } catch (err) {
    error('Failed to initialize feature flags', err as Error, {
      component: 'initializeFeatureFlags'
    });
    throw err;
  }
}

/**
 * Initialize flag management collection for admin use
 */
async function initializeFlagManagementCollection(): Promise<void> {
  try {
    const managementRef = doc(db, 'featureFlagManagement', 'config');
    const managementDoc = await getDoc(managementRef);

    if (!managementDoc.exists()) {
      await setDoc(managementRef, {
        initialized: true,
        initializedAt: new Date(),
        version: '1.0.0',
        adminUsers: [], // Will be populated with admin user IDs
        settings: {
          requireApproval: true,
          auditLog: true,
          notifyOnChanges: true
        }
      });

      info('Feature flag management collection initialized', {
        component: 'initializeFeatureFlags'
      });
    }
  } catch (err) {
    warn('Failed to initialize flag management collection', {
      component: 'initializeFeatureFlags',
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}

/**
 * Update feature flags for environment changes
 */
export async function updateFeatureFlagsForEnvironment(environment: string): Promise<void> {
  try {
    info('Updating feature flags for environment', {
      component: 'initializeFeatureFlags',
      environment
    });

    const envOverrides = ENVIRONMENT_OVERRIDES[environment as keyof typeof ENVIRONMENT_OVERRIDES]?.overrides;
    
    if (!envOverrides || Object.keys(envOverrides).length === 0) {
      info('No environment overrides found', {
        component: 'initializeFeatureFlags',
        environment
      });
      return;
    }

    // Get all existing flags
    const flagsQuery = query(collection(db, 'featureFlags'));
    const flagsSnapshot = await getDocs(flagsQuery);

    let updatedCount = 0;

    for (const flagDoc of flagsSnapshot.docs) {
      try {
        const flagRef = doc(db, 'featureFlags', flagDoc.id);
        
        await setDoc(flagRef, {
          ...flagDoc.data(),
          ...envOverrides,
          updatedAt: new Date()
        }, { merge: true });

        updatedCount++;

      } catch (err) {
        warn('Failed to update feature flag for environment', {
          component: 'initializeFeatureFlags',
          flagId: flagDoc.id,
          environment,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    info('Feature flags updated for environment', {
      component: 'initializeFeatureFlags',
      environment,
      updated: updatedCount,
      total: flagsSnapshot.size
    });

  } catch (err) {
    error('Failed to update feature flags for environment', err as Error, {
      component: 'initializeFeatureFlags',
      environment
    });
    throw err;
  }
}

/**
 * Validate feature flag configuration
 */
export function validateFeatureFlagConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!config.name) {
    errors.push('Name is required');
  } else if (!/^[a-z][a-z0-9_]*$/.test(config.name)) {
    errors.push('Name must start with lowercase letter and contain only lowercase letters, numbers, and underscores');
  }

  if (!config.description) {
    errors.push('Description is required');
  } else if (config.description.length < 10 || config.description.length > 200) {
    errors.push('Description must be between 10 and 200 characters');
  }

  if (typeof config.enabled !== 'boolean') {
    errors.push('Enabled must be a boolean');
  }

  if (typeof config.rolloutPercentage !== 'number' || config.rolloutPercentage < 0 || config.rolloutPercentage > 100) {
    errors.push('Rollout percentage must be a number between 0 and 100');
  }

  if (!config.createdBy) {
    errors.push('CreatedBy is required');
  }

  // Optional field validations
  if (config.targetUsers && !Array.isArray(config.targetUsers)) {
    errors.push('TargetUsers must be an array');
  }

  if (config.targetSegments && !Array.isArray(config.targetSegments)) {
    errors.push('TargetSegments must be an array');
  }

  if (config.conditions) {
    if (config.conditions.platform && !Array.isArray(config.conditions.platform)) {
      errors.push('Conditions.platform must be an array');
    }
    if (config.conditions.region && !Array.isArray(config.conditions.region)) {
      errors.push('Conditions.region must be an array');
    }
    if (config.conditions.userType && !Array.isArray(config.conditions.userType)) {
      errors.push('Conditions.userType must be an array');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if feature flags need migration
 */
export async function checkFeatureFlagMigration(): Promise<boolean> {
  try {
    const managementRef = doc(db, 'featureFlagManagement', 'config');
    const managementDoc = await getDoc(managementRef);

    if (!managementDoc.exists()) {
      return true; // Needs initialization
    }

    const data = managementDoc.data();
    const currentVersion = '1.0.0';

    if (data.version !== currentVersion) {
      info('Feature flags need migration', {
        component: 'initializeFeatureFlags',
        currentVersion: data.version,
        targetVersion: currentVersion
      });
      return true;
    }

    return false;

  } catch (err) {
    warn('Failed to check feature flag migration status', {
      component: 'initializeFeatureFlags',
      error: err instanceof Error ? err.message : 'Unknown error'
    });
    return true; // Assume migration needed on error
  }
}

export default initializeDefaultFeatureFlags;