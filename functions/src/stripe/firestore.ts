import * as admin from 'firebase-admin';
import {StripeCustomerRecord, StripeSubscriptionRecord} from './types';

const CUSTOMERS_COLLECTION = 'stripeCustomers';

// Lazy initialization to avoid calling admin.firestore() before admin.initializeApp()
const getDb = () => admin.firestore();

export const getCustomerDocRef = (userId: string) => {
  return getDb().collection(CUSTOMERS_COLLECTION).doc(userId);
};

export const queryCustomerByStripeId = async (stripeCustomerId: string) => {
  const snapshot = await getDb().collection(CUSTOMERS_COLLECTION)
      .where('stripeCustomerId', '==', stripeCustomerId)
      .limit(1)
      .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0];
};

export const deleteCustomerRecord = async (userId: string) => {
  await getCustomerDocRef(userId).delete();
};

export const getSubscriptionCollectionRef = (userId: string) => {
  return getCustomerDocRef(userId).collection('subscriptions');
};

export const saveCustomerRecord = async (
    userId: string,
    data: Omit<StripeCustomerRecord, 'userId'>
): Promise<void> => {
  await getCustomerDocRef(userId).set({
    userId,
    ...data,
  }, {merge: true});
};

export const saveSubscriptionRecord = async (
    userId: string,
    subscriptionId: string,
    data: Omit<StripeSubscriptionRecord, 'userId' | 'stripeSubscriptionId'>
): Promise<void> => {
  const docRef = getSubscriptionCollectionRef(userId).doc(subscriptionId);

  // Remove undefined fields to avoid Firestore error
  const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
  );

  const payload = {
    userId,
    stripeSubscriptionId: subscriptionId,
    ...cleanedData,
  };

  await docRef.set(payload, {merge: true});
};

export const deleteSubscriptionRecord = async (userId: string, subscriptionId: string) => {
  await getSubscriptionCollectionRef(userId).doc(subscriptionId).delete();
};

