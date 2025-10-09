import {HttpsError} from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import {CallableRequest} from 'firebase-functions/v2/https';
import {getStripeClient} from './stripeClient';
import {saveCustomerRecord, getCustomerDocRef} from './firestore';
import {StripeCustomerRecord, StripeRequestContext} from './types';

// Lazy initialization to avoid calling admin.auth() before admin.initializeApp()
const getAuth = () => admin.auth();

const buildCustomerMetadata = (request: CallableRequest<any>): StripeRequestContext => {
  const uid = request.auth?.uid;
  if (!uid || !request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  return {
    uid,
    email: request.auth.token.email,
    name: request.auth.token.name,
  };
};

export const ensureStripeCustomer = async (
    request: CallableRequest<{metadata?: Record<string, string>}>
) => {
  const context = buildCustomerMetadata(request);
  const stripe = getStripeClient();

  const customerDoc = await getCustomerDocRef(context.uid).get();
  if (customerDoc.exists) {
    return customerDoc.data() as StripeCustomerRecord;
  }

  const params: Stripe.CustomerCreateParams = {
    email: context.email,
    name: context.name,
    metadata: {
      firebaseUID: context.uid,
      ...request.data?.metadata,
    },
  };

  const customer = await stripe.customers.create(params);

  const now = admin.firestore.Timestamp.now();
  await saveCustomerRecord(context.uid, {
    stripeCustomerId: customer.id,
    createdAt: now,
    updatedAt: now,
    metadata: customer.metadata ?? undefined,
  });

  return {
    userId: context.uid,
    stripeCustomerId: customer.id,
    createdAt: now,
    updatedAt: now,
    metadata: customer.metadata ?? undefined,
  } satisfies StripeCustomerRecord;
};

export const createBillingPortalSession = async (
    request: CallableRequest<{returnUrl: string}>
) => {
  const context = buildCustomerMetadata(request);
  const stripe = getStripeClient();

  const customerDoc = await getCustomerDocRef(context.uid).get();
  if (!customerDoc.exists) {
    throw new HttpsError('failed-precondition', 'Stripe customer not found');
  }

  const customer = customerDoc.data() as StripeCustomerRecord;
  if (!request.data?.returnUrl) {
    throw new HttpsError('invalid-argument', 'returnUrl is required');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripeCustomerId,
    return_url: request.data.returnUrl,
  });

  return {url: session.url};
};

export const createCheckoutSession = async (
    request: CallableRequest<{ priceId: string; successUrl: string; cancelUrl: string; trialDays?: number; metadata?: Record<string, string>; mode?: Stripe.Checkout.SessionCreateParams.Mode; allowPromotionCodes?: boolean; }>
) => {
  const context = buildCustomerMetadata(request);
  const stripe = getStripeClient();

  const customerDoc = await getCustomerDocRef(context.uid).get();
  if (!customerDoc.exists) {
    throw new HttpsError('failed-precondition', 'Stripe customer not found');
  }

  const customer = customerDoc.data() as StripeCustomerRecord;

  const {
    priceId,
    successUrl,
    cancelUrl,
    trialDays,
    metadata,
    mode = 'subscription',
    allowPromotionCodes = false,
  } = request.data || {} as any;

  if (!priceId || !successUrl || !cancelUrl) {
    throw new HttpsError('invalid-argument', 'priceId, successUrl and cancelUrl are required');
  }

  const params: Stripe.Checkout.SessionCreateParams = {
    mode,
    customer: customer.stripeCustomerId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: allowPromotionCodes,
    customer_update: {
      address: 'auto',
      name: 'auto',
    },
    subscription_data: mode === 'subscription' && trialDays ? {
      trial_period_days: trialDays,
      metadata,
    } : undefined,
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    metadata: {
      firebaseUID: context.uid,
      ...metadata,
    },
  };

  const session = await stripe.checkout.sessions.create(params);

  return { url: session.url, sessionId: session.id };
};

export const revokeStripeCustomer = async (uid: string) => {
  const stripe = getStripeClient();
  const customerDoc = await getCustomerDocRef(uid).get();
  if (!customerDoc.exists) {
    return;
  }

  const data = customerDoc.data() as StripeCustomerRecord;

  await stripe.customers.update(data.stripeCustomerId, {
    metadata: {
      ...data.metadata,
      deletedAt: new Date().toISOString(),
    },
  });

  await getCustomerDocRef(uid).delete();
  const auth = getAuth();
  await auth.setCustomUserClaims(uid, {
    ...((await auth.getUser(uid)).customClaims || {}),
    plan: 'free',
    stripeActive: false,
  });
};

