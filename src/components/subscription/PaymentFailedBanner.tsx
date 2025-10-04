import React from 'react';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

export const PaymentFailedBanner: React.FC = () => {
  const { isPastDue } = useSubscriptionStatus();

  if (!isPastDue) return null;

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-6 animate-fadeIn">
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
            Problema con el pago
          </h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">
            No pudimos procesar tu último pago. Actualiza tu método de pago para mantener el acceso a las funciones premium.
          </p>
          <div className="mt-3">
            <a
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Actualizar método de pago
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
