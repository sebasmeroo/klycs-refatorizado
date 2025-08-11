import { FeatureFlag } from '@/services/featureFlagsService';

// Default feature flags configuration
export const DEFAULT_FEATURE_FLAGS: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'enhanced_analytics',
    description: 'Enable enhanced analytics tracking and detailed user behavior insights',
    enabled: true,
    rolloutPercentage: 100,
    createdBy: 'system'
  },
  {
    name: 'advanced_caching',
    description: 'Enable advanced caching system for improved performance',
    enabled: true,
    rolloutPercentage: 100,
    createdBy: 'system'
  },
  {
    name: 'pwa_features',
    description: 'Enable Progressive Web App features including offline support and push notifications',
    enabled: true,
    rolloutPercentage: 100,
    createdBy: 'system'
  },
  {
    name: 'rate_limiting',
    description: 'Enable rate limiting protection for API calls and user actions',
    enabled: true,
    rolloutPercentage: 100,
    createdBy: 'system'
  },
  {
    name: 'security_monitoring',
    description: 'Enable enhanced security monitoring and threat detection',
    enabled: true,
    rolloutPercentage: 100,
    createdBy: 'system'
  },
  {
    name: 'card_themes_v2',
    description: 'Enable new card themes and customization options',
    enabled: false,
    rolloutPercentage: 10,
    conditions: {
      userType: ['premium', 'admin']
    },
    createdBy: 'product_team'
  },
  {
    name: 'ai_suggestions',
    description: 'Enable AI-powered content suggestions for cards',
    enabled: false,
    rolloutPercentage: 5,
    conditions: {
      userType: ['premium']
    },
    createdBy: 'product_team'
  },
  {
    name: 'social_sharing_v2',
    description: 'Enable enhanced social sharing capabilities',
    enabled: false,
    rolloutPercentage: 25,
    createdBy: 'product_team'
  },
  {
    name: 'advanced_booking',
    description: 'Enable advanced booking system with calendar integration',
    enabled: false,
    rolloutPercentage: 0,
    targetUsers: [], // Will be populated with beta users
    createdBy: 'product_team'
  },
  {
    name: 'mobile_app_promotion',
    description: 'Show mobile app download promotion',
    enabled: true,
    rolloutPercentage: 100,
    conditions: {
      platform: ['mobile']
    },
    createdBy: 'marketing_team'
  },
  {
    name: 'dark_mode_v2',
    description: 'Enable new dark mode implementation with better contrast',
    enabled: false,
    rolloutPercentage: 50,
    createdBy: 'design_team'
  },
  {
    name: 'performance_insights',
    description: 'Show performance insights dashboard to users',
    enabled: false,
    rolloutPercentage: 20,
    conditions: {
      userType: ['premium', 'admin']
    },
    createdBy: 'product_team'
  },
  {
    name: 'collaboration_features',
    description: 'Enable card collaboration and team features',
    enabled: false,
    rolloutPercentage: 0,
    conditions: {
      userType: ['premium', 'enterprise']
    },
    createdBy: 'product_team'
  },
  {
    name: 'custom_domains',
    description: 'Enable custom domain support for cards',
    enabled: false,
    rolloutPercentage: 0,
    conditions: {
      userType: ['enterprise']
    },
    createdBy: 'product_team'
  },
  {
    name: 'api_access',
    description: 'Enable API access for third-party integrations',
    enabled: false,
    rolloutPercentage: 0,
    conditions: {
      userType: ['enterprise', 'developer']
    },
    createdBy: 'product_team'
  }
];

// Feature flag categories for organization
export const FEATURE_FLAG_CATEGORIES = {
  INFRASTRUCTURE: ['enhanced_analytics', 'advanced_caching', 'pwa_features', 'rate_limiting', 'security_monitoring'],
  PRODUCT: ['card_themes_v2', 'ai_suggestions', 'social_sharing_v2', 'advanced_booking', 'dark_mode_v2', 'performance_insights'],
  COLLABORATION: ['collaboration_features', 'custom_domains', 'api_access'],
  MARKETING: ['mobile_app_promotion']
};

// User types for targeting
export const USER_TYPES = {
  FREE: 'free',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
  ADMIN: 'admin',
  DEVELOPER: 'developer'
};

// Platforms for targeting
export const PLATFORMS = {
  MOBILE: 'mobile',
  DESKTOP: 'desktop',
  TABLET: 'tablet'
};

// Helper function to get flags by category
export function getFlagsByCategory(category: keyof typeof FEATURE_FLAG_CATEGORIES): string[] {
  return FEATURE_FLAG_CATEGORIES[category] || [];
}

// Helper function to check if a flag is infrastructure-related
export function isInfrastructureFlag(flagId: string): boolean {
  return FEATURE_FLAG_CATEGORIES.INFRASTRUCTURE.includes(flagId);
}

// Helper function to get user context for feature flag evaluation
export function getUserContext(user?: any): any {
  if (!user) return {};

  return {
    userType: user.subscriptionType || USER_TYPES.FREE,
    userId: user.uid,
    registrationDate: user.createdAt,
    isVerified: user.emailVerified,
    region: user.region || 'unknown'
  };
}

// Default feature flag settings for different environments
export const ENVIRONMENT_OVERRIDES = {
  development: {
    // Enable all flags for testing in development
    overrides: {
      enabled: true,
      rolloutPercentage: 100
    }
  },
  staging: {
    // Enable most flags for staging testing
    overrides: {
      rolloutPercentage: 100
    }
  },
  production: {
    // Use default settings in production
    overrides: {}
  }
};

// Feature flag validation rules
export const VALIDATION_RULES = {
  name: {
    required: true,
    pattern: /^[a-z][a-z0-9_]*$/,
    message: 'Name must start with lowercase letter and contain only lowercase letters, numbers, and underscores'
  },
  description: {
    required: true,
    minLength: 10,
    maxLength: 200,
    message: 'Description must be between 10 and 200 characters'
  },
  rolloutPercentage: {
    min: 0,
    max: 100,
    message: 'Rollout percentage must be between 0 and 100'
  }
};

export default DEFAULT_FEATURE_FLAGS;