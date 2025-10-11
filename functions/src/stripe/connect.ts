import {CallableRequest, HttpsError} from 'firebase-functions/v2/https';
import {getStripeClient} from './stripeClient';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

type BusinessInfo = {
  type: 'individual' | 'company';
  email: string;
  country: string;
  business_name?: string;
  first_name?: string;
  last_name?: string;
};

type CreateAccountPayload = {
  businessInfo: BusinessInfo;
};

type OnboardingSessionPayload = {
  stripeAccountId: string;
  returnUrl: string;
  refreshUrl: string;
};

type PaymentIntentPayload = {
  stripeAccountId: string;
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string | number | null | undefined>;
};

type BalancePayload = {
  stripeAccountId: string;
};

type LoginLinkPayload = {
  stripeAccountId: string;
};

type SyncAccountPayload = {
  stripeAccountId: string;
};

type GetAccountPayload = Record<string, never>;

type SerializedStripeAccount = {
  id: string;
  userId: string;
  stripeAccountId: string;
  accountStatus: 'pending' | 'active' | 'restricted' | 'rejected';
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements: any;
  capabilities: any;
  business_profile: any;
  createdAt: string;
  updatedAt: string;
};

type SerializedConnectSession = {
  id: string;
  userId: string;
  stripeAccountId: string;
  url: string;
  expiresAt: string;
  createdAt: string;
};

const getDb = () => admin.firestore();

const assertAuthenticated = (request: CallableRequest<any>) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Authentication is required to use Stripe Connect.');
  }
  return uid;
};

const serializeTimestamp = (ts: FirebaseFirestore.Timestamp | Date): string => {
  if (ts instanceof admin.firestore.Timestamp) {
    return ts.toDate().toISOString();
  }
  return (ts as Date).toISOString();
};

const serializeAccountDoc = (doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot): SerializedStripeAccount => {
  const data = doc.data() as any;
  return {
    id: doc.id,
    userId: data.userId,
    stripeAccountId: data.stripeAccountId,
    accountStatus: data.accountStatus,
    chargesEnabled: data.chargesEnabled,
    payoutsEnabled: data.payoutsEnabled,
    detailsSubmitted: data.detailsSubmitted,
    requirements: data.requirements,
    capabilities: data.capabilities,
    business_profile: data.business_profile,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
};

const serializeSessionDoc = (doc: FirebaseFirestore.DocumentSnapshot): SerializedConnectSession => {
  const data = doc.data() as any;
  return {
    id: doc.id,
    userId: data.userId,
    stripeAccountId: data.stripeAccountId,
    url: data.url,
    expiresAt: serializeTimestamp(data.expiresAt),
    createdAt: serializeTimestamp(data.createdAt),
  };
};

export const createConnectAccount = async (
  request: CallableRequest<CreateAccountPayload>
) => {
  const uid = assertAuthenticated(request);
  const businessInfo = request.data?.businessInfo;

  if (!businessInfo) {
    throw new HttpsError('invalid-argument', 'businessInfo is required');
  }

  const db = getDb();
  const existing = await db.collection('stripe_accounts')
    .where('userId', '==', uid)
    .limit(1)
    .get();

  if (!existing.empty) {
    throw new HttpsError('already-exists', 'Stripe Connect account already exists');
  }

  const stripe = getStripeClient();

  const params: Stripe.AccountCreateParams = {
    type: 'express',
    country: businessInfo.country,
    email: businessInfo.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  };

  if (businessInfo.business_name) {
    params.business_profile = {
      ...(params.business_profile ?? {}),
      name: businessInfo.business_name,
    };
  }

  if (businessInfo.type === 'individual') {
    params.individual = {
      first_name: businessInfo.first_name,
      last_name: businessInfo.last_name,
    };
  }

  const account = await stripe.accounts.create(params);

  const now = admin.firestore.Timestamp.now();
  const docRef = await db.collection('stripe_accounts').add({
    userId: uid,
    stripeAccountId: account.id,
    accountStatus: account.details_submitted ? 'active' : 'pending',
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    requirements: account.requirements ?? {
      currently_due: [],
      eventually_due: [],
      past_due: [],
      pending_verification: [],
    },
    capabilities: account.capabilities ?? {},
    business_profile: account.business_profile ?? {},
    createdAt: now,
    updatedAt: now,
  });

  const accountDoc = await docRef.get();

  return {
    success: true,
    data: serializeAccountDoc(accountDoc),
  };
};

export const createConnectOnboardingSession = async (
  request: CallableRequest<OnboardingSessionPayload>
) => {
  const uid = assertAuthenticated(request);
  const {stripeAccountId, returnUrl, refreshUrl} = request.data || {} as OnboardingSessionPayload;

  if (!stripeAccountId || !returnUrl || !refreshUrl) {
    throw new HttpsError('invalid-argument', 'stripeAccountId, returnUrl and refreshUrl are required');
  }

  const stripe = getStripeClient();
  const session = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  const db = getDb();
  const now = admin.firestore.Timestamp.now();
  const docRef = await db.collection('stripe_onboarding_sessions').add({
    userId: uid,
    stripeAccountId,
    url: session.url,
    expiresAt: admin.firestore.Timestamp.fromMillis(session.expires_at * 1000),
    createdAt: now,
  });

  const storedSession = await docRef.get();

  return {
    success: true,
    data: serializeSessionDoc(storedSession),
  };
};

export const getConnectAccount = async (
  request: CallableRequest<GetAccountPayload>
) => {
  const uid = assertAuthenticated(request);
  const db = getDb();

  const snapshot = await db.collection('stripe_accounts')
    .where('userId', '==', uid)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return { success: false, error: 'No Stripe account found' };
  }

  return {
    success: true,
    data: serializeAccountDoc(snapshot.docs[0]),
  };
};

