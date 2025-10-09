import React from 'react';
import { Check, X, Sparkles, Zap, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { STRIPE_PRICE_IDS } from '@/config/stripe';
import { toast } from '@/utils/toast';
import { useAuth } from '@/hooks/useAuth';

interface PlanFeature {
  text: string;
  included: boolean;
}

type BillingCycle = 'monthly' | 'annual';

type PlanId = 'free' | 'pro' | 'business';

interface Plan {
  id: PlanId;
  tierLabel: string;
  description: string;
  price: number;
  priceLabel: string;
  priceNote?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  gradientFrom: string;
  gradientTo: string;
  features: PlanFeature[];
  cta: string;
  popular?: boolean;
}

const BASE_FEATURES: Record<PlanId, PlanFeature[]> = {
  free: [
    { text: '✅ 1 tarjeta digital', included: true },
    { text: '✅ Perfil básico (nombre, bio, foto)', included: true },
    { text: '✅ Enlaces y redes sociales', included: true },
    { text: '✅ Portfolio básico (3 imágenes)', included: true },
    { text: '❌ Sin calendario', included: false },
    { text: '❌ Sin reservas', included: false },
    { text: '❌ Sin profesionales', included: false },
    { text: '⚠️ Marca "Powered by Klycs"', included: false }
  ],
  pro: [
    { text: '✅ Todo lo de FREE +', included: true },
    { text: '📅 1 calendario colaborativo', included: true },
    { text: '👥 Profesionales ilimitados en tu calendario', included: true },
    { text: '💰 Reservas ilimitadas', included: true },
    { text: '📊 Analytics completo', included: true },
    { text: '🎨 Edición avanzada de diseño', included: true },
    { text: '🎯 SEO personalizable', included: true },
    { text: '🌐 Dominio personalizado', included: true },
    { text: '❌ Sin marca Klycs', included: true }
  ],
  business: [
    { text: '✅ Todo lo de PRO +', included: true },
    { text: '🎴 Tarjetas ilimitadas', included: true },
    { text: '📅 Calendarios ilimitados', included: true },
    { text: '👥 Profesionales ilimitados por calendario', included: true },
    { text: '💬 Comentarios y colaboración avanzada', included: true },
    { text: '📊 Analytics avanzado con IA + Heatmaps', included: true },
    { text: '🔗 API REST + Webhooks', included: true },
    { text: '🎨 Custom HTML/CSS/JS', included: true },
    { text: '🏷️ White-label + Onboarding', included: true }
  ]
};

const PLAN_MATRIX: Record<BillingCycle, Plan[]> = {
  monthly: [
    {
      id: 'free',
      tierLabel: 'FREE',
      description: 'Perfecto para empezar',
      price: 0,
      priceLabel: 'Gratis',
      icon: Sparkles,
      iconColor: 'text-gray-600',
      gradientFrom: 'from-gray-500',
      gradientTo: 'to-gray-600',
      features: BASE_FEATURES.free,
      cta: 'Comenzar Gratis'
    },
    {
      id: 'pro',
      tierLabel: 'PRO',
      description: 'Para profesionales independientes',
      price: 9.99,
      priceLabel: '€9.99',
      icon: Zap,
      iconColor: 'text-blue-600',
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-purple-600',
      popular: true,
      features: BASE_FEATURES.pro,
      cta: 'Elegir plan PRO'
    },
    {
      id: 'business',
      tierLabel: 'BUSINESS',
      description: 'Para equipos y empresas',
      price: 40,
      priceLabel: '€40',
      icon: Rocket,
      iconColor: 'text-purple-600',
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-pink-600',
      features: BASE_FEATURES.business,
      cta: 'Elegir plan BUSINESS'
    }
  ],
  annual: [
    {
      id: 'free',
      tierLabel: 'FREE',
      description: 'Perfecto para empezar',
      price: 0,
      priceLabel: 'Gratis',
      icon: Sparkles,
      iconColor: 'text-gray-600',
      gradientFrom: 'from-gray-500',
      gradientTo: 'to-gray-600',
      features: BASE_FEATURES.free,
      cta: 'Comenzar Gratis'
    },
    {
      id: 'pro',
      tierLabel: 'PRO',
      description: 'Plan PRO con 20% de descuento',
      price: 99.99,
      priceLabel: '€99.99',
      priceNote: 'Pagas una vez al año',
      icon: Zap,
      iconColor: 'text-blue-600',
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-purple-600',
      popular: true,
      features: [
        ...BASE_FEATURES.pro,
        { text: '🎁 2 meses gratis (+20% descuento)', included: true },
        { text: '🚀 Migración gratuita', included: true }
      ],
      cta: 'Elegir plan anual PRO'
    },
    {
      id: 'business',
      tierLabel: 'BUSINESS',
      description: 'Plan BUSINESS con 17% de descuento',
      price: 299.99,
      priceLabel: '€299.99',
      priceNote: 'Pagas una vez al año',
      icon: Rocket,
      iconColor: 'text-purple-600',
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-pink-600',
      features: [
        ...BASE_FEATURES.business,
        { text: '🎁 Casi 2 meses gratis', included: true },
        { text: '👩‍💼 Onboarding premium dedicado', included: true }
      ],
      cta: 'Elegir plan anual BUSINESS'
    }
  ]
};

interface PricingSectionProps {
  isDark?: boolean;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ isDark = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>('monthly');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handlePlanClick = async (plan: Plan) => {
    // Plan gratuito: redirigir a registro
    if (plan.id === 'free') {
      navigate('/register');
      return;
    }

    // Si no está autenticado, redirigir a registro con el plan seleccionado
    if (!user?.uid) {
      const params = new URLSearchParams({
        plan: plan.id,
        billing: billingCycle
      });
      navigate(`/register?${params.toString()}`);
      return;
    }

    // Usuario autenticado: iniciar proceso de pago con Stripe
    setIsProcessing(true);
    try {
      const functions = getFunctions();

      // 1. Asegurar que existe el customer en Stripe
      const ensureCustomer = httpsCallable(functions, 'stripeEnsureCustomer');
      await ensureCustomer();

      // 2. Obtener el Price ID correcto
      const priceId = plan.id === 'pro' ? STRIPE_PRICE_IDS.PRO : STRIPE_PRICE_IDS.ENTERPRISE;

      // 3. Crear sesión de checkout
      const createCheckout = httpsCallable(functions, 'stripeCreateCheckoutSession');
      const { data } = await createCheckout({
        priceId,
        successUrl: `${window.location.origin}/settings?success=true`,
        cancelUrl: `${window.location.origin}/?canceled=true`,
      }) as { data: { url: string } };

      // 4. Redirigir a Stripe Checkout usando la URL
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error('No se pudo obtener la URL de pago');
      }
    } catch (error: any) {
      console.error('Error al crear checkout:', error);
      toast.error(error.message || 'Error al procesar el pago. Intenta de nuevo.');
      setIsProcessing(false);
    }
  };

  const bgPrimary = isDark ? 'bg-[#05070f]' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const textMuted = isDark ? 'text-gray-500' : 'text-gray-500';
  const cardBg = isDark ? 'bg-[#0b1220]' : 'bg-gray-50';
  const cardBorder = isDark ? 'border-white/10' : 'border-gray-200';

  return (
    <section className={`py-24 px-4 sm:px-6 lg:px-8 ${bgPrimary}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${textMuted} mb-4`}>
            PRECIOS SIMPLES Y TRANSPARENTES
          </p>
          <h2 className={`text-4xl sm:text-5xl font-bold ${textPrimary} mb-4`}>
            Elige el plan perfecto para ti
          </h2>
          <p className={`text-lg ${textSecondary} max-w-2xl mx-auto`}>
            Desde crear tu primera tarjeta hasta gestionar equipos completos con calendarios ilimitados
          </p>
          <p className={`text-sm ${textMuted} mt-2`}>
            Todos los precios + IVA según tu país
          </p>

          <div className="mt-8 inline-flex items-center rounded-full border border-white/10 bg-white/10 backdrop-blur px-1 py-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Anual <span className="ml-1 text-xs text-emerald-400">ahorra hasta 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PLAN_MATRIX[billingCycle].map((plan) => {
            const Icon = plan.icon;
            const isPopular = plan.popular;

            return (
              <div
                key={`${plan.id}-${billingCycle}`}
                className={`relative rounded-3xl border-2 ${
                  isPopular
                    ? 'border-blue-500 shadow-2xl shadow-blue-500/20'
                    : `${cardBorder}`
                } ${cardBg} p-8 transition-all duration-300 hover:scale-105 hover:shadow-xl`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-4 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold rounded-full shadow-lg">
                      <Sparkles className="w-3 h-3" />
                      MÁS POPULAR
                    </span>
                  </div>
                )}

                <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${plan.gradientFrom} ${plan.gradientTo} mb-6`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className={`text-2xl font-bold ${textPrimary} mb-2`}>
                  {plan.tierLabel}
                </h3>
                <p className={`text-sm ${textSecondary} mb-6`}>
                  {plan.description}
                </p>

                <div className="mb-8">
                  {plan.price === 0 ? (
                    <div className={`text-4xl font-bold ${textPrimary}`}>
                      Gratis
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-bold ${textPrimary}`}>
                        {plan.priceLabel}
                      </span>
                      <span className={`text-sm ${textSecondary}`}>
                        {billingCycle === 'monthly' ? '/mes' : '/año'}
                      </span>
                    </div>
                  )}
                  {plan.priceNote && (
                    <p className={`text-xs mt-1 ${textSecondary}`}>
                      {plan.priceNote}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handlePlanClick(plan)}
                  disabled={isProcessing}
                  className={`w-full py-3 px-6 rounded-full font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isPopular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/50 hover:-translate-y-1'
                      : isDark
                      ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isProcessing ? 'Procesando...' : plan.cta}
                </button>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      {feature.included ? (
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5">
                          <X className="w-3 h-3 text-red-600" />
                        </div>
                      )}
                      <span
                        className={`text-sm ${
                          feature.included ? textSecondary : textMuted
                        } ${!feature.included && 'line-through'}`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center space-y-4">
          <div className={`max-w-3xl mx-auto p-4 rounded-lg border ${
            isDark
              ? 'bg-emerald-900/20 border-emerald-500/30'
              : 'bg-emerald-50 border-emerald-200'
          }`}>
            <p className={`text-sm font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'} mb-2`}>
              💳 Pagos seguros con Stripe
            </p>
            <p className={`text-sm ${isDark ? 'text-emerald-200' : 'text-emerald-600'}`}>
              Todos los pagos se procesan de forma segura a través de Stripe. Puedes cancelar en cualquier momento.
            </p>
          </div>

          <p className={`text-sm ${textSecondary}`}>
            ¿Necesitas algo personalizado?{' '}
            <a
              href="mailto:sales@klycs.com"
              className="text-blue-600 hover:text-blue-700 font-semibold underline"
            >
              Contáctanos
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
