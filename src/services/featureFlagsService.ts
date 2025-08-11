import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { info, warn, error } from '@/utils/logger';
import { DEFAULT_FEATURE_FLAGS, ENVIRONMENT_OVERRIDES } from '@/config/featureFlags';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetUsers?: string[];
  targetSegments?: string[];
  conditions?: {
    minVersion?: string;
    maxVersion?: string;
    platform?: string[];
    region?: string[];
    userType?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface FeatureFlagEvaluation {
  flagId: string;
  userId: string;
  enabled: boolean;
  reason: string;
  timestamp: Date;
}

class FeatureFlagsService {
  private flags: Map<string, FeatureFlag> = new Map();
  private evaluationCache: Map<string, FeatureFlagEvaluation> = new Map();
  private listeners: Map<string, () => void> = new Map();
  private initialized = false;

  constructor() {
    this.initializeFlags();
  }

  private async initializeFlags(): Promise<void> {
    try {
      // Try to load all feature flags from Firestore
      const flagsQuery = query(collection(db, 'featureFlags'));
      
      try {
        const flagsSnapshot = await getDocs(flagsQuery);
        
        flagsSnapshot.forEach((doc) => {
          const flagData = doc.data();
        const flag: FeatureFlag = {
          id: doc.id,
          ...flagData,
          createdAt: flagData.createdAt?.toDate() || new Date(),
          updatedAt: flagData.updatedAt?.toDate() || new Date()
        } as FeatureFlag;
        
        this.flags.set(flag.id, flag);
      });

      // Set up real-time listener for flag updates
      const unsubscribe = onSnapshot(flagsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const flagData = change.doc.data();
          const flag: FeatureFlag = {
            id: change.doc.id,
            ...flagData,
            createdAt: flagData.createdAt?.toDate() || new Date(),
            updatedAt: flagData.updatedAt?.toDate() || new Date()
          } as FeatureFlag;

          if (change.type === 'added' || change.type === 'modified') {
            this.flags.set(flag.id, flag);
            // Clear cache for this flag
            this.clearEvaluationCache(flag.id);
            // Notify listeners
            this.notifyFlagUpdate(flag.id);
          } else if (change.type === 'removed') {
            this.flags.delete(flag.id);
            this.clearEvaluationCache(flag.id);
            this.notifyFlagUpdate(flag.id);
          }
        });
      });

      this.initialized = true;
      info('Feature flags service initialized with Firestore', { 
        component: 'FeatureFlagsService', 
        flagCount: this.flags.size 
      });

      } catch (firestoreError) {
        warn('Failed to load feature flags from Firestore, using local defaults', {
          component: 'FeatureFlagsService',
          error: firestoreError instanceof Error ? firestoreError.message : 'Unknown error'
        });
        
        // Load default flags from local configuration
        this.loadDefaultFlags();
      }

    } catch (err) {
      error('Failed to initialize feature flags', err as Error, { component: 'FeatureFlagsService' });
      
      // Fallback to local defaults on any error
      this.loadDefaultFlags();
    }
  }

  private loadDefaultFlags(): void {
    try {
      const environment = import.meta.env.NODE_ENV || 'development';
      const envOverrides = ENVIRONMENT_OVERRIDES[environment as keyof typeof ENVIRONMENT_OVERRIDES]?.overrides || {};

      DEFAULT_FEATURE_FLAGS.forEach((flagConfig, index) => {
        const flag: FeatureFlag = {
          id: `local_${index}`,
          ...flagConfig,
          ...envOverrides,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        this.flags.set(flag.id, flag);
      });

      this.initialized = true;
      
      info('Feature flags loaded from local defaults', { 
        component: 'FeatureFlagsService', 
        count: this.flags.size,
        environment 
      });

    } catch (err) {
      error('Failed to load default feature flags', err as Error, { 
        component: 'FeatureFlagsService' 
      });
      
      // Even if defaults fail, mark as initialized to prevent infinite loops
      this.initialized = true;
    }
  }

  // Public API methods

  public async isEnabled(flagId: string, userId?: string, context?: any): Promise<boolean> {
    try {
      if (!this.initialized) {
        await this.initializeFlags();
      }

      // Check cache first if userId is provided
      if (userId) {
        const cacheKey = `${flagId}:${userId}`;
        const cached = this.evaluationCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp.getTime() < 5 * 60 * 1000) { // 5 minutes cache
          return cached.enabled;
        }
      }

      const evaluation = await this.evaluateFlag(flagId, userId, context);
      
      // Cache the evaluation if userId is provided
      if (userId && evaluation) {
        const cacheKey = `${flagId}:${userId}`;
        this.evaluationCache.set(cacheKey, evaluation);
      }

      return evaluation?.enabled || false;
      
    } catch (err) {
      warn('Error evaluating feature flag, returning false', { 
        component: 'FeatureFlagsService', 
        flagId, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      });
      return false;
    }
  }

  public async getAllFlags(): Promise<FeatureFlag[]> {
    if (!this.initialized) {
      await this.initializeFlags();
    }
    return Array.from(this.flags.values());
  }

  public async getFlag(flagId: string): Promise<FeatureFlag | null> {
    if (!this.initialized) {
      await this.initializeFlags();
    }
    
    const flag = this.flags.get(flagId);
    if (flag) {
      return flag;
    }
    
    // If flag not found, try to get it by name (backwards compatibility)
    for (const [name, flagData] of this.flags) {
      if (name === flagId) {
        return flagData;
      }
    }
    
    return null;
  }

  public async getFlagByName(flagName: string): Promise<FeatureFlag | null> {
    if (!this.initialized) {
      await this.initializeFlags();
    }
    
    // Search by flag name in the stored flags
    for (const [id, flag] of this.flags) {
      if (flag.name === flagName) {
        return flag;
      }
    }
    
    return null;
  }

  public async createFlag(flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const flagRef = doc(collection(db, 'featureFlags'));
      const now = new Date();
      
      const newFlag: Omit<FeatureFlag, 'id'> = {
        ...flag,
        createdAt: now,
        updatedAt: now
      };

      await setDoc(flagRef, {
        ...newFlag,
        createdAt: now,
        updatedAt: now
      });

      info('Feature flag created', { 
        component: 'FeatureFlagsService', 
        flagId: flagRef.id, 
        flagName: flag.name 
      });

      return flagRef.id;
    } catch (err) {
      error('Failed to create feature flag', err as Error, { 
        component: 'FeatureFlagsService', 
        flagName: flag.name 
      });
      throw err;
    }
  }

  public async updateFlag(flagId: string, updates: Partial<FeatureFlag>): Promise<void> {
    try {
      const flagRef = doc(db, 'featureFlags', flagId);
      
      await updateDoc(flagRef, {
        ...updates,
        updatedAt: new Date()
      });

      info('Feature flag updated', { 
        component: 'FeatureFlagsService', 
        flagId, 
        updates: Object.keys(updates) 
      });

    } catch (err) {
      error('Failed to update feature flag', err as Error, { 
        component: 'FeatureFlagsService', 
        flagId 
      });
      throw err;
    }
  }

  public async deleteFlag(flagId: string): Promise<void> {
    try {
      await doc(db, 'featureFlags', flagId);
      
      info('Feature flag deleted', { 
        component: 'FeatureFlagsService', 
        flagId 
      });

    } catch (err) {
      error('Failed to delete feature flag', err as Error, { 
        component: 'FeatureFlagsService', 
        flagId 
      });
      throw err;
    }
  }

  // Advanced evaluation methods

  private async evaluateFlag(flagId: string, userId?: string, context?: any): Promise<FeatureFlagEvaluation | null> {
    let flag = this.flags.get(flagId);
    
    // If not found by ID, try to find by name
    if (!flag) {
      for (const [id, f] of this.flags) {
        if (f.name === flagId) {
          flag = f;
          break;
        }
      }
    }
    
    if (!flag) {
      return {
        flagId,
        userId: userId || 'anonymous',
        enabled: false,
        reason: 'Flag not found',
        timestamp: new Date()
      };
    }

    // If flag is globally disabled
    if (!flag.enabled) {
      return {
        flagId,
        userId: userId || 'anonymous',
        enabled: false,
        reason: 'Flag globally disabled',
        timestamp: new Date()
      };
    }

    // Check target users
    if (userId && flag.targetUsers && flag.targetUsers.length > 0) {
      if (flag.targetUsers.includes(userId)) {
        return {
          flagId,
          userId,
          enabled: true,
          reason: 'User in target list',
          timestamp: new Date()
        };
      } else {
        return {
          flagId,
          userId,
          enabled: false,
          reason: 'User not in target list',
          timestamp: new Date()
        };
      }
    }

    // Check conditions
    if (flag.conditions && context) {
      const conditionResult = this.evaluateConditions(flag.conditions, context);
      if (!conditionResult.passed) {
        return {
          flagId,
          userId: userId || 'anonymous',
          enabled: false,
          reason: `Condition failed: ${conditionResult.reason}`,
          timestamp: new Date()
        };
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const hash = this.hashUserId(userId || 'anonymous', flagId);
      const enabled = hash < flag.rolloutPercentage;
      
      return {
        flagId,
        userId: userId || 'anonymous',
        enabled,
        reason: enabled ? `In rollout (${flag.rolloutPercentage}%)` : `Not in rollout (${flag.rolloutPercentage}%)`,
        timestamp: new Date()
      };
    }

    // Default: enabled
    return {
      flagId,
      userId: userId || 'anonymous',
      enabled: true,
      reason: 'Flag enabled for all users',
      timestamp: new Date()
    };
  }

  private evaluateConditions(conditions: NonNullable<FeatureFlag['conditions']>, context: any): { passed: boolean; reason: string } {
    // Check version constraints
    if (conditions.minVersion && context.version) {
      if (this.compareVersions(context.version, conditions.minVersion) < 0) {
        return { passed: false, reason: `Version ${context.version} < ${conditions.minVersion}` };
      }
    }

    if (conditions.maxVersion && context.version) {
      if (this.compareVersions(context.version, conditions.maxVersion) > 0) {
        return { passed: false, reason: `Version ${context.version} > ${conditions.maxVersion}` };
      }
    }

    // Check platform
    if (conditions.platform && context.platform) {
      if (!conditions.platform.includes(context.platform)) {
        return { passed: false, reason: `Platform ${context.platform} not in allowed list` };
      }
    }

    // Check region
    if (conditions.region && context.region) {
      if (!conditions.region.includes(context.region)) {
        return { passed: false, reason: `Region ${context.region} not in allowed list` };
      }
    }

    // Check user type
    if (conditions.userType && context.userType) {
      if (!conditions.userType.includes(context.userType)) {
        return { passed: false, reason: `User type ${context.userType} not in allowed list` };
      }
    }

    return { passed: true, reason: 'All conditions passed' };
  }

  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }
    
    return 0;
  }

  private hashUserId(userId: string, flagId: string): number {
    // Simple hash function for consistent rollout
    const str = `${userId}:${flagId}`;
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash) % 100;
  }

  private clearEvaluationCache(flagId?: string): void {
    if (flagId) {
      // Clear cache entries for specific flag
      const keysToDelete: string[] = [];
      for (const [key] of this.evaluationCache) {
        if (key.startsWith(`${flagId}:`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.evaluationCache.delete(key));
    } else {
      // Clear all cache
      this.evaluationCache.clear();
    }
  }

  private notifyFlagUpdate(flagId: string): void {
    const listener = this.listeners.get(flagId);
    if (listener) {
      listener();
    }
  }

  // Event listeners
  public onFlagUpdate(flagId: string, callback: () => void): () => void {
    this.listeners.set(flagId, callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(flagId);
    };
  }

  // Utility methods for React hooks
  public async getMultipleFlags(flagIds: string[], userId?: string, context?: any): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    await Promise.all(
      flagIds.map(async (flagId) => {
        results[flagId] = await this.isEnabled(flagId, userId, context);
      })
    );
    
    return results;
  }

  // Analytics and monitoring
  public async logFlagEvaluation(evaluation: FeatureFlagEvaluation): Promise<void> {
    try {
      // Store evaluation in analytics collection for monitoring
      const analyticsRef = doc(collection(db, 'analytics'));
      await setDoc(analyticsRef, {
        eventType: 'feature_flag_evaluated',
        flagId: evaluation.flagId,
        userId: evaluation.userId,
        enabled: evaluation.enabled,
        reason: evaluation.reason,
        timestamp: evaluation.timestamp
      });
    } catch (err) {
      // Don't fail if analytics logging fails
      warn('Failed to log feature flag evaluation', { 
        component: 'FeatureFlagsService', 
        flagId: evaluation.flagId 
      });
    }
  }
}

// Create singleton instance
export const featureFlagsService = new FeatureFlagsService();

// Export default service
export default featureFlagsService;

// Types for React hooks
export interface UseFeatureFlagOptions {
  userId?: string;
  context?: any;
  pollInterval?: number;
}

export interface UseFeatureFlagsOptions extends UseFeatureFlagOptions {
  flags: string[];
}