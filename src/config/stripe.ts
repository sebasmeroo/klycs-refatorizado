/**
 * Stripe Configuration
 * Price IDs for subscription plans
 */

export const STRIPE_PRICE_IDS = {
  FREE: 'price_1SG4luLI966WBNFGY9HUIdhP',
  PRO: 'price_1SG4nOLI966WBNFGSHBfj4GB',
  ENTERPRISE: 'price_1SG4o7LI966WBNFG67tvhEM6',
} as const;

export const STRIPE_PLAN_NAMES = {
  [STRIPE_PRICE_IDS.FREE]: 'Klycs Free',
  [STRIPE_PRICE_IDS.PRO]: 'Klycs Pro',
  [STRIPE_PRICE_IDS.ENTERPRISE]: 'Klycs Enterprise',
} as const;

export type StripePriceId = typeof STRIPE_PRICE_IDS[keyof typeof STRIPE_PRICE_IDS];

/**
 * Get plan name from price ID
 */
export function getPlanName(priceId: string): string {
  return STRIPE_PLAN_NAMES[priceId as StripePriceId] || 'Unknown Plan';
}

/**
 * Check if price ID is valid
 */
export function isValidPriceId(priceId: string): priceId is StripePriceId {
  return Object.values(STRIPE_PRICE_IDS).includes(priceId as StripePriceId);
}
