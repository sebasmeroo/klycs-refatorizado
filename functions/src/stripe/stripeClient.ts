import Stripe from 'stripe';

let cachedClient: Stripe | null = null;

export const getStripeSecretKey = (): string => {
  const secret = process.env.STRIPE_SECRET_KEY;

  if (!secret) {
    throw new Error('Stripe secret key not configured');
  }

  return secret;
};

export const getStripeWebhookSecret = (): string | undefined => {
  return process.env.STRIPE_WEBHOOK_SECRET;
};

export const getStripeClient = (): Stripe => {
  if (cachedClient) {
    return cachedClient;
  }

  const secretKey = getStripeSecretKey();
  cachedClient = new Stripe(secretKey, {
    apiVersion: '2024-06-20',
    appInfo: {
      name: 'Klycs Platform',
    },
  });

  return cachedClient;
};

