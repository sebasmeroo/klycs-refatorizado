import React from 'react';
import { Check, X, Sparkles, Zap, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  description: string;
  price: number;
  priceLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  gradientFrom: string;
  gradientTo: string;
  features: PlanFeature[];
  cta: string;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    name: 'FREE',
    description: 'Perfecto para empezar',
    price: 0,
    priceLabel: 'Gratis',
    icon: Sparkles,
    iconColor: 'text-gray-600',
    gradientFrom: 'from-gray-500',
    gradientTo: 'to-gray-600',
    features: [
      { text: '✅ 1 tarjeta digital', included: true },
      { text: '✅ Perfil básico (nombre, bio, foto)', included: true },
      { text: '✅ Enlaces y redes sociales', included: true },
      { text: '✅ Portfolio básico (3 imágenes)', included: true },
      { text: '❌ Sin calendario', included: false },
      { text: '❌ Sin reservas', included: false },
      { text: '❌ Sin profesionales', included: false },
      { text: '⚠️ Marca "Powered by Klycs"', included: false }
    ],
    cta: 'Comenzar Gratis'
  },
  {
    name: 'PRO',
    description: 'Para profesionales independientes',
    price: 9.99,
    priceLabel: '€9.99',
    icon: Zap,
    iconColor: 'text-blue-600',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-purple-600',
    popular: true,
    features: [
      { text: '✅ 1 tarjeta con gestión completa', included: true },
      { text: '📅 1 calendario colaborativo', included: true },
      { text: '👥 Profesionales ilimitados', included: true },
      { text: '💰 Reservas ilimitadas', included: true },
      { text: '📊 Analytics completo', included: true },
      { text: '🎨 Edición avanzada de diseño', included: true },
      { text: '🎯 SEO personalizable', included: true },
      { text: '❌ Sin marca Klycs', included: true }
    ],
    cta: 'Comenzar Ahora'
  },
  {
    name: 'BUSINESS',
    description: 'Para equipos y empresas',
    price: 40.00,
    priceLabel: '€40',
    icon: Rocket,
    iconColor: 'text-purple-600',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-pink-600',
    features: [
      { text: '🎴 Tarjetas ilimitadas', included: true },
      { text: '📅 Calendarios ilimitados', included: true },
      { text: '👥 Profesionales ilimitados', included: true },
      { text: '💬 Colaboración avanzada', included: true },
      { text: '📊 Analytics con IA + Heatmaps', included: true },
      { text: '🔗 API REST + Webhooks', included: true },
      { text: '🎨 Custom HTML/CSS/JS', included: true },
      { text: '🏷️ White-label + Onboarding', included: true }
    ],
    cta: 'Comenzar Ahora'
  }
];

interface PricingSectionProps {
  isDark?: boolean;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ isDark = false }) => {
  const navigate = useNavigate();

  const handlePlanClick = (planName: string) => {
    if (planName === 'FREE') {
      navigate('/register');
    } else if (planName === 'BUSINESS') {
      navigate('/register?plan=business');
    } else if (planName === 'PRO') {
      navigate('/register?plan=pro');
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
        {/* Header */}
        <div className="text-center mb-16">
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
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isPopular = plan.popular;

            return (
              <div
                key={plan.name}
                className={`relative rounded-3xl border-2 ${
                  isPopular
                    ? 'border-blue-500 shadow-2xl shadow-blue-500/20'
                    : `${cardBorder}`
                } ${cardBg} p-8 transition-all duration-300 hover:scale-105 hover:shadow-xl`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-4 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold rounded-full shadow-lg">
                      <Sparkles className="w-3 h-3" />
                      MÁS POPULAR
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${plan.gradientFrom} ${plan.gradientTo} mb-6`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Plan Name */}
                <h3 className={`text-2xl font-bold ${textPrimary} mb-2`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${textSecondary} mb-6`}>
                  {plan.description}
                </p>

                {/* Price */}
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
                        /mes
                      </span>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handlePlanClick(plan.name)}
                  className={`w-full py-3 px-6 rounded-full font-semibold transition-all duration-200 ${
                    isPopular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/50 hover:-translate-y-1'
                      : isDark
                      ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {plan.cta}
                </button>

                {/* Features List */}
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

        {/* FAQ / Additional Info */}
        <div className="mt-16 text-center space-y-4">
          {/* Nota de fase de lanzamiento */}
          <div className={`max-w-3xl mx-auto p-4 rounded-lg border ${
            isDark
              ? 'bg-blue-900/20 border-blue-500/30'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <p className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-700'} mb-2`}>
              🚀 Fase de Lanzamiento
            </p>
            <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-600'}`}>
              Los planes de pago estarán disponibles próximamente. Por ahora, puedes registrarte y empezar a usar todas las funcionalidades de forma gratuita.
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
