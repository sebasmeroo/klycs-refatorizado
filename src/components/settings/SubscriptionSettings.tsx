import React, { useState } from 'react';
import { Crown, Check, AlertCircle, Calendar, CreditCard, ArrowRight, Zap, Rocket, Sparkles } from 'lucide-react';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { subscriptionsService } from '@/services/subscriptions';
import { toast } from '@/utils/toast';

export const SubscriptionSettings: React.FC = () => {
  const { subscriptionStatus, isLoading, planName, isActive, daysUntilExpiration, isExpiringSoon } = useSubscriptionStatus();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'PRO' | 'BUSINESS' | null>(null);

  const currentPlan = planName || 'FREE';

  const plans = [
    {
      name: 'FREE',
      price: 0,
      icon: Sparkles,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300',
      features: [
        '1 tarjeta digital',
        'Perfil básico',
        'Enlaces y redes sociales',
        'Portfolio básico (3 imágenes)'
      ],
      limitations: [
        'Sin calendario',
        'Sin reservas',
        'Sin profesionales'
      ]
    },
    {
      name: 'PRO',
      price: 9.99,
      icon: Zap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-500',
      popular: true,
      features: [
        '1 tarjeta con gestión completa',
        '1 calendario colaborativo',
        'Profesionales ilimitados',
        'Reservas ilimitadas',
        'Analytics completo',
        'Edición avanzada',
        'SEO personalizable',
        'Sin marca Klycs'
      ],
      limitations: []
    },
    {
      name: 'BUSINESS',
      price: 40.00,
      icon: Rocket,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-500',
      features: [
        'Tarjetas ilimitadas',
        'Calendarios ilimitados',
        'Profesionales ilimitados',
        'Analytics con IA',
        'API + Webhooks',
        'Custom HTML/CSS/JS',
        'White-label completo',
        'Onboarding dedicado'
      ],
      limitations: []
    }
  ];

  const currentPlanData = plans.find(p => p.name === currentPlan);

  const handleUpgrade = (planName: 'PRO' | 'BUSINESS') => {
    setSelectedPlan(planName);
    setShowUpgradeModal(true);
  };

  const handleDowngrade = () => {
    toast.error('Para cambiar a un plan inferior, contáctanos en sales@klycs.com');
  };

  const confirmUpgrade = () => {
    // TODO: Cuando Stripe esté implementado, redirigir a checkout
    toast.info(`Upgrade a ${selectedPlan} - Próximamente disponible con Stripe`);
    setShowUpgradeModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Plan Actual */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {currentPlanData && (
              <div className={`p-3 rounded-xl ${currentPlanData.bgColor}`}>
                <currentPlanData.icon className={`w-8 h-8 ${currentPlanData.color}`} />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Plan {currentPlan}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {currentPlan === 'FREE' && 'Plan gratuito'}
                {currentPlan === 'PRO' && '€9.99/mes + IVA'}
                {currentPlan === 'BUSINESS' && '€40/mes + IVA'}
              </p>
            </div>
          </div>

          {currentPlan !== 'BUSINESS' && (
            <button
              onClick={() => handleUpgrade(currentPlan === 'FREE' ? 'PRO' : 'BUSINESS')}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <Crown className="w-5 h-5" />
              <span>Actualizar Plan</span>
            </button>
          )}
        </div>

        {/* Estado de la suscripción */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Estado</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {isActive ? (
                <span className="text-green-600">Activo</span>
              ) : (
                <span className="text-red-600">Inactivo</span>
              )}
            </p>
          </div>

          {subscriptionStatus?.currentPeriodEnd && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Próxima renovación</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString('es-ES')}
              </p>
              {isExpiringSoon && daysUntilExpiration && (
                <p className="text-xs text-orange-600 mt-1">
                  Quedan {daysUntilExpiration} días
                </p>
              )}
            </div>
          )}

          {currentPlan !== 'FREE' && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CreditCard className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Método de pago</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Por configurar
              </p>
            </div>
          )}
        </div>

        {/* Funcionalidades incluidas */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Funcionalidades incluidas:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {currentPlanData?.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
              </div>
            ))}
          </div>

          {currentPlanData && currentPlanData.limitations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                No incluye:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentPlanData.limitations.map((limitation, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">{limitation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comparador de Planes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Comparar Planes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.name === currentPlan;

            return (
              <div
                key={plan.name}
                className={`relative p-6 rounded-xl border-2 transition-all ${
                  isCurrent
                    ? `${plan.borderColor} shadow-lg`
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Plan Actual
                    </span>
                  </div>
                )}

                {plan.popular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Más Popular
                    </span>
                  </div>
                )}

                <div className={`inline-flex p-3 rounded-xl ${plan.bgColor} mb-4`}>
                  <plan.icon className={`w-6 h-6 ${plan.color}`} />
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>

                <div className="mb-4">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">Gratis</span>
                  ) : (
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">€{plan.price}</span>
                      <span className="text-gray-600 dark:text-gray-400 ml-1">/mes</span>
                    </div>
                  )}
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {!isCurrent && (
                  <button
                    onClick={() => {
                      if (plan.name === 'FREE') {
                        handleDowngrade();
                      } else {
                        handleUpgrade(plan.name as 'PRO' | 'BUSINESS');
                      }
                    }}
                    className={`w-full py-2 px-4 rounded-lg font-semibold transition-all ${
                      plan.name === 'FREE'
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                    }`}
                  >
                    {plan.name === 'FREE' ? 'Cambiar a FREE' : `Actualizar a ${plan.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Confirmación */}
      {showUpgradeModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Actualizar a {selectedPlan}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedPlan === 'PRO' ? '€9.99/mes + IVA' : '€40/mes + IVA'}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                🚀 <strong>Fase de lanzamiento:</strong> Los pagos estarán disponibles próximamente con Stripe.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmUpgrade}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
