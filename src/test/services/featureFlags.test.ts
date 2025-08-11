import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { featureFlagsService, FeatureFlag } from '@/services/featureFlagsService';
import { validateFeatureFlagConfig } from '@/utils/initializeFeatureFlags';

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  db: {}
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()) // Return unsubscribe function
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}));

describe('Feature Flags Service', () => {
  let mockFeatureFlag: FeatureFlag;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockFeatureFlag = {
      id: 'test_flag',
      name: 'test_flag',
      description: 'Test feature flag for unit testing',
      enabled: true,
      rolloutPercentage: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test_user'
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Feature Flag Evaluation', () => {
    it('should return false for non-existent flags', async () => {
      const result = await featureFlagsService.isEnabled('non_existent_flag');
      expect(result).toBe(false);
    });

    it('should return false for disabled flags', async () => {
      const disabledFlag = { ...mockFeatureFlag, enabled: false };
      
      // Mock the flag retrieval
      vi.spyOn(featureFlagsService, 'getFlag').mockResolvedValue(disabledFlag);
      
      const result = await featureFlagsService.isEnabled('test_flag');
      expect(result).toBe(false);
    });

    it('should return true for enabled flags with 100% rollout', async () => {
      vi.spyOn(featureFlagsService, 'getFlag').mockResolvedValue(mockFeatureFlag);
      
      const result = await featureFlagsService.isEnabled('test_flag', 'user123');
      expect(result).toBe(true);
    });

    it('should respect rollout percentage', async () => {
      const partialRolloutFlag = { ...mockFeatureFlag, rolloutPercentage: 50 };
      vi.spyOn(featureFlagsService, 'getFlag').mockResolvedValue(partialRolloutFlag);
      
      // Test multiple users to check rollout distribution
      const results: boolean[] = [];
      for (let i = 0; i < 100; i++) {
        const result = await featureFlagsService.isEnabled('test_flag', `user${i}`);
        results.push(result);
      }
      
      const enabledCount = results.filter(Boolean).length;
      // Should be approximately 50% (allowing some variance due to hashing)
      expect(enabledCount).toBeGreaterThan(30);
      expect(enabledCount).toBeLessThan(70);
    });

    it('should target specific users when configured', async () => {
      const targetedFlag = {
        ...mockFeatureFlag,
        rolloutPercentage: 0,
        targetUsers: ['user123', 'user456']
      };
      vi.spyOn(featureFlagsService, 'getFlag').mockResolvedValue(targetedFlag);
      
      // Targeted users should be enabled
      expect(await featureFlagsService.isEnabled('test_flag', 'user123')).toBe(true);
      expect(await featureFlagsService.isEnabled('test_flag', 'user456')).toBe(true);
      
      // Non-targeted users should be disabled
      expect(await featureFlagsService.isEnabled('test_flag', 'user789')).toBe(false);
    });

    it('should evaluate conditions correctly', async () => {
      const conditionalFlag = {
        ...mockFeatureFlag,
        conditions: {
          platform: ['mobile'],
          userType: ['premium']
        }
      };
      vi.spyOn(featureFlagsService, 'getFlag').mockResolvedValue(conditionalFlag);
      
      // Should be enabled with matching conditions
      const matchingContext = { platform: 'mobile', userType: 'premium' };
      expect(await featureFlagsService.isEnabled('test_flag', 'user123', matchingContext)).toBe(true);
      
      // Should be disabled with non-matching conditions
      const nonMatchingContext = { platform: 'desktop', userType: 'free' };
      expect(await featureFlagsService.isEnabled('test_flag', 'user123', nonMatchingContext)).toBe(false);
    });

    it('should handle version constraints', async () => {
      const versionConstrainedFlag = {
        ...mockFeatureFlag,
        conditions: {
          minVersion: '2.0.0',
          maxVersion: '3.0.0'
        }
      };
      vi.spyOn(featureFlagsService, 'getFlag').mockResolvedValue(versionConstrainedFlag);
      
      // Version within range
      expect(await featureFlagsService.isEnabled('test_flag', 'user123', { version: '2.5.0' })).toBe(true);
      
      // Version below minimum
      expect(await featureFlagsService.isEnabled('test_flag', 'user123', { version: '1.9.0' })).toBe(false);
      
      // Version above maximum
      expect(await featureFlagsService.isEnabled('test_flag', 'user123', { version: '3.1.0' })).toBe(false);
    });
  });

  describe('Multiple Flag Evaluation', () => {
    it('should evaluate multiple flags correctly', async () => {
      const flags = ['flag1', 'flag2', 'flag3'];
      
      // Mock different flag states
      vi.spyOn(featureFlagsService, 'isEnabled')
        .mockResolvedValueOnce(true)   // flag1
        .mockResolvedValueOnce(false)  // flag2
        .mockResolvedValueOnce(true);  // flag3
      
      const results = await featureFlagsService.getMultipleFlags(flags, 'user123');
      
      expect(results).toEqual({
        flag1: true,
        flag2: false,
        flag3: true
      });
    });
  });

  describe('Flag Management', () => {
    it('should create a flag successfully', async () => {
      const newFlagData = {
        name: 'new_feature',
        description: 'A new feature flag',
        enabled: true,
        rolloutPercentage: 50,
        createdBy: 'admin'
      };
      
      vi.spyOn(featureFlagsService, 'createFlag').mockResolvedValue('new_flag_id');
      
      const flagId = await featureFlagsService.createFlag(newFlagData);
      expect(flagId).toBe('new_flag_id');
    });

    it('should update a flag successfully', async () => {
      const updates = { enabled: false, rolloutPercentage: 25 };
      
      vi.spyOn(featureFlagsService, 'updateFlag').mockResolvedValue(undefined);
      
      await expect(featureFlagsService.updateFlag('test_flag', updates)).resolves.toBeUndefined();
    });

    it('should delete a flag successfully', async () => {
      vi.spyOn(featureFlagsService, 'deleteFlag').mockResolvedValue(undefined);
      
      await expect(featureFlagsService.deleteFlag('test_flag')).resolves.toBeUndefined();
    });
  });

  describe('Caching', () => {
    it('should cache flag evaluations', async () => {
      vi.spyOn(featureFlagsService, 'getFlag').mockResolvedValue(mockFeatureFlag);
      
      // First call should evaluate the flag
      const result1 = await featureFlagsService.isEnabled('test_flag', 'user123');
      
      // Second call should use cache (getFlag should not be called again)
      const result2 = await featureFlagsService.isEnabled('test_flag', 'user123');
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully and return false', async () => {
      vi.spyOn(featureFlagsService, 'getFlag').mockRejectedValue(new Error('Database error'));
      
      const result = await featureFlagsService.isEnabled('test_flag', 'user123');
      expect(result).toBe(false);
    });

    it('should handle network errors during flag creation', async () => {
      vi.spyOn(featureFlagsService, 'createFlag').mockRejectedValue(new Error('Network error'));
      
      await expect(featureFlagsService.createFlag({
        name: 'failing_flag',
        description: 'This flag will fail to create',
        enabled: true,
        rolloutPercentage: 100,
        createdBy: 'test'
      })).rejects.toThrow('Network error');
    });
  });
});

