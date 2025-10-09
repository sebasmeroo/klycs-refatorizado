import React, { useState } from 'react';
import { Crown, Check, AlertCircle, Calendar, CreditCard, ArrowRight, Zap, Rocket, Sparkles, XCircle } from 'lucide-react';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { subscriptionsService } from '@/services/subscriptions';
import { toast } from '@/utils/toast';
import { useAuth } from '@/hooks/useAuth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { STRIPE_PRICE_IDS } from '@/config/stripe';

export const SubscriptionSettings: React.FC = () => {
  const { user } = useAuth();
  const { subscriptionStatus, isLoading, planName, isActive, daysUntilExpiration, isExpiringSoon } = useSubscriptionStatus();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'PRO' | 'BUSINESS' | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const currentPlan = planName || 'FREE';

  // Detectar si venimos de un pago exitoso
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast.success('¡Pago procesado con éxito! Tu suscripción se activará en unos segundos.', { duration: 5000 });
      // Limpiar el parámetro de la URL
      window.history.replaceState({}, '', '/settings');

      // Recargar la página después de 3 segundos para mostrar la nueva suscripción
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
    if (urlParams.get('canceled') === 'true') {
      toast.info('Pago cancelado. Puedes intentarlo de nuevo cuando quieras.');
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

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

  const confirmUpgrade = async () => {
    console.log('🔵 confirmUpgrade iniciado');
    console.log('🔵 selectedPlan:', selectedPlan);
    console.log('🔵 user?.uid:', user?.uid);

    if (!selectedPlan || !user?.uid) {
      console.log('❌ Falta selectedPlan o user.uid');
      toast.error('Error: No se pudo identificar el plan o el usuario');
      return;
    }

    setIsUpgrading(true);
    console.log('🔵 isUpgrading = true');

    try {
      const functions = getFunctions();
      console.log('🔵 getFunctions() OK');

      // 1. Asegurar que existe el customer en Stripe
      console.log('🔵 Llamando a ensureCustomer...');
      const ensureCustomer = httpsCallable(functions, 'stripeEnsureCustomer');
      const customerResult = await ensureCustomer();
      console.log('✅ ensureCustomer result:', customerResult);

      // 2. Crear sesión de checkout
      console.log('🔵 Llamando a createCheckoutSession con priceId:', STRIPE_PRICE_IDS[selectedPlan]);
      const createCheckout = httpsCallable(functions, 'stripeCreateCheckoutSession');
      const result = await createCheckout({
        priceId: STRIPE_PRICE_IDS[selectedPlan],
        successUrl: `${window.location.origin}/settings?success=true`,
        cancelUrl: `${window.location.origin}/settings?canceled=true`,
      });
      console.log('✅ createCheckoutSession result:', result);

      const data = result.data as { url: string };
      console.log('🔵 data.url:', data.url);

      // 3. Redirigir directamente a Stripe Checkout usando la URL
      if (data.url) {
        console.log('✅ Redirigiendo a Stripe:', data.url);
        window.location.href = data.url;
      } else {
        console.log('❌ No se obtuvo URL de Stripe');
        toast.error('No se pudo obtener la URL de pago');
        setIsUpgrading(false);
      }
    } catch (error: any) {
      console.error('❌ Error completo:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error details:', error.details);

      let errorMessage = 'Error al procesar el pago. Intenta de nuevo.';
      if (error.message) {
        errorMessage = error.message;
      }
      if (error.code === 'unauthenticated') {
        errorMessage = 'Debes iniciar sesión para actualizar tu plan';
      }

      toast.error(errorMessage);
      setIsUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user?.uid) return;

    setIsCanceling(true);
    try {
      const result = await subscriptionsService.cancelSubscription(user.uid);

      if (result.success) {
        toast.success('Suscripción cancelada. Mantendrás el acceso hasta el final del período de facturación.');
        setShowCancelModal(false);
        // Invalidar caché para refrescar estado
        window.location.reload();
      } else {
        toast.error(result.error || 'Error al cancelar la suscripción');
      }
    } catch (error) {
      toast.error('Error inesperado al cancelar');
    } finally {
      setIsCanceling(false);
    }
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

          <div className="flex items-center gap-3">
            {currentPlan !== 'BUSINESS' && (
              <button
                onClick={() => handleUpgrade(currentPlan === 'FREE' ? 'PRO' : 'BUSINESS')}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Crown className="w-5 h-5" />
                <span>Actualizar Plan</span>
              </button>
            )}
            {currentPlan !== 'FREE' && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-all"
              >
                <XCircle className="w-5 h-5" />
                <span>Cancelar Suscripción</span>
              </button>
            )}
          </div>
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
                💳 Serás redirigido a Stripe para completar el pago de forma segura.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                disabled={isUpgrading}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmUpgrade}
                disabled={isUpgrading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isUpgrading ? 'Procesando...' : 'Continuar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                ¿Cancelar suscripción?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Mantendrás el acceso hasta el {subscriptionStatus?.currentPeriodEnd ? new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString('es-ES') : 'final del período'}
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Perderás el acceso a todas las funciones premium después de esta fecha.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isCanceling}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Mantener suscripción
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCanceling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {isCanceling ? 'Cancelando...' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
