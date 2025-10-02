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
import { db } from '@/lib/firebase';
import { logger } from '@/utils/logger';

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
  metric: 'cards_created' | 'views' | 'bookings' | 'storage_mb';
  quantity: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class SubscriptionsService {
  private readonly STRIPE_API_URL = 'https://api.stripe.com/v1';
  private readonly stripeSecretKey = process.env.VITE_STRIPE_SECRET_KEY;

  // Planes predefinidos - OPTIMIZADOS
  private readonly DEFAULT_PLANS: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'FREE',
      description: 'Perfecto para empezar - Tarjeta digital básica',
      price: 0,
      currency: 'eur',
      interval: 'month',
      intervalCount: 1,
      features: [
        '1 tarjeta digital',
        'Perfil básico (nombre, bio, foto)',
        '3 enlaces básicos',
        '5 redes sociales',
        'Portfolio: 3 imágenes',
        'Compresión automática',
        'Analytics: Solo visitas totales',
        'URL pública: klycs.com/tunombre',
        'Límite: 100 visitas/mes',
        '⚠️ Marca "Powered by Klycs"'
      ],
      stripePriceId: undefined,
      isActive: true,
      sortOrder: 1
    },
    {
      name: 'PRO',
      description: 'Para profesionales independientes - Portfolio completo + Analytics + Reservas',
      price: 9.99,
      currency: 'eur',
      interval: 'month',
      intervalCount: 1,
      features: [
        '✅ Todo lo de FREE +',
        '📸 Portfolio: 30 imágenes + 10 videos',
        '🎨 5 diseños modernos de enlaces',
        '📊 Analytics completo con clicks por enlace',
        '📅 Sistema de reservas (100/mes)',
        '🎨 Edición avanzada de diseño',
        '🎯 SEO: Meta tags personalizables',
        '🌐 Dominio personalizado',
        '❌ Sin marca Klycs',
        '20+ templates prediseñados',
        'Soporte prioritario 24h'
      ],
      stripePriceId: 'price_professional_monthly',
      isActive: true,
      sortOrder: 2
    },
    {
      name: 'BUSINESS',
      description: 'Para equipos y empresas - Calendario CRM + API + White-label',
      price: 29.99,
      currency: 'eur',
      interval: 'month',
      intervalCount: 1,
      features: [
        '✅ Todo lo de PRO +',
        '👥 Calendario colaborativo (10 profesionales)',
        '📅 Gestión de eventos + recurrencias',
        '💬 Comentarios y colaboración',
        '📊 Analytics avanzado con IA + Heatmaps',
        '💰 Reservas ilimitadas + Pagos Stripe',
        '📸 Portfolio ilimitado',
        '🔗 API REST + Webhooks',
        '🎨 Custom HTML/CSS/JS',
        '🏷️ White-label completo',
        '🔗 Integraciones: Zapier, CRM, etc',
        '100+ templates premium',
        'Soporte 24/7 + Onboarding'
      ],
      stripePriceId: 'price_enterprise_monthly',
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
      stripePriceId: 'price_professional_yearly',
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
      stripePriceId: 'price_business_yearly',
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
   * Crear suscripción para usuario
   */
  async createSubscription(
    userId: string,
    planId: string,
    stripeCustomerId: string,
    paymentMethodId?: string,
    trialDays?: number
  ): Promise<{ success: boolean; data?: UserSubscription; error?: string }> {
    try {
      if (!this.stripeSecretKey) {
        throw new Error('Stripe secret key not configured');
      }

      // Obtener plan
      const planDoc = await getDoc(doc(db, 'subscription_plans', planId));
      if (!planDoc.exists()) {
        throw new Error('Plan not found');
      }

      const plan = { id: planDoc.id, ...planDoc.data() } as SubscriptionPlan;

      // Si es plan gratuito, crear suscripción local sin Stripe
      if (plan.price === 0) {
        return await this.createFreeSubscription(userId, planId);
      }

      if (!plan.stripePriceId) {
        throw new Error('Plan does not have Stripe price ID');
      }

      // Crear suscripción en Stripe
      const subscriptionParams = new URLSearchParams({
        customer: stripeCustomerId,
        'items[0][price]': plan.stripePriceId,
        'payment_behavior': 'default_incomplete',
        'expand[]': 'latest_invoice.payment_intent',
        ...(paymentMethodId && { default_payment_method: paymentMethodId }),
        ...(trialDays && { trial_period_days: trialDays.toString() })
      });

      const response = await fetch(`${this.STRIPE_API_URL}/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: subscriptionParams
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create subscription');
      }

      const stripeSubscription = await response.json();

      // Guardar en Firestore
      const subscriptionData: Omit<UserSubscription, 'id'> = {
        userId: userId,
        planId,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId,
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        trialStart: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : undefined,
        trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : undefined,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = doc(collection(db, 'user_subscriptions'));
      await setDoc(docRef, subscriptionData);

      logger.info('Subscription created', { 
        userId: userId, 
        planId, 
        stripeSubscriptionId: stripeSubscription.id 
      });

      return {
        success: true,
        data: { id: docRef.id, ...subscriptionData }
      };

    } catch (error) {
      logger.error('Error creating subscription', { 
        userId: userId, 
        planId,
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create subscription'
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
      const q = query(
        collection(db, 'user_subscriptions'),
        where('userId', '==', userId),
        where('status', 'in', ['active', 'trialing', 'past_due'])
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return { success: false, error: 'No active subscription found' };
      }

      // Tomar la primera suscripción activa
      const subscriptionDoc = snapshot.docs[0];
      const subscription = { id: subscriptionDoc.id, ...subscriptionDoc.data() } as UserSubscription;

      // Obtener detalles del plan
      const planDoc = await getDoc(doc(db, 'subscription_plans', subscription.planId));
      if (!planDoc.exists()) {
        throw new Error('Plan not found');
      }

      const plan = { id: planDoc.id, ...planDoc.data() } as SubscriptionPlan;

      return { 
        success: true, 
        data: { ...subscription, plan } 
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
   * Cancelar suscripción
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subscriptionDoc = await getDoc(doc(db, 'user_subscriptions', subscriptionId));
      if (!subscriptionDoc.exists()) {
        throw new Error('Subscription not found');
      }

      const subscription = subscriptionDoc.data() as UserSubscription;

      // Si tiene Stripe subscription, cancelar en Stripe
      if (subscription.stripeSubscriptionId && this.stripeSecretKey) {
        const response = await fetch(`${this.STRIPE_API_URL}/subscriptions/${subscription.stripeSubscriptionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            prorate: 'false',
            ...(cancelAtPeriodEnd && { at_period_end: 'true' })
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to cancel subscription');
        }
      }

      // Actualizar en Firestore
      await updateDoc(doc(db, 'user_subscriptions', subscriptionId), {
        cancelAtPeriodEnd,
        canceledAt: new Date(),
        'metadata.cancelReason': reason || 'User requested',
        updatedAt: new Date()
      });

      logger.info('Subscription canceled', { 
        subscriptionId: subscriptionId, 
        cancelAtPeriodEnd, 
        reason 
      });

      return { success: true };

    } catch (error) {
      logger.error('Error canceling subscription', { 
        subscriptionId: subscriptionId,
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel subscription'
      };
    }
  }

  /**
   * Cambiar plan de suscripción
   */
  async changePlan(
    subscriptionId: string,
    newPlanId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subscriptionDoc = await getDoc(doc(db, 'user_subscriptions', subscriptionId));
      if (!subscriptionDoc.exists()) {
        throw new Error('Subscription not found');
      }

      const subscription = subscriptionDoc.data() as UserSubscription;

      // Obtener nuevo plan
      const newPlanDoc = await getDoc(doc(db, 'subscription_plans', newPlanId));
      if (!newPlanDoc.exists()) {
        throw new Error('New plan not found');
      }

      const newPlan = newPlanDoc.data() as SubscriptionPlan;

      // Si el nuevo plan es gratuito, cancelar suscripción de Stripe
      if (newPlan.price === 0) {
        if (subscription.stripeSubscriptionId) {
          await this.cancelSubscription(subscriptionId, false, 'Downgrade to free plan');
        }
        
        // Actualizar a plan gratuito
        await updateDoc(doc(db, 'user_subscriptions', subscriptionId), {
          planId: newPlanId,
          'metadata.downgradeTo': 'free',
          updatedAt: new Date()
        });

        return { success: true };
      }

      // Cambiar en Stripe si es una suscripción de pago
      if (subscription.stripeSubscriptionId && newPlan.stripePriceId && this.stripeSecretKey) {
        // Obtener suscripción actual de Stripe
        const stripeResponse = await fetch(`${this.STRIPE_API_URL}/subscriptions/${subscription.stripeSubscriptionId}`, {
          headers: {
            'Authorization': `Bearer ${this.stripeSecretKey}`,
          }
        });

        if (!stripeResponse.ok) {
          throw new Error('Failed to fetch current subscription from Stripe');
        }

        const stripeSubscription = await stripeResponse.json();
        const currentItemId = stripeSubscription.items.data[0].id;

        // Actualizar suscripción en Stripe
        const updateResponse = await fetch(`${this.STRIPE_API_URL}/subscriptions/${subscription.stripeSubscriptionId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            'items[0][id]': currentItemId,
            'items[0][price]': newPlan.stripePriceId,
            proration_behavior: 'create_prorations'
          })
        });

        if (!updateResponse.ok) {
          const error = await updateResponse.json();
          throw new Error(error.error?.message || 'Failed to update subscription');
        }
      }

      // Actualizar en Firestore
      await updateDoc(doc(db, 'user_subscriptions', subscriptionId), {
        planId: newPlanId,
        'metadata.upgradeFrom': subscription.planId,
        updatedAt: new Date()
      });

      logger.info('Subscription plan changed', { 
        subscriptionId: subscriptionId, 
        oldPlanId: subscription.planId, 
        newPlanId 
      });

      return { success: true };

    } catch (error) {
      logger.error('Error changing subscription plan', { 
        subscriptionId: subscriptionId, 
        newPlanId,
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to change plan'
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

    const snapshot = await getDocs(q);
    return snapshot.docs.reduce((total, doc) => {
      const data = doc.data() as UsageRecord;
      return total + data.quantity;
    }, 0);
  }

  private getFreePlanLimits(): Record<string, number> {
    return {
      cards_created: 1,
      views: 100, // Reducido de 1000 a 100
      bookings: 0, // Sin reservas en FREE
      storage_mb: 15, // 3 imágenes x ~5MB = 15MB
      portfolio_images: 3,
      portfolio_videos: 0,
      link_designs: 1, // Solo diseño Modern básico
      professionals: 0, // Sin calendario colaborativo
      analytics_export: 0 // Sin exportación
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
        views: 10000, // 10k visitas/mes
        bookings: 100, // 100 reservas/mes
        storage_mb: 200, // 30 imágenes + 10 videos ≈ 200MB
        portfolio_images: 30,
        portfolio_videos: 10,
        link_designs: 5, // Todos los diseños
        professionals: 0, // Sin calendario colaborativo
        analytics_export: 10 // 10 exportaciones/mes
      };
    }

    // Plan BUSINESS (mensual o anual)
    if (planName === 'business' || planName === 'business anual' || planName === 'empresa') {
      return {
        cards_created: 1, // Una sola tarjeta (pero más potente)
        views: Infinity, // Ilimitado
        bookings: Infinity, // Ilimitado
        storage_mb: 5000, // 5GB para imágenes/videos ilimitados
        portfolio_images: Infinity,
        portfolio_videos: Infinity,
        link_designs: 5, // Todos + custom CSS
        professionals: 10, // 10 profesionales en calendario
        analytics_export: Infinity // Exportaciones ilimitadas
      };
    }

    // Default: FREE
    return this.getFreePlanLimits();
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