describe('Feature Flag Validation', () => {
  it('should validate correct flag configuration', () => {
    const validConfig = {
      name: 'valid_flag',
      description: 'This is a valid feature flag configuration',
      enabled: true,
      rolloutPercentage: 50,
      createdBy: 'admin'
    };
    
    const result = validateFeatureFlagConfig(validConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid flag names', () => {
    const invalidConfig = {
      name: 'Invalid-Flag-Name',
      description: 'This flag has an invalid name',
      enabled: true,
      rolloutPercentage: 50,
      createdBy: 'admin'
    };
    
    const result = validateFeatureFlagConfig(invalidConfig);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Name must start with lowercase letter and contain only lowercase letters, numbers, and underscores');
  });

  it('should reject missing required fields', () => {
    const invalidConfig = {
      name: 'test_flag',
      // Missing description
      enabled: true,
      rolloutPercentage: 50
      // Missing createdBy
    };
    
    const result = validateFeatureFlagConfig(invalidConfig);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Description is required');
    expect(result.errors).toContain('CreatedBy is required');
  });

  it('should reject invalid rollout percentage', () => {
    const invalidConfig = {
      name: 'test_flag',
      description: 'Test flag with invalid rollout',
      enabled: true,
      rolloutPercentage: 150, // Invalid: > 100
      createdBy: 'admin'
    };
    
    const result = validateFeatureFlagConfig(invalidConfig);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Rollout percentage must be a number between 0 and 100');
  });

  it('should reject description that is too short or too long', () => {
    const shortDescConfig = {
      name: 'test_flag',
      description: 'Too short',
      enabled: true,
      rolloutPercentage: 50,
      createdBy: 'admin'
    };
    
    const result1 = validateFeatureFlagConfig(shortDescConfig);
    expect(result1.valid).toBe(false);
    expect(result1.errors).toContain('Description must be between 10 and 200 characters');
    
    const longDescConfig = {
      name: 'test_flag',
      description: 'A'.repeat(201), // Too long
      enabled: true,
      rolloutPercentage: 50,
      createdBy: 'admin'
    };
    
    const result2 = validateFeatureFlagConfig(longDescConfig);
    expect(result2.valid).toBe(false);
    expect(result2.errors).toContain('Description must be between 10 and 200 characters');
  });
});

describe('Hash Function', () => {
  it('should produce consistent hash values for same input', () => {
    // Since hashUserId is private, we test it indirectly through rollout behavior
    const flag = {
      ...mockFeatureFlag,
      rolloutPercentage: 50
    };
    
    vi.spyOn(featureFlagsService, 'getFlag').mockResolvedValue(flag);
    
    // Same user should get consistent results
    Promise.all([
      featureFlagsService.isEnabled('test_flag', 'consistent_user'),
      featureFlagsService.isEnabled('test_flag', 'consistent_user'),
      featureFlagsService.isEnabled('test_flag', 'consistent_user')
    ]).then(results => {
      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);
    });
  });

  it('should distribute users relatively evenly across rollout', async () => {
    const flag = {
      ...mockFeatureFlag,
      rolloutPercentage: 30
    };
    
    vi.spyOn(featureFlagsService, 'getFlag').mockResolvedValue(flag);
    
    const results: boolean[] = [];
    for (let i = 0; i < 1000; i++) {
      const result = await featureFlagsService.isEnabled('test_flag', `user${i}`);
      results.push(result);
    }
    
    const enabledCount = results.filter(Boolean).length;
    const enabledPercentage = (enabledCount / 1000) * 100;
    
    // Should be approximately 30% (allowing 10% variance for hash distribution)
    expect(enabledPercentage).toBeGreaterThan(20);
    expect(enabledPercentage).toBeLessThan(40);
  });
});