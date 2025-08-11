import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { stripeConnectService } from '@/services/stripeConnect';
import { error as logError } from '@/utils/logger';
import { 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ArrowRight,
  Shield,
  TrendingUp,
  Globe,
  Zap,
  Clock,
  Users
} from 'lucide-react';

interface StripeOnboardingProps {
  onComplete?: () => void;
}

const StripeOnboarding: React.FC<StripeOnboardingProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stripeAccount, setStripeAccount] = useState<any>(null);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'info' | 'create' | 'onboarding' | 'complete'>('info');

  useEffect(() => {
    checkExistingAccount();
  }, [user?.id]);

  const checkExistingAccount = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const result = await stripeConnectService.getUserStripeAccount(user.id);
      if (result.success && result.data) {
        setStripeAccount(result.data);
        if (result.data.detailsSubmitted) {
          setStep('complete');
        } else {
          setStep('onboarding');
        }
      }
    } catch (error) {
      logError('Error checking existing account', error as Error, { component: 'StripeOnboarding' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (businessInfo: {
    type: 'individual' | 'company';
    email: string;
    country: string;
    business_name?: string;
    first_name?: string;
    last_name?: string;
  }) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await stripeConnectService.createConnectAccount(user.id, businessInfo);
      
      if (result.success && result.data) {
        setStripeAccount(result.data);
        await createOnboardingSession(result.data.stripeAccountId);
      } else {
        setError(result.error || 'Error creating account');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createOnboardingSession = async (stripeAccountId: string) => {
    if (!user?.id) return;

    try {
      const returnUrl = `${window.location.origin}/dashboard/payments/success`;
      const refreshUrl = `${window.location.origin}/dashboard/payments/onboarding`;

      const result = await stripeConnectService.createOnboardingSession(
        user.id,
        stripeAccountId,
        returnUrl,
        refreshUrl
      );

      if (result.success && result.data) {
        setOnboardingUrl(result.data.url);
        setStep('onboarding');
      } else {
        setError(result.error || 'Error creating onboarding session');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleRefreshStatus = async () => {
    if (!stripeAccount?.stripeAccountId) return;

    setLoading(true);
    try {
      await stripeConnectService.syncAccountStatus(stripeAccount.stripeAccountId);
      await checkExistingAccount();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error refreshing status');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stripeAccount) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-400">Verificando configuración de pagos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {step === 'info' && <InfoStep onNext={() => setStep('create')} />}
      {step === 'create' && (
        <CreateAccountStep 
          onSubmit={handleCreateAccount} 
          loading={loading} 
          error={error}
        />
      )}
      {step === 'onboarding' && (
        <OnboardingStep 
          onboardingUrl={onboardingUrl}
          stripeAccount={stripeAccount}
          onRefresh={handleRefreshStatus}
          loading={loading}
        />
      )}
      {step === 'complete' && (
        <CompleteStep 
          stripeAccount={stripeAccount}
          onComplete={onComplete}
        />
      )}
    </div>
  );
};

const InfoStep: React.FC<{ onNext: () => void }> = ({ onNext }) => (
  <div className="glass-card-ios p-8">
    <div className="text-center mb-8">
      <div className="h-16 w-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <DollarSign className="h-8 w-8 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">Configura los Pagos</h1>
      <p className="text-lg text-slate-300">
        Conecta tu cuenta de Stripe para empezar a recibir pagos
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white mb-4">¿Por qué Stripe?</h2>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Shield className="h-6 w-6 text-green-400 mt-1" />
            <div>
              <h3 className="font-medium text-white">Seguridad de clase mundial</h3>
              <p className="text-sm text-slate-400">
                Cumplimiento PCI DSS Level 1 y cifrado de extremo a extremo
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <TrendingUp className="h-6 w-6 text-blue-400 mt-1" />
            <div>
              <h3 className="font-medium text-white">Tarifas competitivas</h3>
              <p className="text-sm text-slate-400">
                2.9% + €0.25 por transacción exitosa, sin costos ocultos
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Globe className="h-6 w-6 text-purple-400 mt-1" />
            <div>
              <h3 className="font-medium text-white">Aceptación global</h3>
              <p className="text-sm text-slate-400">
                Acepta pagos de más de 135 monedas y métodos de pago
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Zap className="h-6 w-6 text-yellow-400 mt-1" />
            <div>
              <h3 className="font-medium text-white">Transferencias rápidas</h3>
              <p className="text-sm text-slate-400">
                Recibe tu dinero en 2-7 días hábiles según tu país
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white mb-4">¿Qué podrás hacer?</h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <CreditCard className="h-5 w-5 text-blue-400" />
              <h3 className="font-medium text-white">Servicios con pago</h3>
            </div>
            <p className="text-sm text-slate-400">
              Configura precios para tus servicios y recibe pagos directamente
            </p>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <Clock className="h-5 w-5 text-green-400" />
              <h3 className="font-medium text-white">Reservas con depósito</h3>
            </div>
            <p className="text-sm text-slate-400">
              Solicita depósitos para confirmar citas y reducir cancelaciones
            </p>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <Users className="h-5 w-5 text-purple-400" />
              <h3 className="font-medium text-white">Suscripciones</h3>
            </div>
            <p className="text-sm text-slate-400">
              Ofrece servicios recurrentes con pagos automáticos mensuales
            </p>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-8">
      <div className="flex items-start space-x-3">
        <CheckCircle className="h-6 w-6 text-blue-400 mt-1" />
        <div>
          <h3 className="font-medium text-blue-300 mb-2">Proceso rápido y seguro</h3>
          <p className="text-sm text-blue-200 mb-3">
            La configuración toma solo 5-10 minutos. Stripe se encarga de toda la complejidad 
            del procesamiento de pagos, cumplimiento y seguridad.
          </p>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• No necesitas conocimientos técnicos</li>
            <li>• Verificación de identidad automática</li>
            <li>• Dashboard completo para gestionar tus pagos</li>
            <li>• Soporte 24/7 en español</li>
          </ul>
        </div>
      </div>
    </div>

    <div className="text-center">
      <button
        onClick={onNext}
        className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-blue-600 transition-all transform hover:scale-105"
      >
        <span>Configurar Stripe Connect</span>
        <ArrowRight className="h-5 w-5" />
      </button>
      <p className="text-xs text-slate-400 mt-3">
        Al continuar, serás redirigido a Stripe para completar la configuración
      </p>
    </div>
  </div>
);

const CreateAccountStep: React.FC<{
  onSubmit: (data: any) => void;
  loading: boolean;
  error: string | null;
}> = ({ onSubmit, loading, error }) => {
  const [formData, setFormData] = useState({
    type: 'individual' as 'individual' | 'company',
    email: '',
    country: 'ES',
    business_name: '',
    first_name: '',
    last_name: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="glass-card-ios p-8">
      <div className="text-center mb-8">
        <CreditCard className="h-16 w-16 text-blue-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Información de la Cuenta</h1>
        <p className="text-slate-300">
          Proporciona los datos básicos para crear tu cuenta de Stripe
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Tipo de cuenta *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="cursor-pointer">
              <input
                type="radio"
                name="type"
                value="individual"
                checked={formData.type === 'individual'}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'individual' }))}
                className="sr-only"
              />
              <div className={`p-4 border-2 rounded-lg transition-all ${
                formData.type === 'individual' 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-slate-600 bg-slate-800/50'
              }`}>
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                  <div className="font-medium text-white">Individual</div>
                  <div className="text-sm text-slate-400 mt-1">
                    Para freelancers y profesionales independientes
                  </div>
                </div>
              </div>
            </label>

            <label className="cursor-pointer">
              <input
                type="radio"
                name="type"
                value="company"
                checked={formData.type === 'company'}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'company' }))}
                className="sr-only"
              />
              <div className={`p-4 border-2 rounded-lg transition-all ${
                formData.type === 'company' 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-slate-600 bg-slate-800/50'
              }`}>
                <div className="text-center">
                  <Globe className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                  <div className="font-medium text-white">Empresa</div>
                  <div className="text-sm text-slate-400 mt-1">
                    Para empresas y organizaciones
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              País *
            </label>
            <select
              required
              value={formData.country}
              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ES">España</option>
              <option value="US">Estados Unidos</option>
              <option value="GB">Reino Unido</option>
              <option value="FR">Francia</option>
              <option value="DE">Alemania</option>
              <option value="IT">Italia</option>
              <option value="PT">Portugal</option>
              <option value="MX">México</option>
              <option value="AR">Argentina</option>
              <option value="CO">Colombia</option>
            </select>
          </div>
        </div>

        {formData.type === 'individual' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Apellidos *
              </label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nombre de la empresa *
            </label>
            <input
              type="text"
              required
              value={formData.business_name}
              onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-300 mb-1">Información segura</h4>
              <p className="text-sm text-yellow-200">
                Esta información se usa únicamente para crear tu cuenta de Stripe. 
                Todos los datos están protegidos con cifrado de extremo a extremo.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Creando cuenta...</span>
              </>
            ) : (
              <>
                <span>Crear Cuenta de Stripe</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const OnboardingStep: React.FC<{
  onboardingUrl: string | null;
  stripeAccount: any;
  onRefresh: () => void;
  loading: boolean;
}> = ({ onboardingUrl, stripeAccount, onRefresh, loading }) => (
  <div className="glass-card-ios p-8">
    <div className="text-center mb-8">
      <Clock className="h-16 w-16 text-orange-400 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">Completa la Configuración</h1>
      <p className="text-slate-300">
        Finaliza la configuración en Stripe para empezar a recibir pagos
      </p>
    </div>

    <div className="space-y-6">
      {onboardingUrl && (
        <div className="text-center">
          <a
            href={onboardingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105"
          >
            <span>Continuar en Stripe</span>
            <ExternalLink className="h-5 w-5" />
          </a>
          <p className="text-sm text-slate-400 mt-3">
            Se abrirá en una nueva pestaña. Vuelve aquí cuando hayas terminado.
          </p>
        </div>
      )}

      <div className="bg-slate-800/50 rounded-lg p-6">
        <h3 className="font-semibold text-white mb-4">Estado de la cuenta</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Cuenta creada</span>
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Información enviada</span>
            {stripeAccount?.detailsSubmitted ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <Clock className="h-5 w-5 text-orange-400" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Pagos habilitados</span>
            {stripeAccount?.chargesEnabled ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <Clock className="h-5 w-5 text-orange-400" />
            )}
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar Estado</span>
        </button>
      </div>
    </div>
  </div>
);

const CompleteStep: React.FC<{
  stripeAccount: any;
  onComplete?: () => void;
}> = ({ stripeAccount, onComplete }) => (
  <div className="glass-card-ios p-8">
    <div className="text-center mb-8">
      <div className="h-16 w-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="h-8 w-8 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">¡Configuración Completa!</h1>
      <p className="text-lg text-slate-300">
        Tu cuenta de Stripe está lista para recibir pagos
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="text-center p-6 bg-green-500/10 border border-green-500/20 rounded-lg">
        <DollarSign className="h-8 w-8 text-green-400 mx-auto mb-3" />
        <h3 className="font-semibold text-white mb-2">Pagos Habilitados</h3>
        <p className="text-sm text-slate-400">
          Puedes recibir pagos inmediatamente
        </p>
      </div>

      <div className="text-center p-6 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <TrendingUp className="h-8 w-8 text-blue-400 mx-auto mb-3" />
        <h3 className="font-semibold text-white mb-2">Transferencias Activas</h3>
        <p className="text-sm text-slate-400">
          El dinero llegará a tu cuenta bancaria
        </p>
      </div>

      <div className="text-center p-6 bg-purple-500/10 border border-purple-500/20 rounded-lg">
        <Shield className="h-8 w-8 text-purple-400 mx-auto mb-3" />
        <h3 className="font-semibold text-white mb-2">Totalmente Seguro</h3>
        <p className="text-sm text-slate-400">
          Protección completa contra fraudes
        </p>
      </div>
    </div>

    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 mb-8">
      <h3 className="font-semibold text-green-300 mb-3">Próximos pasos:</h3>
      <ul className="text-sm text-green-200 space-y-2">
        <li className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4" />
          <span>Configura precios en tus servicios</span>
        </li>
        <li className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4" />
          <span>Habilita reservas con pago en tus tarjetas</span>
        </li>
        <li className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4" />
          <span>Revisa tu dashboard de Stripe para ver pagos</span>
        </li>
        <li className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4" />
          <span>Comparte tus tarjetas para generar ingresos</span>
        </li>
      </ul>
    </div>

    <div className="text-center">
      <button
        onClick={onComplete}
        className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold rounded-lg hover:from-green-500 hover:to-blue-600 transition-all transform hover:scale-105"
      >
        <span>Ir al Dashboard</span>
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  </div>
);

export default StripeOnboarding;