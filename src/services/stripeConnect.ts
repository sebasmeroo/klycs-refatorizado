import {getFunctions, httpsCallable} from 'firebase/functions';
import {logger} from '@/utils/logger';

export type StripeConnectAccount = {
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

export type StripeConnectSession = {
  id: string;
  userId: string;
  stripeAccountId: string;
  url: string;
  expiresAt: string;
  createdAt: string;
};

export type StripeConnectPaymentIntent = {
  id: string;
  userId: string;
  stripeAccountId: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

class StripeConnectService {
  private readonly functions = getFunctions();

  private callable<TRequest, TResponse>(name: string) {
    return httpsCallable<TRequest, TResponse>(this.functions, name);
  }

  async createAccount(businessInfo: {
    type: 'individual' | 'company';
    email: string;
    country: string;
    business_name?: string;
    first_name?: string;
    last_name?: string;
  }): Promise<StripeConnectAccount> {
    const callable = this.callable<{businessInfo: typeof businessInfo}, {success: boolean; data?: StripeConnectAccount; error?: string}>
      ('stripeConnectCreateAccount');

    const {data} = await callable({businessInfo});

    if (!data.success || !data.data) {
      logger.error('Failed to create Stripe Connect account', { error: data.error });
      throw new Error(data.error || 'Failed to create Stripe Connect account');
    }

    return data.data;
  }

  async getAccount(): Promise<StripeConnectAccount | null> {
    const callable = this.callable<Record<string, never>, {success: boolean; data?: StripeConnectAccount; error?: string}>('stripeConnectGetAccount');
    const {data} = await callable({});

    if (!data.success || !data.data) {
      return null;
    }

    return data.data;
  }

  async createOnboardingSession(params: {stripeAccountId: string; returnUrl: string; refreshUrl: string;}): Promise<StripeConnectSession> {
    const callable = this.callable<typeof params, {success: boolean; data?: StripeConnectSession; error?: string}>
      ('stripeConnectCreateOnboardingSession');

    const {data} = await callable(params);

    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to create onboarding session');
    }

    return data.data;
  }

  async syncAccountStatus(stripeAccountId: string): Promise<StripeConnectAccount> {
    const callable = this.callable<{stripeAccountId: string}, {success: boolean; data?: StripeConnectAccount; error?: string}>
      ('stripeConnectSyncAccountStatus');

    const {data} = await callable({stripeAccountId});

    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to sync account status');
    }

    return data.data;
  }

  async getAccountBalance(stripeAccountId: string): Promise<{available: Array<{amount: number; currency: string}>; pending: Array<{amount: number; currency: string}>;}> {
    const callable = this.callable<{stripeAccountId: string}, {success: boolean; data?: {available: Array<{amount: number; currency: string}>; pending: Array<{amount: number; currency: string}>;}; error?: string}>
      ('stripeConnectGetBalance');

    const {data} = await callable({stripeAccountId});

    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch account balance');
    }

    return data.data;
  }

  async createPaymentIntent(params: {stripeAccountId: string; amount: number; currency?: string; description?: string; metadata?: Record<string, string | number | null | undefined>; }): Promise<StripeConnectPaymentIntent> {
    const callable = this.callable<typeof params, {success: boolean; data?: StripeConnectPaymentIntent; error?: string}>
      ('stripeConnectCreatePaymentIntent');

    const {data} = await callable(params);

    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to create payment intent');
    }

    return data.data;
  }

  async createDashboardLoginLink(stripeAccountId: string): Promise<string> {
    const callable = this.callable<{stripeAccountId: string}, {success: boolean; data?: {url: string}; error?: string}>
      ('stripeConnectCreateDashboardLoginLink');

    const {data} = await callable({stripeAccountId});

    if (!data.success || !data.data?.url) {
      throw new Error(data.error || 'Failed to create login link');
    }

    return data.data.url;
  }
}

export const stripeConnectService = new StripeConnectService();
