import * as admin from 'firebase-admin';
import {logger} from 'firebase-functions';
import Stripe from 'stripe';
import {getStripeClient} from './stripeClient';
import {
  saveSubscriptionRecord,
  queryCustomerByStripeId,
} from './firestore';
import {StripeSubscriptionRecord} from './types';

// Lazy initialization to avoid calling admin.auth() before admin.initializeApp()
const getAuth = () => admin.auth();

type PlanLabel = 'FREE' | 'PRO' | 'BUSINESS';

const BUSINESS_PRICE_IDS = new Set([
  'price_1SG4o7LI966WBNFG67tvhEM6', // Business mensual
]);

const PRO_PRICE_IDS = new Set([
  'price_1SG4nOLI966WBNFGSHBfj4GB', // Pro mensual
]);

const BUSINESS_AMOUNT_HINTS = new Set([4000, 30000, 29999]);
const PRO_AMOUNT_HINTS = new Set([999, 1000, 9999, 10000]);

const ACTIVE_STATUSES = new Set(['active', 'trialing', 'past_due']);

const resolvePlanLabel = (record: Partial<StripeSubscriptionRecord>): PlanLabel => {
  const priceId = record.priceId ?? undefined;

  if (priceId && BUSINESS_PRICE_IDS.has(priceId)) {
    return 'BUSINESS';
  }

  if (priceId && PRO_PRICE_IDS.has(priceId)) {
    return 'PRO';
  }

  const amount = typeof record.amountDue === 'number'
    ? record.amountDue
    : Number(record.amountDue);

  if (Number.isFinite(amount)) {
    const rounded = Math.round(amount as number);

    if (BUSINESS_AMOUNT_HINTS.has(rounded) || rounded >= 25000) {
      return 'BUSINESS';
    }

    if (PRO_AMOUNT_HINTS.has(rounded) || (rounded >= 900 && rounded < 4000)) {
      return 'PRO';
    }
  }

  return 'FREE';
};

const getPlanPriority = (plan: PlanLabel): number => {
  switch (plan) {
    case 'BUSINESS':
      return 3;
    case 'PRO':
      return 2;
    default:
      return 1;
  }
};

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

interface SubscriptionAnalysis {
  doc: FirebaseFirestore.QueryDocumentSnapshot;
  data: StripeSubscriptionRecord;
  planName: PlanLabel;
  priority: number;
  periodEndMs: number;
  status: string;
  cancelAtPeriodEnd: boolean;
}

interface ReconcileResult {
  winner: SubscriptionAnalysis | null;
  superseded: string[];
}

