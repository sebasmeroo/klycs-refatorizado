import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  ShieldCheck,
  Share2,
} from 'lucide-react';
import { authService } from '@/services/auth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  validateRegisterForm,
  sanitizeEmail,
  sanitizeString,
  type RegisterFormData,
} from '@/utils/validation';
import { info, error as logError } from '@/utils/logger';
import { useLayoutTheme } from '@/components/layout/Layout';

const planDescriptions: Record<string, { label: string; price: string; description: string }> = {
  FREE: {
    label: 'Free',
    price: '€0',
    description: 'Tarjeta esencial, bloques básicos y analítica resumida.',
  },
  PRO: {
    label: 'Pro',
    price: '€9.99/mes',
    description: 'Automatizaciones, dominios personalizados y métricas avanzadas.',
  },
  BUSINESS: {
    label: 'Business',
    price: '€40/mes',
    description: 'Equipos, plantillas multi-brand, workflows y roles personalizados.',
  },
};

const sellingPoints = [
  {
    icon: LayoutDashboard,
    title: 'Kit de publicación en minutos',
    description: 'Plantillas orientadas a consultores, estudios y wellness con bloques reutilizables y tipografías listas.',
  },
  {
    icon: Sparkles,
    title: 'Reservas automatizadas',
    description: 'Sincroniza Google Calendar, envía recordatorios y gestiona pagos sin salir de tu tarjeta.',
  },
  {
    icon: ShieldCheck,
    title: 'Automatizaciones seguras',
    description: 'forceAuthRefresh y emergencyUIDCheck garantizan reglas de Firestore y sesiones sanas.',
  },
  {
    icon: Share2,
    title: 'Recursos activos',
    description: 'diagnoseImages(), fixFirestoreRules(), y dashboards de compatibilidad siempre disponibles.',
  },
];

const comparison = [
  {
    plan: 'Free',
    items: [
      'Tarjeta responsive con bloques principales',
      'Reservas básicas y enlaces ilimitados',
      'Analítica resumida y soporte por email',
    ],
  },
  {
    plan: 'Pro',
    items: [
      'Automatización de recordatorios y Stripe integrado',
      'Dominios personalizados y secciones avanzadas',
      'Diagnósticos en vivo y métricas de conversión',
    ],
  },
  {
    plan: 'Business',
    items: [
      'Gestión multi-equipo y roles con permisos granulares',
      'Workflows compartidos, plantillas multi-marca',
      'Integraciones corporativas y monitorización extendida',
    ],
  },
];

