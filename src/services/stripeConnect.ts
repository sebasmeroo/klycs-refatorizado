import { logger } from '@/utils/logger';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface StripeAccount {
  id: string;
  userId: string;
  stripeAccountId: string;
  accountStatus: 'pending' | 'active' | 'restricted' | 'rejected';
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
  };
  capabilities: {
    card_payments?: 'active' | 'inactive' | 'pending';
    transfers?: 'active' | 'inactive' | 'pending';
  };
  business_profile: {
    name?: string;
    url?: string;
    support_email?: string;
    support_phone?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentIntent {
  id: string;
  userId: string;
  stripeAccountId: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  clientSecret: string;
  description?: string;
  metadata: {
    cardId?: string;
    serviceId?: string;
    bookingId?: string;
    customerEmail?: string;
    customerName?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectOnboardingSession {
  id: string;
  userId: string;
  stripeAccountId: string;
  url: string;
  expiresAt: Date;
  createdAt: Date;
}

class StripeConnectService {
  private readonly STRIPE_API_URL = 'https://api.stripe.com/v1';
  private readonly stripeSecretKey = process.env.VITE_STRIPE_SECRET_KEY;

  /**
   * Crear cuenta de Stripe Connect para un usuario
   */
  async createConnectAccount(userId: string, businessInfo: {
    type: 'individual' | 'company';
    email: string;
    country: string;
    business_name?: string;
    first_name?: string;
    last_name?: string;
  }): Promise<{ success: boolean; data?: StripeAccount; error?: string }> {
    try {
      if (!this.stripeSecretKey) {
        throw new Error('Stripe secret key not configured');
      }

      // Verificar si el usuario ya tiene una cuenta
      const existingAccount = await this.getUserStripeAccount(userId);
      if (existingAccount.success && existingAccount.data) {
        return {
          success: false,
          error: 'User already has a Stripe Connect account'
        };
      }

      // Crear cuenta en Stripe
      const accountResponse = await fetch(`${this.STRIPE_API_URL}/accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          type: 'express',
          country: businessInfo.country,
          email: businessInfo.email,
          ...(businessInfo.business_name && { 'business_profile[name]': businessInfo.business_name }),
          ...(businessInfo.first_name && { 'individual[first_name]': businessInfo.first_name }),
          ...(businessInfo.last_name && { 'individual[last_name]': businessInfo.last_name }),
          'capabilities[card_payments][requested]': 'true',
          'capabilities[transfers][requested]': 'true',
        })
      });

      if (!accountResponse.ok) {
        const error = await accountResponse.json();
        throw new Error(error.error?.message || 'Failed to create Stripe account');
      }

      const stripeAccount = await accountResponse.json();

      // Guardar en Firestore
      const accountData: Omit<StripeAccount, 'id'> = {
        userId,
        stripeAccountId: stripeAccount.id,
        accountStatus: stripeAccount.details_submitted ? 'active' : 'pending',
        chargesEnabled: stripeAccount.charges_enabled,
        payoutsEnabled: stripeAccount.payouts_enabled,
        detailsSubmitted: stripeAccount.details_submitted,
        requirements: stripeAccount.requirements || {
          currently_due: [],
          eventually_due: [],
          past_due: [],
          pending_verification: []
        },
        capabilities: stripeAccount.capabilities || {},
        business_profile: stripeAccount.business_profile || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = doc(collection(db, 'stripe_accounts'));
      await setDoc(docRef, accountData);

      logger.info('Stripe Connect account created', { 
        userId, 
        stripeAccountId: stripeAccount.id 
      });

      return {
        success: true,
        data: { id: docRef.id, ...accountData }
      };

    } catch (error) {
      logger.error('Error creating Stripe Connect account', { 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create account'
      };
    }
  }

  /**
   * Crear sesión de onboarding de Stripe Connect
   */
  async createOnboardingSession(
    userId: string,
    stripeAccountId: string,
    returnUrl: string,
    refreshUrl: string
  ): Promise<{ success: boolean; data?: ConnectOnboardingSession; error?: string }> {
    try {
      if (!this.stripeSecretKey) {
        throw new Error('Stripe secret key not configured');
      }

      const response = await fetch(`${this.STRIPE_API_URL}/account_links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          account: stripeAccountId,
          return_url: returnUrl,
          refresh_url: refreshUrl,
          type: 'account_onboarding'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create onboarding session');
      }

      const session = await response.json();

      // Guardar sesión en Firestore
      const sessionData: Omit<ConnectOnboardingSession, 'id'> = {
        userId,
        stripeAccountId,
        url: session.url,
        expiresAt: new Date(session.expires_at * 1000),
        createdAt: new Date()
      };

      const docRef = doc(collection(db, 'stripe_onboarding_sessions'));
      await setDoc(docRef, sessionData);

      logger.info('Stripe onboarding session created', { 
        userId, 
        stripeAccountId 
      });

      return {
        success: true,
        data: { id: docRef.id, ...sessionData }
      };

    } catch (error) {
      logger.error('Error creating onboarding session', { 
        userId, 
        stripeAccountId,
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create session'
      };
    }
  }

  /**
   * Crear intención de pago
   */
  async createPaymentIntent(
    stripeAccountId: string,
    amount: number,
    currency: string = 'eur',
    metadata: PaymentIntent['metadata'] = {},
    description?: string
  ): Promise<{ success: boolean; data?: PaymentIntent; error?: string }> {
    try {
      if (!this.stripeSecretKey) {
        throw new Error('Stripe secret key not configured');
      }

      const response = await fetch(`${this.STRIPE_API_URL}/payment_intents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Stripe-Account': stripeAccountId
        },
        body: new URLSearchParams({
          amount: (amount * 100).toString(), // Convertir a centavos
          currency,
          ...(description && { description }),
          'metadata[cardId]': metadata.cardId || '',
          'metadata[serviceId]': metadata.serviceId || '',
          'metadata[bookingId]': metadata.bookingId || '',
          'metadata[customerEmail]': metadata.customerEmail || '',
          'metadata[customerName]': metadata.customerName || ''
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create payment intent');
      }

      const paymentIntent = await response.json();

      // Guardar en Firestore
      const paymentData: Omit<PaymentIntent, 'id'> = {
        userId: metadata.cardId || '', // Deberías obtener esto del contexto
        stripeAccountId,
        amount: amount,
        currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
        description,
        metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = doc(collection(db, 'payment_intents'));
      await setDoc(docRef, paymentData);

      logger.info('Payment intent created', { 
        stripeAccountId, 
        amount, 
        currency 
      });

      return {
        success: true,
        data: { id: docRef.id, ...paymentData }
      };

    } catch (error) {
      logger.error('Error creating payment intent', { 
        stripeAccountId, 
        amount,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment intent'
      };
    }
  }

  /**
   * Obtener cuenta de Stripe de un usuario
   */
  async getUserStripeAccount(userId: string): Promise<{ success: boolean; data?: StripeAccount; error?: string }> {
    try {
      const q = query(
        collection(db, 'stripe_accounts'),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return { success: false, error: 'No Stripe account found' };
      }

      const doc = snapshot.docs[0];
      const data = { id: doc.id, ...doc.data() } as StripeAccount;

      return { success: true, data };

    } catch (error) {
      logger.error('Error getting user Stripe account', { 
        userId,
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get account'
      };
    }
  }

  /**
   * Actualizar estado de cuenta desde Stripe
   */
  async syncAccountStatus(stripeAccountId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.stripeSecretKey) {
        throw new Error('Stripe secret key not configured');
      }

      // Obtener datos actualizados de Stripe
      const response = await fetch(`${this.STRIPE_API_URL}/accounts/${stripeAccountId}`, {
        headers: {
          'Authorization': `Bearer ${this.stripeSecretKey}`,
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch account');
      }

      const stripeAccount = await response.json();

      // Buscar cuenta en Firestore
      const q = query(
        collection(db, 'stripe_accounts'),
        where('stripeAccountId', '==', stripeAccountId)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('Account not found in database');
      }

      const docRef = snapshot.docs[0].ref;

      // Actualizar en Firestore
      await updateDoc(docRef, {
        accountStatus: stripeAccount.details_submitted ? 'active' : 'pending',
        chargesEnabled: stripeAccount.charges_enabled,
        payoutsEnabled: stripeAccount.payouts_enabled,
        detailsSubmitted: stripeAccount.details_submitted,
        requirements: stripeAccount.requirements || {
          currently_due: [],
          eventually_due: [],
          past_due: [],
          pending_verification: []
        },
        capabilities: stripeAccount.capabilities || {},
        business_profile: stripeAccount.business_profile || {},
        updatedAt: new Date()
      });

      logger.info('Stripe account status synced', { stripeAccountId });

      return { success: true };

    } catch (error) {
      logger.error('Error syncing account status', { 
        stripeAccountId,
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync status'
      };
    }
  }

  /**
   * Obtener balance de la cuenta
   */
  async getAccountBalance(stripeAccountId: string): Promise<{ 
    success: boolean; 
    data?: { 
      available: { amount: number; currency: string }[];
      pending: { amount: number; currency: string }[];
    }; 
    error?: string 
  }> {
    try {
      if (!this.stripeSecretKey) {
        throw new Error('Stripe secret key not configured');
      }

      const response = await fetch(`${this.STRIPE_API_URL}/balance`, {
        headers: {
          'Authorization': `Bearer ${this.stripeSecretKey}`,
          'Stripe-Account': stripeAccountId
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch balance');
      }

      const balance = await response.json();

      return {
        success: true,
        data: {
          available: balance.available,
          pending: balance.pending
        }
      };

    } catch (error) {
      logger.error('Error getting account balance', { 
        stripeAccountId,
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get balance'
      };
    }
  }

  /**
   * Crear dashboard login link
   */
  async createDashboardLoginLink(stripeAccountId: string): Promise<{ 
    success: boolean; 
    data?: { url: string }; 
    error?: string 
  }> {
    try {
      if (!this.stripeSecretKey) {
        throw new Error('Stripe secret key not configured');
      }

      const response = await fetch(`${this.STRIPE_API_URL}/accounts/${stripeAccountId}/login_links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create login link');
      }

      const loginLink = await response.json();

      return {
        success: true,
        data: { url: loginLink.url }
      };

    } catch (error) {
      logger.error('Error creating dashboard login link', { 
        stripeAccountId,
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create login link'
      };
    }
  }

  /**
   * Procesar webhook de Stripe
   */
  async processWebhook(
    payload: string,
    _signature: string,
    _webhookSecret: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // En un entorno real, verificarías la firma del webhook aquí
      // const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      
      const event = JSON.parse(payload);

      switch (event.type) {
        case 'account.updated':
          await this.handleAccountUpdated(event.data.object);
          break;
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        default:
          logger.info('Unhandled webhook event', { type: event.type });
      }

      return { success: true };

    } catch (error) {
      logger.error('Error processing webhook', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process webhook'
      };
    }
  }

  private async handleAccountUpdated(account: any): Promise<void> {
    await this.syncAccountStatus(account.id);
  }

  private async handlePaymentSucceeded(paymentIntent: any): Promise<void> {
    // Actualizar payment intent en Firestore
    const q = query(
      collection(db, 'payment_intents'),
      where('stripeAccountId', '==', paymentIntent.id)
    );

    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, {
        status: 'succeeded',
        updatedAt: new Date()
      });
    }

    logger.info('Payment succeeded', { paymentIntentId: paymentIntent.id });
  }

  private async handlePaymentFailed(paymentIntent: any): Promise<void> {
    // Actualizar payment intent en Firestore
    const q = query(
      collection(db, 'payment_intents'),
      where('stripeAccountId', '==', paymentIntent.id)
    );

    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, {
        status: 'requires_payment_method',
        updatedAt: new Date()
      });
    }

    logger.info('Payment failed', { paymentIntentId: paymentIntent.id });
  }
}

export const stripeConnectService = new StripeConnectService();