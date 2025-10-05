import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, LayoutDashboard, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useLayoutTheme } from '@/components/layout/Layout';
import { PricingSection } from '@/components/pricing/PricingSection';

const billingHighlights = [
  {
    icon: CheckCircle,
    title: 'Cancelación sencilla',
    description: 'Puedes pausar o cancelar tu plan desde el panel cuando quieras.'
  },
  {
    icon: Clock,
    title: 'Pagos puntuales',
    description: 'Sin permanencias. Cada ciclo se renueva automáticamente con recordatorios previos.'
  },
  {
    icon: ShieldCheck,
    title: 'Infraestructura segura',
    description: 'Stripe, Firebase, autenticación robusta y automatizaciones monitorizadas.'
  }
];

const faqItems = [
  {
    question: '¿Puedo migrar del plan Free al Pro sin perder mi tarjeta?',
    answer: 'Sí. Mantendrás tus bloques y enlaces. Simplemente añade métodos de pago y activa funciones Pro.',
  },
  {
    question: '¿Cómo funciona la integración con reservas?',
    answer: 'Los planes Pro y Business incluyen calendarios colaborativos, recordatorios y gestión de pagos. Puedes sincronizar Google Calendar o usar el calendario interno.',
  },
  {
    question: '¿Qué incluye el soporte Business?',
    answer: 'Onboarding personalizado, white-label, workflows multi-equipo y acceso prioritario a diagnósticos como emergencyUIDCheck o forceAuthRefresh.',
  },
];

export const Pricing: React.FC = () => {
  const { variant } = useLayoutTheme();
  const isDark = variant === 'dark';

  const gradient = isDark
    ? 'from-[#0f172a] via-[#05070f] to-[#0d1b33]'
    : 'from-[#f6f7ff] via-[#fffcf6] to-[#e4f0ff]';

  const surfacePrimary = isDark
    ? 'border border-white/10 bg-white/5 backdrop-blur-xl'
    : 'border border-neutral-200 bg-white shadow-xl';
  const surfaceSecondary = isDark ? 'border border-white/10 bg-white/5' : 'border border-neutral-200 bg-white';

  const textPrimary = isDark ? 'text-white' : 'text-neutral-900';
  const textSecondary = isDark ? 'text-white/70' : 'text-neutral-600';
  const textMuted = isDark ? 'text-white/50' : 'text-neutral-500';

  return (
    <div className="min-h-screen">
      <div
        className="relative overflow-hidden pb-24"
        style={{
          background: `radial-gradient(120% 120% at 20% 20%, ${isDark ? 'rgba(59,130,246,0.22)' : 'rgba(59,130,246,0.14)'} 0%, transparent 60%), radial-gradient(140% 140% at 80% 35%, ${isDark ? 'rgba(168,85,247,0.22)' : 'rgba(168,85,247,0.12)'} 0%, transparent 65%)`,
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
            <Link to="/product" className={isDark ? 'hover:text-white transition-colors' : 'hover:text-neutral-900 transition-colors'}>
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
            <Link to="/register">
              <Button size="sm" className={isDark ? 'rounded-full bg-white px-4 text-[#05070f]' : 'rounded-full bg-neutral-900 px-4 text-white'}>
                Comenzar gratis
              </Button>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-24">
          <section className={`relative overflow-hidden rounded-[40px] px-6 py-12 lg:px-16 lg:py-[72px] ${surfacePrimary}`}>
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-8">
                <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${textMuted}`}>Planes KLYCS</p>
                <h1 className={`text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl ${textPrimary}`}>
                  Escala tu tarjeta digital al ritmo de tu negocio.
                </h1>
                <p className={`text-sm leading-relaxed ${textSecondary}`}>
                  Desde crear tu presencia inicial hasta desplegar equipos completos con reservas automatizadas, KLYCS te ofrece un plan claro y transparente.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/register">
                    <Button size="lg" className={isDark ? 'rounded-full bg-white px-6 text-[#05070f] hover:-translate-y-1 transition-transform duration-200' : 'rounded-full bg-neutral-900 px-6 text-white hover:-translate-y-1 transition-transform duration-200'}>
                      Crear cuenta
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/help">
                    <Button variant="outline" size="lg" className={isDark ? 'rounded-full border border-white/30 bg-white/5 px-6 text-white hover:bg-white/10 transition-transform duration-200 hover:-translate-y-1' : 'rounded-full border border-neutral-300 bg-white px-6 text-neutral-800 hover:bg-neutral-100 transition-transform duration-200 hover:-translate-y-1'}>
                      Consultar recursos
                    </Button>
                  </Link>
                </div>
              </div>

              <div className={`rounded-[28px] p-6 ${surfaceSecondary}`}>
                <h3 className={`text-lg font-semibold ${textPrimary}`}>Resumen de planes</h3>
                <p className={`mt-2 text-xs ${textSecondary}`}>
                  Todos los planes incluyen detección automática de tema, componentes responsive y diagnósticos en vivo (emergencyUIDCheck, forceAuthRefresh, diagnoseImages).
                </p>
                <div className="mt-6 space-y-3">
                  {[ 'Free · Tarjeta esencial', 'Pro · Automatizaciones y reservas', 'Business · Equipos, white-label y workflows' ].map(item => (
                    <div
                      key={item}
                      className={`rounded-2xl px-4 py-3 text-sm ${isDark ? 'bg-white/5 text-white/80' : 'bg-neutral-100 text-neutral-700'}`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <PricingSection isDark={isDark} />
          </section>

          <section className={`rounded-[32px] px-8 py-12 lg:px-16 ${surfacePrimary}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${textMuted}`}>Facturación flexible</p>
            <h2 className={`mt-2 text-3xl font-semibold ${textPrimary}`}>
              Configura tus pagos según la etapa de tu negocio.
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {billingHighlights.map(({ icon: Icon, title, description }) => (
                <div key={title} className={`rounded-2xl p-5 ${surfaceSecondary}`}>
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${isDark ? 'bg-white/10 text-white' : 'bg-neutral-900 text-white'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className={`text-sm font-semibold ${textPrimary}`}>{title}</p>
                  <p className={`mt-2 text-xs ${textSecondary}`}>{description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={`grid gap-6 md:grid-cols-2 ${surfacePrimary} rounded-[32px] px-8 py-12 lg:px-16`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${textMuted}`}>FAQ KLYCS</p>
              <h2 className={`mt-2 text-3xl font-semibold ${textPrimary}`}>
                Preguntas frecuentes sobre planes y pagos.
              </h2>
              <p className={`mt-3 text-sm ${textSecondary}`}>
                ¿Buscas algo específico para tu equipo? Escríbenos y planificamos un onboarding personalizado.
              </p>
              <Link
                to="/contact"
                className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold ${isDark ? 'text-white hover:underline' : 'text-neutral-900 hover:underline'}`}
              >
                Hablar con ventas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {faqItems.map(({ question, answer }) => (
                <div key={question} className={`rounded-2xl p-4 ${surfaceSecondary}`}>
                  <p className={`text-sm font-semibold ${textPrimary}`}>{question}</p>
                  <p className={`mt-2 text-xs leading-relaxed ${textSecondary}`}>{answer}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Pricing;