export const Register: React.FC = () => {
  const { variant: layoutVariant } = useLayoutTheme();
  const isDark = layoutVariant === 'dark';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan')?.toUpperCase() || 'FREE';
  const planInfo = planDescriptions[selectedPlan] || planDescriptions.FREE;

  const gradient = isDark
    ? 'from-[#0f172a] via-[#05070f] to-[#0b132d]'
    : 'from-[#f2f5ff] via-[#fefbf5] to-[#e8f1ff]';

  const surfacePrimary = isDark
    ? 'border border-white/10 bg-white/5 backdrop-blur-xl'
    : 'border border-neutral-200 bg-white shadow-xl';
  const surfaceSecondary = isDark ? 'border border-white/10 bg-white/5' : 'border border-neutral-200 bg-white';

  const textPrimary = isDark ? 'text-white' : 'text-neutral-900';
  const textSecondary = isDark ? 'text-white/70' : 'text-neutral-600';
  const textMuted = isDark ? 'text-white/50' : 'text-neutral-500';

  const buttonPrimary = isDark
    ? 'rounded-full bg-white px-6 text-[#05070f] transition-transform duration-200 hover:-translate-y-1'
    : 'rounded-full bg-neutral-900 px-6 text-white transition-transform duration-200 hover:-translate-y-1';

  const buttonOutline = isDark
    ? 'rounded-full border border-white/30 bg-white/5 px-6 text-white transition-transform duration-200 hover:-translate-y-1 hover:bg-white/10'
    : 'rounded-full border border-neutral-300 bg-white px-6 text-neutral-800 transition-transform duration-200 hover:-translate-y-1 hover:bg-neutral-100';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    const formData: RegisterFormData = {
      name: sanitizeString(name),
      email: sanitizeEmail(email),
      password: password.trim(),
      confirmPassword: confirmPassword.trim(),
    };

    const validation = validateRegisterForm(formData);

    if (!validation.success) {
      setFieldErrors(validation.errors || {});
      setLoading(false);
      return;
    }

    try {
      const result = await authService.signUp(formData.email, formData.password, formData.name);

      if (result.success) {
        info('Registration successful', {
          component: 'register',
          email: formData.email,
          selectedPlan,
        });

        if (selectedPlan === 'PRO' || selectedPlan === 'BUSINESS') {
          navigate(`/dashboard?upgrade=${selectedPlan.toLowerCase()}`);
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.error || 'Error al crear la cuenta');
      }
    } catch (err) {
      logError('Registration failed', err, { component: 'register', email: formData.email });
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div
        className="relative overflow-hidden pb-24"
        style={{
          background: `radial-gradient(100% 120% at 15% 20%, ${isDark ? 'rgba(59,130,246,0.22)' : 'rgba(59,130,246,0.14)'} 0%, transparent 60%), radial-gradient(120% 120% at 85% 30%, ${isDark ? 'rgba(168,85,247,0.22)' : 'rgba(168,85,247,0.12)'} 0%, transparent 65%)`,
        }}
      >
        <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${gradient}`} />

        <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-8 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-semibold ${isDark ? 'bg-white/10 text-white' : 'bg-neutral-900 text-white'}`}>
              K
            </span>
            <span className={`text-lg font-semibold tracking-wide ${textPrimary}`}>KLYCS</span>
          </Link>
          <nav className={`hidden items-center gap-8 text-sm font-medium md:flex ${textMuted}`}>
            <Link to="/" className={isDark ? 'hover:text-white transition-colors' : 'hover:text-neutral-900 transition-colors'}>
              Producto
            </Link>
            <Link to="/services" className={isDark ? 'hover:text-white transition-colors' : 'hover:text-neutral-900 transition-colors'}>
              Plantillas
            </Link>
            <Link to="/pricing" className={isDark ? 'hover:text-white transition-colors' : 'hover:text-neutral-900 transition-colors'}>
              Planes
            </Link>
            <Link to="/help" className={isDark ? 'hover:text-white transition-colors' : 'hover:text-neutral-900 transition-colors'}>
              Recursos
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className={`hidden text-sm font-medium md:inline-flex ${isDark ? 'text-white/60 hover:text-white' : 'text-neutral-500 hover:text-neutral-800'}`}
            >
              Iniciar sesión
            </Link>
            <Link to="/">
              <Button variant="outline" size="sm" className={isDark ? 'border-white/20 bg-white/5 text-white hover:bg-white hover:text-[#05070f]' : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-900 hover:text-white'}>
                Volver al inicio
              </Button>
            </Link>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.8fr)] lg:px-8">
          <div className="space-y-8">
            <div className={`rounded-[32px] px-8 py-10 ${surfacePrimary}`}>
              <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${textMuted}`}>Plan {planInfo.label}</p>
              <h1 className={`mt-2 text-3xl font-semibold ${textPrimary}`}>
                Construye y publica tu tarjeta profesional en minutos.
              </h1>
              <p className={`mt-3 text-sm ${textSecondary}`}>
                Personaliza bloques, activa reservas y entiende a tus clientes desde una sola plataforma.
              </p>

              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 text-white/80 backdrop-blur" hidden={!isDark}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-white/60">Plan seleccionado</p>
                    <p className="text-xl font-semibold text-white">{planInfo.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{planInfo.price}</p>
                    <p className="text-xs text-white/60">Se podrá actualizar tras el registro</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-white/70">{planInfo.description}</p>
              </div>

              <div hidden={isDark} className="mt-6 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-neutral-500">Plan seleccionado</p>
                    <p className="text-xl font-semibold text-neutral-900">{planInfo.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-neutral-900">{planInfo.price}</p>
                    <p className="text-xs text-neutral-500">Se podrá actualizar tras el registro</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-neutral-600">{planInfo.description}</p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {comparison.map(({ plan, items }) => (
                  <div key={plan} className={`rounded-2xl p-4 ${surfaceSecondary}`}>
                    <p className={`text-xs uppercase tracking-[0.3em] ${textMuted}`}>{plan}</p>
                    <ul className={`mt-2 space-y-1 text-xs ${textSecondary}`}>
                      {items.map(item => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5 rounded-[32px] border border-white/10 bg-transparent/5 px-8 py-10 backdrop-blur">
              {sellingPoints.map(({ icon: Icon, title, description }) => (
                <div key={title} className={`flex gap-4 rounded-2xl p-4 ${surfaceSecondary}`}>
                  <div className={`mt-1 flex h-10 w-10 items-center justify-center rounded-2xl ${isDark ? 'bg-white/10 text-white' : 'bg-neutral-900 text-white'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${textPrimary}`}>{title}</p>
                    <p className={`mt-2 text-xs ${textSecondary}`}>{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`relative rounded-[32px] px-8 py-10 ${surfacePrimary}`}>
            <div className="mb-8 space-y-2 text-center">
              <h2 className={`text-2xl font-semibold ${textPrimary}`}>Crea tu cuenta</h2>
              <p className={`text-sm ${textSecondary}`}>
                Configura tu perfil y comienza a diseñar tu tarjeta digital profesional.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="register-name" className={`text-sm font-medium ${textPrimary}`}>
                  Nombre completo
                </label>
                <Input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) {
                      setFieldErrors(prev => ({ ...prev, name: '' }));
                    }
                  }}
                  placeholder="Tu nombre y apellido"
                  className={`w-full ${fieldErrors.name ? 'border-red-500 focus:ring-red-400' : ''}`}
                  required
                />
                {fieldErrors.name && <p className="text-sm text-red-500">{fieldErrors.name}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="register-email" className={`text-sm font-medium ${textPrimary}`}>
                  Email
                </label>
                <Input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  placeholder="tu@email.com"
                  className={`w-full ${fieldErrors.email ? 'border-red-500 focus:ring-red-400' : ''}`}
                  required
                />
                {fieldErrors.email && <p className="text-sm text-red-500">{fieldErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="register-password" className={`text-sm font-medium ${textPrimary}`}>
                  Contraseña
                </label>
                <Input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  placeholder="Al menos 6 caracteres"
                  className={`w-full ${fieldErrors.password ? 'border-red-500 focus:ring-red-400' : ''}`}
                  required
                />
                {fieldErrors.password && <p className="text-sm text-red-500">{fieldErrors.password}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="register-confirm-password" className={`text-sm font-medium ${textPrimary}`}>
                  Confirmar contraseña
                </label>
                <Input
                  id="register-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  placeholder="Repite tu contraseña"
                  className={`w-full ${fieldErrors.confirmPassword ? 'border-red-500 focus:ring-red-400' : ''}`}
                  required
                />
                {fieldErrors.confirmPassword && <p className="text-sm text-red-500">{fieldErrors.confirmPassword}</p>}
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/20 p-3 text-center text-sm text-red-100">
                  {error}
                </div>
              )}

              <Button type="submit" className={`${buttonPrimary} w-full`} disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : 'Crear cuenta'}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-between text-xs">
              <div className={textMuted}>
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className={isDark ? 'text-white/80 hover:text-white' : 'text-neutral-800 hover:text-neutral-900'}>
                  Inicia sesión
                </Link>
              </div>
              <Link to="/pricing" className={isDark ? 'text-white/70 hover:text-white' : 'text-neutral-700 hover:text-neutral-900'}>
                Ver planes en detalle
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
