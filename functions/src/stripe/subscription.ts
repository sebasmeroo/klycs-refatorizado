import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import {getStripeClient} from './stripeClient';
import {
  saveSubscriptionRecord,
  deleteSubscriptionRecord,
  queryCustomerByStripeId,
} from './firestore';
import {StripeSubscriptionRecord} from './types';

// Lazy initialization to avoid calling admin.auth() before admin.initializeApp()
const getAuth = () => admin.auth();

const mapSubscription = (
    userId: string,
    customerId: string,
    subscription: Stripe.Subscription,
): Omit<StripeSubscriptionRecord, 'userId' | 'stripeSubscriptionId'> => {
  const firstItem = subscription.items.data[0];
  const price = firstItem?.price;

  return {
    stripeCustomerId: customerId,
    status: subscription.status,
    planId: price?.product ? String(price.product) : null,
    priceId: price?.id ?? null,
    currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: subscription.canceled_at ? admin.firestore.Timestamp.fromMillis(subscription.canceled_at * 1000) : undefined,
    trialStart: subscription.trial_start ? admin.firestore.Timestamp.fromMillis(subscription.trial_start * 1000) : undefined,
    trialEnd: subscription.trial_end ? admin.firestore.Timestamp.fromMillis(subscription.trial_end * 1000) : undefined,
    latestInvoiceId: typeof subscription.latest_invoice === 'string' ? subscription.latest_invoice : subscription.latest_invoice?.id ?? null,
    latestInvoiceStatus: typeof subscription.latest_invoice === 'object' && subscription.latest_invoice?.status ? subscription.latest_invoice.status : null,
    amountDue: subscription.items.data[0]?.price?.unit_amount ?? null,
    currency: subscription.items.data[0]?.price?.currency ?? null,
    createdAt: admin.firestore.Timestamp.fromMillis(subscription.created * 1000),
    updatedAt: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
    metadata: subscription.metadata,
  };
};

export const syncSubscription = async (
    subscriptionId: string,
    subscription?: Stripe.Subscription,
) => {
  const stripe = getStripeClient();
  const currentSubscription = subscription ?? await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['latest_invoice.payment_intent'],
  });

  const customerId = typeof currentSubscription.customer === 'string'
    ? currentSubscription.customer
    : currentSubscription.customer.id;

  const customerDoc = await queryCustomerByStripeId(customerId);

  if (!customerDoc) {
    return;
  }

  const userId = (customerDoc.data() as {userId?: string}).userId || customerDoc.id;

  const data = mapSubscription(userId, customerId, currentSubscription);

  await saveSubscriptionRecord(userId, currentSubscription.id, data);

  const auth = getAuth();
  const existingClaims = await auth.getUser(userId).then((user) => user.customClaims || {});
  const isActive = ['active', 'trialing', 'past_due'].includes(currentSubscription.status);

  // Mapear priceId a plan name (FREE, PRO, ENTERPRISE)
  let planName = 'FREE';
  if (data.priceId === 'price_1SG4nOLI966WBNFGSHBfj4GB') {
    planName = 'PRO';
  } else if (data.priceId === 'price_1SG4o7LI966WBNFG67tvhEM6') {
    planName = 'ENTERPRISE';
  }

  const newClaims = {
    ...existingClaims,
    stripeActive: isActive,
    plan: data.priceId,
  };

  await auth.setCustomUserClaims(userId, newClaims);

  // También actualizar el documento del usuario en Firestore
  const db = admin.firestore();
  await db.collection('users').doc(userId).update({
    plan: planName,
    stripeActive: isActive,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

export const removeSubscription = async (
    subscriptionId: string,
    customerId: string,
) => {
  const customerDoc = await queryCustomerByStripeId(customerId);
  if (!customerDoc) {
    return;
  }

  const userId = (customerDoc.data() as {userId?: string}).userId || customerDoc.id;
  await deleteSubscriptionRecord(userId, subscriptionId);

  // Opcional: resetear claim si no quedan suscripciones activas
  const remainingSubs = await customerDoc.ref.collection('subscriptions')
      .where('status', 'in', ['active', 'trialing', 'past_due'])
      .limit(1)
      .get();

  if (remainingSubs.empty) {
    const auth = getAuth();
    await auth.setCustomUserClaims(userId, {
      ...(await auth.getUser(userId).then((user) => user.customClaims || {})),
      stripeActive: false,
      plan: 'free',
    });

    // También actualizar el documento del usuario
    const db = admin.firestore();
    await db.collection('users').doc(userId).update({
      plan: 'FREE',
      stripeActive: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
};