export const syncConnectAccountStatus = async (
  request: CallableRequest<SyncAccountPayload>
) => {
  assertAuthenticated(request);
  const {stripeAccountId} = request.data || {} as SyncAccountPayload;

  if (!stripeAccountId) {
    throw new HttpsError('invalid-argument', 'stripeAccountId is required');
  }

  const stripe = getStripeClient();
  const account = await stripe.accounts.retrieve(stripeAccountId);

  const db = getDb();
  const snapshot = await db.collection('stripe_accounts')
    .where('stripeAccountId', '==', stripeAccountId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new HttpsError('not-found', 'Account not found in database');
  }

  const docRef = snapshot.docs[0].ref;

  await docRef.update({
    accountStatus: account.details_submitted ? 'active' : 'pending',
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    requirements: account.requirements ?? {
      currently_due: [],
      eventually_due: [],
      past_due: [],
      pending_verification: [],
    },
    capabilities: account.capabilities ?? {},
    business_profile: account.business_profile ?? {},
    updatedAt: admin.firestore.Timestamp.now(),
  });

  const updatedDoc = await docRef.get();

  return {
    success: true,
    data: serializeAccountDoc(updatedDoc),
  };
};

export const getConnectAccountBalance = async (
  request: CallableRequest<BalancePayload>
) => {
  assertAuthenticated(request);
  const {stripeAccountId} = request.data || {} as BalancePayload;

  if (!stripeAccountId) {
    throw new HttpsError('invalid-argument', 'stripeAccountId is required');
  }

  const stripe = getStripeClient();
  const balance = await stripe.balance.retrieve({stripeAccount: stripeAccountId});

  return {
    success: true,
    data: {
      available: balance.available ?? [],
      pending: balance.pending ?? [],
    },
  };
};

export const createConnectPaymentIntent = async (
  request: CallableRequest<PaymentIntentPayload>
) => {
  const uid = assertAuthenticated(request);
  const {stripeAccountId, amount, currency = 'eur', description, metadata} = request.data || {} as PaymentIntentPayload;

  if (!stripeAccountId || !amount || amount <= 0) {
    throw new HttpsError('invalid-argument', 'stripeAccountId and positive amount are required');
  }

  const stripe = getStripeClient();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    description,
    metadata: {
      firebaseUID: uid,
      ...metadata,
    },
  }, {
    stripeAccount: stripeAccountId,
  });

  const db = getDb();
  const now = admin.firestore.Timestamp.now();
  const docRef = await db.collection('payment_intents').add({
    userId: uid,
    stripeAccountId,
    amount,
    currency,
    status: paymentIntent.status,
    clientSecret: paymentIntent.client_secret,
    description,
    metadata,
    createdAt: now,
    updatedAt: now,
  });

  const storedIntent = await docRef.get();
  const data = storedIntent.data() as any;

  return {
    success: true,
    data: {
      id: storedIntent.id,
      ...data,
      createdAt: serializeTimestamp(data.createdAt),
      updatedAt: serializeTimestamp(data.updatedAt),
    },
  };
};

export const createConnectDashboardLoginLink = async (
  request: CallableRequest<LoginLinkPayload>
) => {
  assertAuthenticated(request);
  const {stripeAccountId} = request.data || {} as LoginLinkPayload;

  if (!stripeAccountId) {
    throw new HttpsError('invalid-argument', 'stripeAccountId is required');
  }

  const stripe = getStripeClient();
  const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);

  return {
    success: true,
    data: {
      url: loginLink.url,
    },
  };
};
