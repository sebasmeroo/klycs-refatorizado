export interface StripeCustomerRecord {
  userId: string;
  stripeCustomerId: string;
  defaultPaymentMethod?: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  metadata?: Record<string, string>;
}

export interface StripeSubscriptionRecord {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
  planId: string | null;
  priceId: string | null;
  currentPeriodStart: FirebaseFirestore.Timestamp;
  currentPeriodEnd: FirebaseFirestore.Timestamp;
  cancelAtPeriodEnd: boolean;
  canceledAt?: FirebaseFirestore.Timestamp | null;
  trialStart?: FirebaseFirestore.Timestamp | null;
  trialEnd?: FirebaseFirestore.Timestamp | null;
  latestInvoiceId?: string | null;
  latestInvoiceStatus?: string | null;
  amountDue?: number | null;
  currency?: string | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionPayload {
  priceId: string;
  mode?: 'subscription' | 'payment';
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
  allowPromotionCodes?: boolean;
  metadata?: Record<string, string>;
}

export interface StripeRequestContext {
  uid: string;
  email?: string;
  name?: string;
}

