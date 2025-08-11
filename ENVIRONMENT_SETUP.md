# Environment Setup Guide

This guide helps you configure the necessary environment variables for the Klycs application.

## Quick Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your actual values.

## Required Environment Variables

### Firebase Configuration
These are required for the app to function:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**How to get these values:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon → Project settings
4. Scroll down to "Your apps" and select your web app
5. Copy the config values

### Sentry Configuration (Optional but Recommended)
For error monitoring and performance tracking:

```env
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_SENTRY_ENVIRONMENT=development
VITE_SENTRY_RELEASE=1.0.0
```

**How to get these values:**
1. Create an account at [Sentry.io](https://sentry.io/)
2. Create a new project for React
3. Copy the DSN from the project settings
4. Set environment to match your deployment (`development`, `staging`, `production`)

## Firebase Firestore Rules Deployment

To deploy the updated Firestore rules for feature flags:

1. Install Firebase CLI if you haven't:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (if not done):
   ```bash
   firebase init
   ```

4. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Common Issues and Solutions

### 1. Firebase Analytics 403 Error
**Error:** `Failed to fetch this Firebase app's measurement ID from the server`

**Solution:** This is expected and already handled. The app uses local measurement ID configuration to prevent this error.

### 2. Feature Flags Permission Error
**Error:** `Missing or insufficient permissions`

**Solution:** 
1. Deploy the updated Firestore rules (see above)
2. Make sure your user ID is in the admin list in `firestore.rules` (line 159)

### 3. Sentry Not Working
**Error:** `Sentry DSN not provided - monitoring disabled`

**Solution:** Add `VITE_SENTRY_DSN` to your `.env` file with your actual Sentry DSN.

### 4. Service Worker Cache Errors
**Error:** `Failed to execute 'put' on 'Cache': Request method 'POST' is unsupported`

**Solution:** This has been fixed. The Service Worker now only caches GET requests.

## Development vs Production

### Development Environment
- All feature flags enabled
- Full error logging
- No rate limiting on Sentry
- Analytics tracking optional

### Production Environment
- Feature flags controlled by rollout percentage
- Error sampling enabled (10%)
- Sentry rate limiting enabled
- Analytics required for insights

## Security Notes

1. **Never commit `.env` files** - they contain sensitive information
2. **Use different Firebase projects** for development/staging/production
3. **Rotate API keys regularly** in production
4. **Monitor Sentry quotas** to avoid unexpected charges
5. **Review Firestore rules** before deployment

## Testing the Setup

After configuring your environment variables:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Check the browser console for:
   - ✅ Firebase initialized successfully
   - ✅ Feature flags service initialized (if admin)
   - ✅ Service Worker registered successfully
   - ⚠️ Sentry DSN not provided (if not configured)

3. Test feature flags (admin required):
   - Go to Developer Tools → Application → Local Storage
   - Feature flags should be cached there after first load

## Need Help?

- Check the browser console for specific error messages
- Review the Firebase Console for project configuration
- Verify Firestore rules are deployed correctly
- Ensure environment variables are properly formatted (no quotes needed in .env)

## Advanced Configuration

### Custom Feature Flags
Add custom feature flags in `src/config/featureFlags.ts`:

```typescript
{
  name: 'my_custom_feature',
  description: 'Description of my feature',
  enabled: false,
  rolloutPercentage: 0,
  conditions: {
    userType: ['premium']
  },
  createdBy: 'development_team'
}
```

### Performance Monitoring
Configure Web Vitals thresholds in `src/utils/performance.ts` if needed.

### Cache Configuration
Adjust Service Worker cache settings in `public/sw.js` if needed.