import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { db } from '@/lib/firebase';
import { logger } from '@/utils/logger';
import { STRIPE_PRICE_IDS, getPlanKeyFromPriceId, StripePlanKey } from '@/config/stripe';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  intervalCount: number;
  features: string[];
  stripePriceId?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  metadata: {
    cancelReason?: string;
    upgradeFrom?: string;
    downgradeTo?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageRecord {
  id: string;
  userId: string;
  subscriptionId: string;
  metric:
    | 'cards_created'
    | 'views'
    | 'bookings'
    | 'storage_mb'
    | 'calendars'
    | 'professionals'
    | 'portfolio_images'
    | 'portfolio_videos'
    | 'link_designs'
    | 'analytics_export';
  quantity: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class SubscriptionsService {
  private readonly subscriptionCache = new Map<string, { data: UserSubscription & { plan: SubscriptionPlan }; expiresAt: number }>();
  private readonly subscriptionCacheTTL = 5 * 60 * 1000; // 5 minutes
  private readonly planCache = new Map<string, { data: SubscriptionPlan; expiresAt: number }>();
  private readonly planCacheTTL = 10 * 60 * 1000; // 10 minutes
  private readonly usageCache = new Map<string, { value: number; expiresAt: number }>();
  private readonly usageCacheTTL = 60 * 1000; // 60 seconds

  // Planes predefinidos - OPTIMIZADOS
  private readonly DEFAULT_PLANS: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'FREE',
      description: 'Perfecto para empezar - Solo creación de tarjeta',
      price: 0,
      currency: 'eur',
      interval: 'month',
      intervalCount: 1,
      features: [
        '1 tarjeta digital',
        'Perfil básico (nombre, bio, foto)',
        'Enlaces y redes sociales',
        'Portfolio básico',
        'URL pública: klycs.com/tunombre',
        '❌ Sin calendario',
        '❌ Sin reservas',
        '❌ Sin profesionales',
        '⚠️ Marca "Powered by Klycs"'
      ],
      stripePriceId: undefined,
      isActive: true,
      sortOrder: 1
    },
    {
      name: 'PRO',
      description: 'Para profesionales independientes - 1 Tarjeta + Calendario + Profesionales',
      price: 9.99,
      currency: 'eur',
      interval: 'month',
      intervalCount: 1,
      features: [
        '✅ Todo lo de FREE +',
        '1 tarjeta con gestión completa',
        '📅 1 calendario colaborativo',
        '👥 Hasta 15 profesionales por calendario',
        '📊 Analytics completo',
        '🎨 Edición avanzada de diseño',
        '💰 Sistema de reservas ilimitadas',
        '🎯 SEO: Meta tags personalizables',
        '🌐 Dominio personalizado',
        '❌ Sin marca Klycs',
        '20+ templates prediseñados',
        'Soporte prioritario 24h'
      ],
      stripePriceId: STRIPE_PRICE_IDS.PRO,
      isActive: true,
      sortOrder: 2
    },
    {
      name: 'BUSINESS',
      description: 'Para equipos y empresas - Tarjetas ilimitadas + Múltiples calendarios',
      price: 40.00,
      currency: 'eur',
      interval: 'month',
      intervalCount: 1,
      features: [
        '✅ Todo lo de PRO +',
        '🎴 Hasta 10 tarjetas digitales',
        '📅 Calendarios ilimitados',
        '👥 Profesionales ilimitados por calendario',
        '💬 Comentarios y colaboración avanzada',
        '📊 Analytics avanzado con IA + Heatmaps',
        '💰 Pagos Stripe integrados',
        '📸 Portfolio ilimitado',
        '🔗 API REST + Webhooks',
        '🎨 Custom HTML/CSS/JS',
        '🏷️ White-label completo',
        '🔗 Integraciones: Zapier, CRM, etc',
        '100+ templates premium',
        'Soporte 24/7 + Onboarding dedicado'
      ],
      stripePriceId: STRIPE_PRICE_IDS.BUSINESS,
      isActive: true,
      sortOrder: 3
    },
    {
      name: 'PRO Anual',
      description: 'Plan PRO con 20% descuento - 2 meses gratis',
      price: 99.99,
      currency: 'eur',
      interval: 'year',
      intervalCount: 1,
      features: [
        '✅ Todas las funcionalidades de PRO',
        '💰 Ahorro de €19.89/año (20% descuento)',
        '🎁 2 meses completamente gratis',
        '🚀 Migración gratuita',
        '⚡ Configuración prioritaria'
      ],
      stripePriceId: undefined,
      isActive: true,
      sortOrder: 4
    },
    {
      name: 'BUSINESS Anual',
      description: 'Plan BUSINESS con 17% descuento - Ahorra €60/año',
      price: 299.99,
      currency: 'eur',
      interval: 'year',
      intervalCount: 1,
      features: [
        '✅ Todas las funcionalidades de BUSINESS',
        '💰 Ahorro de €59.89/año (17% descuento)',
        '🎁 Casi 2 meses gratis',
        '🚀 Onboarding premium dedicado',
        '⚡ Migración de datos incluida',
        '🎯 Consultoría estratégica inicial'
      ],
      stripePriceId: undefined,
      isActive: true,
      sortOrder: 5
    }
  ];

  /**
   * Inicializar planes predeterminados
   */
  async initializeDefaultPlans(): Promise<{ success: boolean; error?: string }> {
    try {
      const plansCollection = collection(db, 'subscription_plans');
      
      for (const planData of this.DEFAULT_PLANS) {
        const docRef = doc(plansCollection);
        await setDoc(docRef, {
          ...planData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      logger.info('Default subscription plans initialized');
      return { success: true };

    } catch (error) {
      logger.error('Error initializing default plans', { 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize plans'
      };
    }
  }

  /**
   * Obtener todos los planes activos
   */
  async getActivePlans(): Promise<{ success: boolean; data?: SubscriptionPlan[]; error?: string }> {
    try {
      const q = query(
        collection(db, 'subscription_plans'),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const plans = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SubscriptionPlan));

      // Ordenar por sortOrder
      plans.sort((a, b) => a.sortOrder - b.sortOrder);

      return { success: true, data: plans };

    } catch (error) {
      logger.error('Error getting active plans', { 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get plans'
      };
    }
  }

  /**
   * Crear suscripción gratuita (sin Stripe)
   */
  private async createFreeSubscription(
    userId: string,
    planId: string
  ): Promise<{ success: boolean; data?: UserSubscription; error?: string }> {
    try {
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const subscriptionData: Omit<UserSubscription, 'id'> = {
        userId: userId,
        planId,
        stripeSubscriptionId: '', // No hay suscripción en Stripe
        stripeCustomerId: '',
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: nextMonth,
        cancelAtPeriodEnd: false,
        metadata: {},
        createdAt: now,
        updatedAt: now
      };

      const docRef = doc(collection(db, 'user_subscriptions'));
      await setDoc(docRef, subscriptionData);

      logger.info('Free subscription created', { userId, planId });

      return {
        success: true,
        data: { id: docRef.id, ...subscriptionData }
      };

    } catch (error) {
      logger.error('Error creating free subscription', { 
        userId: userId, 
        planId,
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create free subscription'
      };
    }
  }

  /**
   * Obtener suscripción actual del usuario
   */
  async getUserSubscription(userId: string): Promise<{ success: boolean; data?: UserSubscription & { plan: SubscriptionPlan }; error?: string }> {
    try {
      const cached = this.subscriptionCache.get(userId);
      if (cached && cached.expiresAt > Date.now()) {
        return { success: true, data: cached.data };
      }

      // Primero buscar en la subcollection de Stripe (nueva estructura)
      const stripeSubsRef = collection(db, `stripeCustomers/${userId}/subscriptions`);
      const stripeQuery = query(
        stripeSubsRef,
        where('status', 'in', ['active', 'trialing', 'past_due'])
      );

      const stripeSnapshot = await getDocs(stripeQuery);

      if (!stripeSnapshot.empty) {
        const prioritized = stripeSnapshot.docs
          .map(doc => {
            const data = doc.data();
            const planKey = this.resolveStripePlanKey(data);
            const periodEnd = data.currentPeriodEnd?.toDate?.()?.getTime?.() ?? 0;
            return {
              doc,
              data,
              planKey,
              priority: this.getPlanPriority(planKey),
              periodEnd
            };
          })
          .sort((a, b) => {
            if (b.priority !== a.priority) {
              return b.priority - a.priority;
            }
            return b.periodEnd - a.periodEnd;
          });

        const selected = prioritized[0];

        if (!selected) {
          throw new Error('No active Stripe subscriptions found');
        }

        const subscriptionDoc = selected.doc;
        const stripeSubData = selected.data;
        const planKey = selected.planKey;

        // Mapear datos de Stripe a UserSubscription
        const subscription: UserSubscription = {
          id: subscriptionDoc.id,
          userId: userId,
          planId: planKey.toLowerCase(),
          stripeSubscriptionId: stripeSubData.stripeSubscriptionId || '',
          stripeCustomerId: stripeSubData.stripeCustomerId || '',
          status: stripeSubData.status,
          currentPeriodStart: stripeSubData.currentPeriodStart?.toDate?.() || new Date(),
          currentPeriodEnd: stripeSubData.currentPeriodEnd?.toDate?.() || new Date(),
          cancelAtPeriodEnd: stripeSubData.cancelAtPeriodEnd || false,
          canceledAt: stripeSubData.canceledAt?.toDate?.(),
          trialStart: stripeSubData.trialStart?.toDate?.(),
          trialEnd: stripeSubData.trialEnd?.toDate?.(),
          metadata: stripeSubData.metadata || {},
          createdAt: stripeSubData.createdAt?.toDate?.() || new Date(),
          updatedAt: stripeSubData.updatedAt?.toDate?.() || new Date()
        };

        const plan: SubscriptionPlan = {
          id: planKey.toLowerCase(),
          name: planKey,
          description: `Plan ${planKey}`,
          price: stripeSubData.amountDue ? stripeSubData.amountDue / 100 : 0,
          currency: stripeSubData.currency || 'eur',
          interval: 'month',
          intervalCount: 1,
          features: [],
          isActive: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const payload = { ...subscription, plan } as UserSubscription & { plan: SubscriptionPlan };
        this.subscriptionCache.set(userId, {
          data: payload,
          expiresAt: Date.now() + this.subscriptionCacheTTL
        });

        return { success: true, data: payload };
      }

      // Fallback: buscar en la colección antigua user_subscriptions
      const q = query(
        collection(db, 'user_subscriptions'),
        where('userId', '==', userId),
        where('status', 'in', ['active', 'trialing', 'past_due'])
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        const freeSubscription = this.buildFreeSubscription(userId);
        this.subscriptionCache.set(userId, {
          data: freeSubscription,
          expiresAt: Date.now() + this.subscriptionCacheTTL
        });
        return { success: true, data: freeSubscription };
      }

      // Tomar la primera suscripción activa
      const subscriptionDoc = snapshot.docs[0];
      const subscription = { id: subscriptionDoc.id, ...subscriptionDoc.data() } as UserSubscription;

      // Obtener detalles del plan con cache
      const plan = await this.getPlan(subscription.planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      const payload = { ...subscription, plan } as UserSubscription & { plan: SubscriptionPlan };

      this.subscriptionCache.set(userId, {
        data: payload,
        expiresAt: Date.now() + this.subscriptionCacheTTL
      });

      return {
        success: true,
        data: payload
      };

    } catch (error) {
      logger.error('Error getting user subscription', { 
        userId: userId,
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get subscription'
      };
    }
  }

  /**
   * Registrar uso de una métrica
   */
  async recordUsage(
    userId: string,
    metric: UsageRecord['metric'],
    quantity: number = 1,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Obtener suscripción actual
      const subscriptionResult = await this.getUserSubscription(userId);
      if (!subscriptionResult.success || !subscriptionResult.data) {
        // Si no hay suscripción, crear registro de uso básico
        const usageData: Omit<UsageRecord, 'id'> = {
          userId: userId,
          subscriptionId: '',
          metric,
          quantity,
          timestamp: new Date(),
          metadata
        };

        const docRef = doc(collection(db, 'usage_records'));
        await setDoc(docRef, usageData);

        this.bumpUsageCache(userId, metric, quantity);
        return { success: true };
      }

      const subscription = subscriptionResult.data;

      const usageData: Omit<UsageRecord, 'id'> = {
        userId: userId,
        subscriptionId: subscription.id,
        metric,
        quantity,
        timestamp: new Date(),
        metadata
      };

      const docRef = doc(collection(db, 'usage_records'));
      await setDoc(docRef, usageData);

      logger.info('Usage recorded', { userId, metric, quantity });
      this.bumpUsageCache(userId, metric, quantity);

      return { success: true };

    } catch (error) {
      logger.error('Error recording usage', { 
        userId: userId, 
        metric, 
        quantity,
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record usage'
      };
    }
  }

  /**
   * Verificar límites del plan
   */
  async checkPlanLimits(
    userId: string,
    metric: UsageRecord['metric']
  ): Promise<{ 
    success: boolean; 
    data?: { 
      current: number; 
      limit: number; 
      canProceed: boolean; 
      plan: SubscriptionPlan 
    }; 
    error?: string 
  }> {
    try {
      const subscriptionResult = await this.getUserSubscription(userId);
      if (!subscriptionResult.success || !subscriptionResult.data) {
        // Usuario sin suscripción, aplicar límites del plan gratuito
        const freePlanLimits = this.getFreePlanLimits();
        const currentUsage = await this.getCurrentUsage(userId, metric);
        
        return {
          success: true,
          data: {
            current: currentUsage,
            limit: freePlanLimits[metric] || 0,
            canProceed: currentUsage < (freePlanLimits[metric] || 0),
            plan: subscriptionResult.data?.plan || {} as SubscriptionPlan
          }
        };
      }

      const subscription = subscriptionResult.data;
      const planLimits = this.getPlanLimits(subscription.plan);
      const currentUsage = await this.getCurrentUsage(userId, metric);

      return {
        success: true,
        data: {
          current: currentUsage,
          limit: planLimits[metric] || Infinity,
          canProceed: currentUsage < (planLimits[metric] || Infinity),
          plan: subscription.plan
        }
      };

    } catch (error) {
      logger.error('Error checking plan limits', { 
        userId: userId, 
        metric,
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check limits'
      };
    }
  }

  private async getCurrentUsage(userId: string, metric: UsageRecord['metric']): Promise<number> {
    const cacheKey = this.getUsageCacheKey(userId, metric);
    const cached = this.usageCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    // Obtener uso del período actual (último mes)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, 'usage_records'),
      where('userId', '==', userId),
      where('metric', '==', metric),
      where('timestamp', '>=', startOfMonth)
    );

    try {
      const snapshot = await getDocs(q);
      const total = snapshot.docs.reduce((sum, doc) => {
        const data = doc.data() as UsageRecord;
        return sum + data.quantity;
      }, 0);

      this.setUsageCache(userId, metric, total);
      return total;

    } catch (error) {
      const firebaseError = error as FirebaseError;

      if (firebaseError?.code === 'failed-precondition') {
        logger.warn('Missing Firestore index for usage_records query', {
          userId,
          metric,
          hint: 'Create composite index on usage_records (userId ==, metric ==, timestamp >=)'
        });
        return 0;
      }

      throw error;
    }
  }

  private getFreePlanLimits(): Record<string, number> {
    return {
      cards_created: 1,
      calendars: 0, // Sin calendarios en FREE
      views: 100,
      bookings: 0, // Sin reservas en FREE
      storage_mb: 15,
      portfolio_images: 3,
      portfolio_videos: 0,
      link_designs: 1,
      professionals: 0, // Sin profesionales en FREE
      analytics_export: 0
    };
  }

  private getPlanLimits(plan: SubscriptionPlan): Record<string, number> {
    // Definir límites basados en el plan actualizado
    const planName = plan.name.toLowerCase();

    // Plan FREE
    if (planName === 'free' || planName === 'básico') {
      return this.getFreePlanLimits();
    }

    // Plan PRO (mensual o anual)
    if (planName === 'pro' || planName === 'pro anual' || planName === 'profesional' || planName === 'profesional anual') {
      return {
        cards_created: 1, // Una sola tarjeta
        calendars: 1, // Un calendario
        views: 10000, // 10k visitas/mes
        bookings: Infinity, // Reservas ilimitadas
        storage_mb: 200, // 30 imágenes + 10 videos ≈ 200MB
        portfolio_images: 30,
        portfolio_videos: 10,
        link_designs: 5, // Todos los diseños
        professionals: 15, // Hasta 15 profesionales por calendario
        analytics_export: 10 // 10 exportaciones/mes
      };
    }

    // Plan BUSINESS (mensual o anual)
    if (
      planName === 'business' ||
      planName === 'business anual' ||
      planName === 'empresa' ||
      planName === 'enterprise' ||
      planName === 'enterprise anual'
    ) {
      return {
        cards_created: 10, // Hasta 10 tarjetas digitales
        calendars: Infinity, // Calendarios ilimitados
        views: Infinity, // Ilimitado
        bookings: Infinity, // Ilimitado
        storage_mb: 5000, // 5GB para imágenes/videos ilimitados
        portfolio_images: Infinity,
        portfolio_videos: Infinity,
        link_designs: 5, // Todos + custom CSS
        professionals: Infinity, // Profesionales ilimitados por calendario
        analytics_export: Infinity // Exportaciones ilimitadas
      };
    }

    // Default: FREE
    return this.getFreePlanLimits();
  }

  private resolveStripePlanKey(stripeSubData: any): StripePlanKey {
    let planKey = getPlanKeyFromPriceId(stripeSubData?.priceId);

    if (planKey !== 'FREE') {
      return planKey;
    }

    const metadataPlan = this.normalizePlanString(
      stripeSubData?.metadata?.plan ||
      stripeSubData?.metadata?.planName ||
      stripeSubData?.metadata?.tier
    );

    if (metadataPlan) {
      return metadataPlan;
    }

    const planIdHint = this.normalizePlanString(stripeSubData?.planId);
    if (planIdHint) {
      return planIdHint;
    }

    const amountHint = this.inferPlanFromAmount(
      stripeSubData?.amountDue ??
      stripeSubData?.amount_due ??
      stripeSubData?.price?.unit_amount
    );

    if (amountHint) {
      return amountHint;
    }

    return planKey;
  }

  private getPlanPriority(planKey: StripePlanKey): number {
    switch (planKey) {
      case 'BUSINESS':
        return 3;
      case 'PRO':
        return 2;
      default:
        return 1;
    }
  }

  private normalizePlanString(value: unknown): StripePlanKey | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim().toLowerCase();

    if (normalized.includes('business') || normalized.includes('enterprise')) {
      return 'BUSINESS';
    }

    if (normalized.includes('pro') || normalized.includes('profesional')) {
      return 'PRO';
    }

    if (normalized.includes('free') || normalized.includes('gratuito')) {
      return 'FREE';
    }

    return null;
  }

  private inferPlanFromAmount(amount: unknown): StripePlanKey | null {
    const numericAmount = typeof amount === 'number' ? amount : Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return null;
    }

    const rounded = Math.round(numericAmount);

    const businessAmounts = new Set([4000, 29999, 30000]);
    const proAmounts = new Set([999, 1000, 9999, 10000]);

    if (businessAmounts.has(rounded) || rounded >= 25000) {
      return 'BUSINESS';
    }

    if (proAmounts.has(rounded) || (rounded >= 900 && rounded < 4000)) {
      return 'PRO';
    }

    return null;
  }

  private buildFreeSubscription(userId: string): UserSubscription & { plan: SubscriptionPlan } {
    const now = new Date();
    const freePlan: SubscriptionPlan = {
      id: 'free',
      name: 'FREE',
      description: 'Plan gratuito',
      price: 0,
      currency: 'eur',
      interval: 'month',
      intervalCount: 1,
      features: [],
      isActive: true,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now
    };

    return {
      id: 'free-default',
      userId,
      planId: 'free',
      stripeSubscriptionId: '',
      stripeCustomerId: '',
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      metadata: {},
      createdAt: now,
      updatedAt: now,
      plan: freePlan
    };
  }

  private async getPlan(planId: string): Promise<SubscriptionPlan | null> {
    if (!planId) {
      return null;
    }

    const cached = this.planCache.get(planId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const planDoc = await getDoc(doc(db, 'subscription_plans', planId));
    if (!planDoc.exists()) {
      return null;
    }

    const plan = { id: planDoc.id, ...planDoc.data() } as SubscriptionPlan;
    this.planCache.set(planId, {
      data: plan,
      expiresAt: Date.now() + this.planCacheTTL
    });

    return plan;
  }

  private getUsageCacheKey(userId: string, metric: UsageRecord['metric']): string {
    return `${userId}:${metric}`;
  }

  private setUsageCache(userId: string, metric: UsageRecord['metric'], value: number) {
    this.usageCache.set(this.getUsageCacheKey(userId, metric), {
      value,
      expiresAt: Date.now() + this.usageCacheTTL
    });
  }

  private bumpUsageCache(userId: string, metric: UsageRecord['metric'], increment: number) {
    const key = this.getUsageCacheKey(userId, metric);
    const cached = this.usageCache.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      this.usageCache.set(key, {
        value: cached.value + increment,
        expiresAt: cached.expiresAt
      });
    }
  }

  /**
   * Procesar webhook de suscripción
   */
  async processSubscriptionWebhook(event: any): Promise<{ success: boolean; error?: string }> {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        default:
          logger.info('Unhandled subscription webhook event', { type: event.type });
      }

      return { success: true };

    } catch (error) {
      logger.error('Error processing subscription webhook', { 
        eventType: event.type,
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process webhook'
      };
    }
  }

  private async handleSubscriptionUpdated(subscription: any): Promise<void> {
    const q = query(
      collection(db, 'user_subscriptions'),
      where('stripeSubscriptionId', '==', subscription.id)
    );

    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        updatedAt: new Date()
      });
    }
  }

  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const q = query(
      collection(db, 'user_subscriptions'),
      where('stripeSubscriptionId', '==', subscription.id)
    );

    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, {
        status: 'canceled',
        canceledAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  private async handlePaymentSucceeded(invoice: any): Promise<void> {
    if (invoice.subscription) {
      const q = query(
        collection(db, 'user_subscriptions'),
        where('stripeSubscriptionId', '==', invoice.subscription)
      );

      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
          status: 'active',
          updatedAt: new Date()
        });
      }
    }
  }

  private async handlePaymentFailed(invoice: any): Promise<void> {
    if (invoice.subscription) {
      const q = query(
        collection(db, 'user_subscriptions'),
        where('stripeSubscriptionId', '==', invoice.subscription)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
          status: 'past_due',
          updatedAt: new Date()
        });
      }
    }
  }

}

export const subscriptionsService = new SubscriptionsService();