const reconcileUserSubscriptions = async (
    customerDoc: FirebaseFirestore.QueryDocumentSnapshot,
    stripe: Stripe,
): Promise<ReconcileResult> => {
  const snapshot = await customerDoc.ref.collection('subscriptions').get();

  if (snapshot.empty) {
    return {winner: null, superseded: []};
  }

  const analyses: SubscriptionAnalysis[] = snapshot.docs.map((doc) => {
    const data = doc.data() as StripeSubscriptionRecord;
    const planName = resolvePlanLabel(data);
    const priority = getPlanPriority(planName);
    const periodEndMs = typeof data.currentPeriodEnd?.toMillis === 'function'
      ? data.currentPeriodEnd.toMillis()
      : 0;

    return {
      doc,
      data,
      planName,
      priority,
      periodEndMs,
      status: data.status || 'unknown',
      cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
    };
  });

  const activeAnalyses = analyses.filter((analysis) => ACTIVE_STATUSES.has(analysis.status));

  const sorted = (activeAnalyses.length > 0 ? activeAnalyses : analyses)
      .sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return b.periodEndMs - a.periodEndMs;
      });

  const winner = sorted[0] ?? null;

  const superseded: string[] = [];

  for (const analysis of analyses) {
    const isWinner = winner ? analysis.doc.id === winner.doc.id : false;
    const updatePayload: FirebaseFirestore.UpdateData = {
      resolvedPlan: analysis.planName,
      resolvedPlanPriority: analysis.priority,
      lastReconciledAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (isWinner) {
      updatePayload.superseded = admin.firestore.FieldValue.delete();
      updatePayload.supersededBy = admin.firestore.FieldValue.delete();
      updatePayload.supersededAt = admin.firestore.FieldValue.delete();
    } else {
      updatePayload.superseded = true;
      updatePayload.supersededBy = winner?.doc.id ?? null;
      updatePayload.supersededAt = admin.firestore.FieldValue.serverTimestamp();
      superseded.push(analysis.doc.id);
    }

    await analysis.doc.ref.set(updatePayload, {merge: true});

    if (!isWinner && ACTIVE_STATUSES.has(analysis.status) && !analysis.cancelAtPeriodEnd) {
      try {
        await stripe.subscriptions.update(analysis.doc.id, {
          cancel_at_period_end: true,
        });
        logger.info('Scheduled cancellation for superseded subscription', {
          subscriptionId: analysis.doc.id,
          supersededBy: winner?.doc.id,
        });
      } catch (error) {
        logger.warn('Failed to schedule cancellation for superseded subscription', {
          subscriptionId: analysis.doc.id,
          supersededBy: winner?.doc.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  if (superseded.length > 0 && winner) {
    logger.info('Superseded duplicate subscriptions detected', {
      customerId: customerDoc.id,
      winner: winner.doc.id,
      superseded,
    });
  }

  return {winner, superseded};
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

  const reconcileResult = await reconcileUserSubscriptions(customerDoc, stripe);
  const winner = reconcileResult.winner;

  const effectiveRecord = winner?.data ?? data;
  const planName = winner?.planName ?? resolvePlanLabel(data);
  const status = winner?.status ?? currentSubscription.status;
  const priceIdForClaim = effectiveRecord.priceId ?? data.priceId ?? 'free';

  const isActive = status === 'active' || status === 'trialing' || status === 'past_due';
  const isPastDue = status === 'past_due';

  const newClaims = {
    ...existingClaims,
    stripeActive: isActive,
    stripePastDue: isPastDue,
    plan: priceIdForClaim,
  };

  await auth.setCustomUserClaims(userId, newClaims);

  const db = admin.firestore();
  await db.collection('users').doc(userId).update({
    plan: planName,
    stripeActive: isActive,
    stripePastDue: isPastDue,
    subscriptionStatus: status,
    activeSubscriptionId: winner?.doc.id ?? currentSubscription.id,
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

  // ✅ MEJORADO: NO borrar inmediatamente, solo marcar como cancelada
  // El usuario mantiene acceso hasta el final del período de facturación
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Actualizar el registro pero NO borrarlo
  await saveSubscriptionRecord(userId, subscriptionId, {
    ...mapSubscription(userId, customerId, subscription),
  });

  // ✅ Solo quitar acceso si la suscripción está completamente cancelada
  // (no si tiene cancel_at_period_end=true, porque aún tiene acceso)
  if (subscription.status === 'canceled' && !subscription.cancel_at_period_end) {
    // Verificar si quedan otras suscripciones activas
    const remainingSubs = await customerDoc.ref.collection('subscriptions')
        .where('status', 'in', ['active', 'trialing', 'past_due'])
        .limit(1)
        .get();

    if (remainingSubs.empty) {
      const auth = getAuth();
      await auth.setCustomUserClaims(userId, {
        ...(await auth.getUser(userId).then((user) => user.customClaims || {})),
        stripeActive: false,
        stripePastDue: false,
        plan: 'free',
      });

      // También actualizar el documento del usuario
      const db = admin.firestore();
      await db.collection('users').doc(userId).update({
        plan: 'FREE',
        stripeActive: false,
        stripePastDue: false,
        subscriptionStatus: 'canceled',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
};

