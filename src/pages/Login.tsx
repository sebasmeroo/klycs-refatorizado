import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  Smartphone,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { authService } from '@/services/auth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { validateLoginForm, sanitizeEmail, type LoginFormData } from '@/utils/validation';
import { info, error as logError } from '@/utils/logger';
import { useLayoutTheme } from '@/components/layout/Layout';

const infoSections = [
  {
    title: 'Producto',
    items: [
      'Tarjetas digitales con bloques dinámicos, formularios y video embeds.',
      'Reservas con recordatorios automáticos y pagos integrados.',
      'Analítica en vivo para entender qué enlaces convierten mejor.',
    ],
    icon: LayoutDashboard,
  },
  {
    title: 'Plantillas',
    items: [
      'Layouts modulares para consultores, estudios creativos y wellness.',
      'Temas con tipografías y colores personalizables en segundos.',
      'Bloques reutilizables: testimonios, catálogos, servicios y funnels.',
    ],
    icon: Sparkles,
  },
  {
    title: 'Planes',
    items: [
      'Free: presencia esencial para empezar a compartir tu enlace.',
      'Pro (€9.99/mes): automatizaciones, dominios y métricas avanzadas.',
      'Business (€40/mes): equipos, plantillas multi-brand y workflows.',
    ],
    icon: ShieldCheck,
  },
  {
    title: 'Recursos',
    items: [
      'Centro de ayuda con guías de onboarding y scripts de reserva.',
      'Diagnósticos rápidos: emergencyUIDCheck y diagnoseImages.',
      'Compatibilidad Firebase / PWA monitorizada desde la app.',
    ],
    icon: Share2,
  },
];

export const Login: React.FC = () => {
  const { variant: layoutVariant } = useLayoutTheme();
  const isDark = layoutVariant === 'dark';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const gradient = isDark
    ? 'from-[#0f172a] via-[#05070f] to-[#0b132d]'
    : 'from-[#eef2ff] via-[#fdfcf8] to-[#e4efff]';

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

    const formData: LoginFormData = {
      email: sanitizeEmail(email),
      password: password.trim(),
    };

    const validation = validateLoginForm(formData);

    if (!validation.success) {
      setFieldErrors(validation.errors || {});
      setLoading(false);
      return;
    }

    try {
      const result = await authService.signIn(formData.email, formData.password);

      if (result.success) {
        info('Login successful', { component: 'login', email: formData.email });
        navigate('/dashboard');
      } else {
        setError(result.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      logError('Login failed', err, { component: 'login', email: formData.email });
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className={`relative overflow-hidden pb-24`}
        style={{
          background: `radial-gradient(100% 120% at 20% 20%, ${isDark ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.18)'} 0%, transparent 60%), radial-gradient(120% 120% at 80% 40%, ${isDark ? 'rgba(168,85,247,0.25)' : 'rgba(168,85,247,0.15)'} 0%, transparent 62%)`,
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
              to="/register"
              className={`hidden text-sm font-medium md:inline-flex ${isDark ? 'text-white/60 hover:text-white' : 'text-neutral-500 hover:text-neutral-800'}`}
            >
              Crear cuenta
            </Link>
            <Link to="/">
              <Button variant="outline" size="sm" className={isDark ? 'border-white/20 bg-white/5 text-white hover:bg-white hover:text-[#05070f]' : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-900 hover:text-white'}>
                Volver al inicio
              </Button>
            </Link>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)] lg:px-8">
          <div className="space-y-8">
            <div className={`rounded-[32px] px-8 py-10 ${surfaceSecondary}`}>
              <h1 className={`text-3xl font-semibold ${textPrimary}`}>Inicia sesión y retoma tus tarjetas interactivas</h1>
              <p className={`mt-3 text-sm ${textSecondary}`}>
                Autentifícate para acceder al panel, actualizar tus plantillas y revisar métricas en tiempo real. Mantén tus reservas y pagos corriendo en segundo plano.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Links activos', value: '12k+', helper: 'Tarjetas públicas actualizadas este mes' },
                  { label: 'Integraciones', value: 'Stripe · Google · Twilio', helper: 'Automatizaciones listas para conectar' },
                  { label: 'Scripts útiles', value: 'diagnoseImages()', helper: 'Resuelve incidencias desde la consola' },
                ].map(({ label, value, helper }) => (
                  <div key={label} className={`rounded-2xl p-5 ${isDark ? 'border border-white/10 bg-white/5' : 'border border-neutral-200 bg-neutral-50'}`}>
                    <p className={`text-xs uppercase tracking-[0.3em] ${textMuted}`}>{label}</p>
                    <p className={`mt-2 text-lg font-semibold ${textPrimary}`}>{value}</p>
                    <p className={`mt-2 text-xs ${textSecondary}`}>{helper}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5 rounded-[32px] border border-white/10 bg-transparent/5 px-8 py-10 backdrop-blur">
              {infoSections.map(({ title, items, icon: Icon }) => (
                <div key={title} className={`flex gap-4 rounded-2xl p-4 ${surfaceSecondary}`}>
                  <div className={`mt-1 flex h-10 w-10 items-center justify-center rounded-2xl ${isDark ? 'bg-white/10 text-white' : 'bg-neutral-900 text-white'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${textPrimary}`}>{title}</p>
                    <ul className={`mt-2 space-y-1 text-xs ${textSecondary}`}>
                      {items.map(item => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`relative rounded-[32px] px-8 py-10 ${surfacePrimary}`}>
            <div className="mb-8 space-y-2 text-center">
              <h2 className={`text-2xl font-semibold ${textPrimary}`}>Inicia sesión</h2>
              <p className={`text-sm ${textSecondary}`}>
                Introduce tus credenciales para gestionar tus tarjetas y reservas.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="login-email" className={`text-sm font-medium ${textPrimary}`}>
                  Email
                </label>
                <Input
                  id="login-email"
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
                {fieldErrors.email && (
                  <p className="text-sm text-red-500">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className={`text-sm font-medium ${textPrimary}`}>
                  Contraseña
                </label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  placeholder="Tu contraseña"
                  className={`w-full ${fieldErrors.password ? 'border-red-500 focus:ring-red-400' : ''}`}
                  required
                />
                {fieldErrors.password && (
                  <p className="text-sm text-red-500">{fieldErrors.password}</p>
                )}
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/20 p-3 text-center text-sm text-red-100">
                  {error}
                </div>
              )}

              <Button type="submit" className={`${buttonPrimary} w-full`} disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : 'Iniciar sesión'}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-between text-xs">
              <Link to="/forgot-password" className={isDark ? 'text-white/60 hover:text-white' : 'text-neutral-500 hover:text-neutral-800'}>
                ¿Olvidaste tu contraseña?
              </Link>
              <Link to="/register" className={isDark ? 'text-white/80 hover:text-white' : 'text-neutral-700 hover:text-neutral-900'}>
                Crear cuenta gratuita
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
