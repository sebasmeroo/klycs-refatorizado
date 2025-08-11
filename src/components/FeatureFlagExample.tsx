import React from 'react';
import { useFeatureFlag, useFeatureFlags, useFeatureFlagContext } from '@/hooks/useFeatureFlags';
import { getUserContext } from '@/config/featureFlags';

interface FeatureFlagExampleProps {
  user?: any;
}

/**
 * Example component demonstrating feature flag usage
 * This component shows different ways to use feature flags in React components
 */
export const FeatureFlagExample: React.FC<FeatureFlagExampleProps> = ({ user }) => {
  const { context } = useFeatureFlagContext();
  const userContext = getUserContext(user);
  
  // Single feature flag usage
  const { enabled: enhancedAnalytics, loading: analyticsLoading } = useFeatureFlag(
    'enhanced_analytics',
    { userId: user?.uid, context: { ...context, ...userContext } }
  );

  // Multiple feature flags usage
  const { flags, loading: flagsLoading, isEnabled } = useFeatureFlags({
    flags: ['card_themes_v2', 'ai_suggestions', 'social_sharing_v2', 'dark_mode_v2'],
    userId: user?.uid,
    context: { ...context, ...userContext }
  });

  if (analyticsLoading || flagsLoading) {
    return <div>Loading feature flags...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Feature Flags Demo</h2>
      
      {/* Single flag example */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Enhanced Analytics</h3>
        {enhancedAnalytics ? (
          <div className="p-4 bg-green-100 border border-green-300 rounded">
            ✅ Enhanced analytics is enabled! You can see detailed insights.
          </div>
        ) : (
          <div className="p-4 bg-gray-100 border border-gray-300 rounded">
            ❌ Enhanced analytics is disabled. Basic analytics only.
          </div>
        )}
      </div>

      {/* Multiple flags example */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Product Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card Themes V2 */}
          <div className={`p-4 rounded border ${isEnabled('card_themes_v2') ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'}`}>
            <h4 className="font-medium">Card Themes V2</h4>
            {isEnabled('card_themes_v2') ? (
              <p className="text-green-700">✅ New themes available!</p>
            ) : (
              <p className="text-gray-600">❌ Classic themes only</p>
            )}
          </div>

          {/* AI Suggestions */}
          <div className={`p-4 rounded border ${isEnabled('ai_suggestions') ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'}`}>
            <h4 className="font-medium">AI Suggestions</h4>
            {isEnabled('ai_suggestions') ? (
              <p className="text-green-700">✅ AI content suggestions enabled</p>
            ) : (
              <p className="text-gray-600">❌ Manual content creation only</p>
            )}
          </div>

          {/* Social Sharing V2 */}
          <div className={`p-4 rounded border ${isEnabled('social_sharing_v2') ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'}`}>
            <h4 className="font-medium">Social Sharing V2</h4>
            {isEnabled('social_sharing_v2') ? (
              <p className="text-green-700">✅ Enhanced sharing options</p>
            ) : (
              <p className="text-gray-600">❌ Basic sharing only</p>
            )}
          </div>

          {/* Dark Mode V2 */}
          <div className={`p-4 rounded border ${isEnabled('dark_mode_v2') ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'}`}>
            <h4 className="font-medium">Dark Mode V2</h4>
            {isEnabled('dark_mode_v2') ? (
              <p className="text-green-700">✅ New dark mode available</p>
            ) : (
              <p className="text-gray-600">❌ Classic dark mode</p>
            )}
          </div>

        </div>
      </div>

      {/* Context information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Context Information</h3>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <pre className="text-sm text-blue-800">
            {JSON.stringify({ ...context, ...userContext }, null, 2)}
          </pre>
        </div>
      </div>

      {/* Flag states */}
      <div>
        <h3 className="text-lg font-semibold mb-2">All Flag States</h3>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded">
          <pre className="text-sm text-gray-700">
            {JSON.stringify(flags, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default FeatureFlagExample;