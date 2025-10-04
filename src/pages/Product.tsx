import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  LineChart,
  Palette,
  Smartphone,
  Zap,
  Share2,
  ShieldCheck,
  Sparkles,
  Clock,
  Users,
  CreditCard,
  ArrowRight,
  Check,
  Eye,
  MousePointer,
  Bell,
  Globe,
  Lock,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useLayoutTheme } from '@/components/layout/Layout';

const heroFeatures = [
  {
    icon: LayoutDashboard,
    title: 'Editor modular drag & drop',
    description: 'Arrastra bloques de contenido, servicios, testimonios, formularios y media para crear tarjetas personalizadas sin código.',
  },
  {
    icon: Calendar,
    title: 'Sistema de reservas inteligente',
    description: 'Calendario sincronizado con Google Calendar, confirmaciones automáticas, recordatorios por email y gestión de disponibilidad en tiempo real.',
  },
  {
    icon: LineChart,
    title: 'Analítica en vivo',
    description: 'Métricas de vistas, clics en enlaces, conversiones de reservas e ingresos. Entiende qué funciona mejor en cada campaña.',
  },
  {
    icon: Palette,
    title: 'Temas personalizables',
    description: 'Cambia colores, tipografías y estilos en segundos. Detección automática de modo oscuro/claro según el navegador del usuario.',
  },
];

const productFeatures = [
  {
    category: 'Tarjetas Digitales',
    icon: Smartphone,
    features: [
      'Diseño responsive optimizado para móvil y desktop',
      'Bloques reutilizables: hero, servicios, testimonios, galería, FAQ',
      'Embeds de video, carousels de imágenes y animaciones suaves',
      'Compresión automática de imágenes para carga rápida',
      'URLs personalizadas y códigos QR generados al instante',
      'Modo offline con PWA (Progressive Web App)',
    ],
  },
  {
    category: 'Sistema de Reservas',
    icon: Calendar,
    features: [
      'Calendario colaborativo para equipos y profesionales',
      'Sincronización bidireccional con Google Calendar',
      'Definición de disponibilidad por días, horarios y buffers',
      'Formularios personalizados por servicio',
      'Confirmaciones y recordatorios automáticos por email',
      'Gestión de cancelaciones y reprogramaciones',
    ],
  },
  {
    category: 'Pagos y Monetización',
    icon: CreditCard,
    features: [
      'Integración con Stripe para pagos seguros',
      'Pagos únicos o por adelantado en reservas',
      'Gestión de reembolsos desde el panel',
      'Dashboard de ingresos en tiempo real',
      'Control de horas trabajadas y compensación',
      'Suscripciones Pro y Business con renovación automática',
    ],
  },
  {
    category: 'Analítica y Optimización',
    icon: LineChart,
    features: [
      'Dashboard de métricas: vistas, clics, reservas e ingresos',
      'Análisis de rendimiento por tarjeta y servicio',
      'Gráficos de evolución temporal',
      'Identificación de enlaces más clicados',
      'Métricas de conversión de visitante a cliente',
      'Exportación de datos para análisis externo',
    ],
  },
  {
    category: 'Colaboración y Equipos',
    icon: Users,
    features: [
      'Gestión de equipos con roles y permisos',
      'Calendarios compartidos entre profesionales',
      'Asignación automática de reservas a miembros del equipo',
      'Vista centralizada de actividad del equipo',
      'Workflows multi-marca para agencias',
      'Panel de administración para gestión de usuarios',
    ],
  },
  {
    category: 'Seguridad y Confiabilidad',
    icon: ShieldCheck,
    features: [
      'Autenticación segura con Firebase Authentication',
      'Protección de datos con Firestore Security Rules',
      'Backups automáticos de tu información',
      'Cumplimiento con RGPD y políticas de privacidad',
      'Monitorización de errores en tiempo real',
      'Diagnósticos técnicos: emergencyUIDCheck, forceAuthRefresh',
    ],
  },
];

const technicalHighlights = [
  {
    icon: Zap,
    title: 'Performance',
    items: [
      'Carga inicial < 2 segundos',
      'Lazy loading de imágenes y componentes',
      'Code splitting automático',
      'Cache inteligente con Service Workers',
    ],
  },
  {
    icon: Globe,
    title: 'Alcance Global',
    items: [
      'CDN distribuido para baja latencia',
      'Compatibilidad con todos los navegadores',
      'Optimización SEO automática',
      'Meta tags personalizables por tarjeta',
    ],
  },
  {
    icon: Lock,
    title: 'Privacidad',
    items: [
      'Encriptación de datos sensibles',
      'Control granular de permisos',
      'Sin venta de datos a terceros',
      'Transparencia total en políticas',
    ],
  },
  {
    icon: Bell,
    title: 'Notificaciones',
    items: [
      'Emails transaccionales automáticos',
      'Recordatorios personalizados',
      'Alertas de nuevas reservas',
      'Notificaciones de sistema en tiempo real',
    ],
  },
];

