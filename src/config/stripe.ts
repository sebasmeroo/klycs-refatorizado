/**
 * Stripe Configuration
 * Price IDs for subscription plans
 */

export const STRIPE_PRICE_IDS = {
  FREE: 'price_1SG4luLI966WBNFGY9HUIdhP',
  PRO: 'price_1SG4nOLI966WBNFGSHBfj4GB',
  BUSINESS: 'price_1SG4o7LI966WBNFG67tvhEM6',
} as const;

export const STRIPE_PLAN_LABELS = {
  FREE: 'Klycs Free',
  PRO: 'Klycs Pro',
  BUSINESS: 'Klycs Business',
} as const;

export type StripePlanKey = keyof typeof STRIPE_PRICE_IDS;
export type StripePriceId = typeof STRIPE_PRICE_IDS[StripePlanKey];

/**
 * Resolve plan key from a Stripe price identifier.
 * Falls back to FREE for unknown/legacy values to avoid breaking access.
 */
export function getPlanKeyFromPriceId(priceId?: string | null): StripePlanKey {
  if (!priceId) {
    return 'FREE';
  }

  const match = (Object.entries(STRIPE_PRICE_IDS) as Array<[StripePlanKey, StripePriceId]>)
    .find(([, id]) => id === priceId);

  return match ? match[0] : 'FREE';
}

/**
 * Human-friendly plan label for UI copy.
 */
export function getPlanLabel(priceId?: string | null): string {
  const planKey = getPlanKeyFromPriceId(priceId);
  return STRIPE_PLAN_LABELS[planKey];
}

/**
 * Check if price ID belongs to our configured plans.
 */
export function isValidPriceId(priceId?: string | null): priceId is StripePriceId {
  if (!priceId) return false;
  return Object.values(STRIPE_PRICE_IDS).includes(priceId as StripePriceId);
}
