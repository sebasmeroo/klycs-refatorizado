import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import {getStripeClient} from './stripeClient';
import {
  saveSubscriptionRecord,
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

  // ✅ MEJORADO: Manejo inteligente de estados
  // - 'active': Suscripción activa y pagada
  // - 'trialing': En período de prueba
  // - 'past_due': Pago falló, dar 7 días de gracia antes de bloquear
  const status = currentSubscription.status;
  let isActive = false;
  let isPastDue = false;

  if (status === 'active' || status === 'trialing') {
    isActive = true;
  } else if (status === 'past_due') {
    // ✅ GRACE PERIOD: Dar 7 días de gracia para que actualicen su tarjeta
    // Stripe reintenta automáticamente el cobro durante ~2 semanas
    isPastDue = true;
    isActive = true; // Mantener acceso durante grace period
  } else if (status === 'canceled' || status === 'unpaid') {
    isActive = false;
  }

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
    stripePastDue: isPastDue, // ✅ NUEVO: Flag para mostrar advertencia en UI
    plan: data.priceId,
  };

  await auth.setCustomUserClaims(userId, newClaims);

  // También actualizar el documento del usuario en Firestore
  const db = admin.firestore();
  await db.collection('users').doc(userId).update({
    plan: planName,
    stripeActive: isActive,
    stripePastDue: isPastDue, // ✅ NUEVO: Permite mostrar banner de advertencia
    subscriptionStatus: status, // ✅ NUEVO: Guardar estado completo
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