const useCases = [
  {
    title: 'Consultores y Coaches',
    description: 'Crea tu tarjeta con servicios de mentoría, sesiones 1:1 y paquetes. Gestiona reservas, cobra por adelantado y mantén todo sincronizado.',
    icon: Users,
  },
  {
    title: 'Estudios Creativos',
    description: 'Muestra tu portafolio, servicios de diseño, branding o desarrollo. Comparte testimonios, cases y permite que te reserven directamente.',
    icon: Palette,
  },
  {
    title: 'Wellness y Salud',
    description: 'Organiza sesiones de terapia, yoga, nutrición o fitness. Calendarios claros, recordatorios automáticos y pagos seguros.',
    icon: Sparkles,
  },
  {
    title: 'Agencias y Equipos',
    description: 'Gestiona múltiples profesionales, comparte calendarios, asigna reservas automáticamente y analiza el rendimiento del equipo.',
    icon: TrendingUp,
  },
];

export const Product: React.FC = () => {
  const { variant } = useLayoutTheme();
  const isDark = variant === 'dark';

  const gradient = isDark
    ? 'from-[#111826] via-[#05070f] to-[#0d142d]'
    : 'from-[#f6f7ff] via-[#fffdfa] to-[#eef4ff]';

  const surfacePrimary = isDark
    ? 'border border-white/10 bg-white/5 backdrop-blur-xl'
    : 'border border-neutral-200 bg-white shadow-xl';

  const surfaceSecondary = isDark
    ? 'border border-white/10 bg-white/5'
    : 'border border-neutral-200 bg-white';

  const textPrimary = isDark ? 'text-white' : 'text-neutral-900';
  const textSecondary = isDark ? 'text-white/70' : 'text-neutral-600';
  const textMuted = isDark ? 'text-white/50' : 'text-neutral-500';

  const buttonPrimary = isDark
    ? 'rounded-full bg-white px-6 text-[#05070f] hover:-translate-y-1 transition-transform duration-200'
    : 'rounded-full bg-neutral-900 px-6 text-white hover:-translate-y-1 transition-transform duration-200';

  const buttonOutline = isDark
    ? 'rounded-full border border-white/30 bg-white/5 px-6 text-white hover:bg-white/10 transition-transform duration-200 hover:-translate-y-1'
    : 'rounded-full border border-neutral-300 bg-white px-6 text-neutral-800 hover:bg-neutral-100 transition-transform duration-200 hover:-translate-y-1';

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden pb-24">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
          <div
            className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-[180px]"
            style={{ background: isDark ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.12)' }}
          />
          <div
            className="absolute bottom-[-160px] right-[-120px] h-[380px] w-[380px] rounded-full blur-[200px]"
            style={{ background: isDark ? 'rgba(168,85,247,0.25)' : 'rgba(168,85,247,0.12)' }}
          />
        </div>

        <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-8 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-semibold ${
                isDark ? 'bg-white/10 text-white' : 'bg-neutral-900 text-white'
              }`}
            >
              K
            </span>
            <span className={`text-lg font-semibold tracking-wide ${textPrimary}`}>KLYCS</span>
          </Link>
          <nav className={`hidden items-center gap-8 text-sm font-medium md:flex ${textMuted}`}>
            <Link
              to="/product"
              className={isDark ? 'hover:text-white transition-colors' : 'hover:text-neutral-900 transition-colors'}
            >
              Producto
            </Link>
            <Link
              to="/services"
              className={isDark ? 'hover:text-white transition-colors' : 'hover:text-neutral-900 transition-colors'}
            >
              Plantillas
            </Link>
            <Link
              to="/pricing"
              className={isDark ? 'hover:text-white transition-colors' : 'hover:text-neutral-900 transition-colors'}
            >
              Planes
            </Link>
            <Link
              to="/help"
              className={isDark ? 'hover:text-white transition-colors' : 'hover:text-neutral-900 transition-colors'}
            >
              Recursos
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button
                variant="outline"
                size="sm"
                className={
                  isDark
                    ? 'border-white/20 bg-white/5 text-white hover:bg-white hover:text-[#05070f]'
                    : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-900 hover:text-white'
                }
              >
                Ingresar
              </Button>
            </Link>
            <Link to="/register">
              <Button
                size="sm"
                className={isDark ? 'rounded-full bg-white px-4 text-[#05070f]' : 'rounded-full bg-neutral-900 px-4 text-white'}
              >
                Comenzar gratis
              </Button>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-24">
          {/* HERO SECTION */}
          <section className={`relative overflow-hidden rounded-[40px] px-6 py-12 lg:px-16 lg:py-[72px] ${surfacePrimary}`}>
            <div className="space-y-8">
              <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${textMuted}`}>Producto KLYCS</p>
              <h1 className={`text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl ${textPrimary}`}>
                La plataforma completa para crear tarjetas digitales profesionales con reservas y analítica.
              </h1>
              <p className={`text-base leading-relaxed max-w-3xl ${textSecondary}`}>
                KLYCS combina diseño, funcionalidad y datos en una sola herramienta. Crea tarjetas inmersivas, automatiza
                reservas, acepta pagos y entiende qué convierte mejor. Todo desde un panel intuitivo y sin código.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register">
                  <Button size="lg" className={buttonPrimary}>
                    Empezar gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/services">
                  <Button variant="outline" size="lg" className={buttonOutline}>
                    Ver plantillas
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {heroFeatures.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className={`space-y-4 rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-1 ${surfaceSecondary}`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                      isDark ? 'bg-white/10 text-white' : 'bg-neutral-900 text-white'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className={`text-lg font-semibold ${textPrimary}`}>{title}</h3>
                  <p className={`text-sm leading-relaxed ${textSecondary}`}>{description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CARACTERÍSTICAS DETALLADAS */}
          <section className="space-y-12">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${textMuted}`}>Características completas</p>
              <h2 className={`mt-2 text-3xl font-semibold ${textPrimary}`}>
                Todo lo que necesitas para profesionalizar tu presencia digital.
              </h2>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {productFeatures.map(({ category, icon: Icon, features }) => (
                <div key={category} className={`rounded-3xl p-8 ${surfaceSecondary}`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                        isDark ? 'bg-white/10 text-white' : 'bg-neutral-900 text-white'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className={`text-xl font-semibold ${textPrimary}`}>{category}</h3>
                  </div>
                  <ul className="space-y-3">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check
                          className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                            isDark ? 'text-emerald-400' : 'text-emerald-600'
                          }`}
                        />
                        <span className={`text-sm leading-relaxed ${textSecondary}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* ASPECTOS TÉCNICOS */}
          <section className={`rounded-[32px] px-8 py-12 lg:px-16 ${surfacePrimary}`}>
            <div className="space-y-8">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${textMuted}`}>Infraestructura robusta</p>
                <h2 className={`mt-2 text-3xl font-semibold ${textPrimary}`}>
                  Tecnología de vanguardia para una experiencia fluida y segura.
                </h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {technicalHighlights.map(({ icon: Icon, title, items }) => (
                  <div key={title} className={`rounded-2xl p-6 ${surfaceSecondary}`}>
                    <div
                      className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${
                        isDark ? 'bg-white/10 text-white' : 'bg-neutral-900 text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className={`text-lg font-semibold mb-3 ${textPrimary}`}>{title}</h3>
                    <ul className="space-y-2">
                      {items.map((item, idx) => (
                        <li key={idx} className={`text-xs leading-relaxed ${textSecondary}`}>
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CASOS DE USO */}
          <section className="space-y-12">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${textMuted}`}>Casos de uso</p>
              <h2 className={`mt-2 text-3xl font-semibold ${textPrimary}`}>
                Profesionales de todos los sectores confían en KLYCS.
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {useCases.map(({ title, description, icon: Icon }) => (
                <div
                  key={title}
                  className={`space-y-4 rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-1 ${surfaceSecondary}`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                      isDark ? 'bg-white/10 text-white' : 'bg-neutral-900 text-white'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className={`text-lg font-semibold ${textPrimary}`}>{title}</h3>
                  <p className={`text-sm leading-relaxed ${textSecondary}`}>{description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA FINAL */}
          <section className={`rounded-[32px] px-8 py-12 text-center sm:px-10 md:px-16 ${surfacePrimary}`}>
            <h2 className={`text-3xl font-semibold md:text-4xl ${textPrimary}`}>
              Prueba KLYCS gratis y descubre cómo simplificar tu negocio.
            </h2>
            <p className={`mt-4 text-base ${textSecondary}`}>
              Crea tu primera tarjeta en minutos. Sin tarjeta de crédito. Sin compromisos.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className={buttonPrimary}>
                  Comenzar ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg" className={buttonOutline}>
                  Ver planes
                </Button>
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Product;

