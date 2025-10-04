import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Palette,
  Smartphone,
  Video,
  Users,
  Sparkles,
  ArrowRight,
  Check,
  Star,
  Zap,
  Heart,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useLayoutTheme } from '@/components/layout/Layout';

const templates = [
  {
    name: 'Consultor Digital',
    description: 'Ideal para coaches, mentores y consultores. Incluye calendario de sesiones, paquetes de servicios y testimonios.',
    icon: Users,
    color: 'from-blue-500 to-cyan-500',
    features: ['Calendario integrado', 'Paquetes de servicios', 'Testimonios', 'Formulario de contacto'],
    popular: false,
  },
  {
    name: 'Estudio Creativo',
    description: 'Perfecto para diseñadores, fotógrafos y estudios. Portfolio destacado, galería y casos de estudio.',
    icon: Palette,
    color: 'from-purple-500 to-pink-500',
    features: ['Portfolio visual', 'Galería de proyectos', 'Casos de estudio', 'Solicitud de presupuesto'],
    popular: true,
  },
  {
    name: 'Wellness & Salud',
    description: 'Para terapeutas, nutricionistas y entrenadores. Reservas de sesiones, planes personalizados y blog.',
    icon: Heart,
    color: 'from-green-500 to-emerald-500',
    features: ['Sistema de reservas', 'Planes personalizados', 'Blog de contenido', 'Área de recursos'],
    popular: false,
  },
  {
    name: 'Agencia Digital',
    description: 'Para agencias y equipos. Multi-profesional, calendarios compartidos y gestión de proyectos.',
    icon: TrendingUp,
    color: 'from-orange-500 to-red-500',
    features: ['Multi-profesional', 'Calendarios compartidos', 'Gestión de equipo', 'Analytics avanzado'],
    popular: false,
  },
];

const featureBlocks = [
  {
    icon: LayoutDashboard,
    title: 'Bloques modulares',
    description: 'Arrastra y suelta bloques de contenido: hero, servicios, testimonios, portfolio, FAQ, formularios y más.',
  },
  {
    icon: Palette,
    title: 'Diseño personalizable',
    description: 'Cambia colores, tipografías y estilos en segundos. Tu marca, tu estilo.',
  },
  {
    icon: Calendar,
    title: 'Reservas integradas',
    description: 'Sistema de calendario completo con confirmaciones automáticas y sincronización con Google Calendar.',
  },
  {
    icon: Video,
    title: 'Contenido rico',
    description: 'Embeds de video, carousels de imágenes, animaciones suaves y efectos visuales premium.',
  },
  {
    icon: Smartphone,
    title: 'Responsive perfecto',
    description: 'Diseñado para móvil primero. Tu tarjeta se ve perfecta en cualquier dispositivo.',
  },
  {
    icon: Zap,
    title: 'Carga ultrarrápida',
    description: 'Optimización automática de imágenes y código. Carga en menos de 2 segundos.',
  },
];

const templateShowcase = [
  {
    title: 'Claudia Estudio',
    subtitle: 'Consultoría Creativa',
    tags: ['Diseño', 'Branding', 'UX/UI'],
    bookings: 156,
    rating: 4.9,
  },
  {
    title: 'Dr. Martín López',
    subtitle: 'Psicología Clínica',
    tags: ['Terapia', 'Wellness', 'Online'],
    bookings: 243,
    rating: 5.0,
  },
  {
    title: 'FitLife Studio',
    subtitle: 'Entrenamiento Personal',
    tags: ['Fitness', 'Nutrición', 'Yoga'],
    bookings: 387,
    rating: 4.8,
  },
];

export const Services: React.FC = () => {
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
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-8">
                <div className={`inline-flex items-center gap-2 rounded-full ${isDark ? 'bg-white/10 text-white/70' : 'bg-neutral-200 text-neutral-600'} px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]`}>
                  <Sparkles className="h-4 w-4" />
                  Plantillas profesionales
                </div>
                <h1 className={`text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl ${textPrimary}`}>
                  Elige una plantilla y personalízala en minutos.
                </h1>
                <p className={`text-base leading-relaxed ${textSecondary}`}>
                  Cada plantilla incluye bloques prediseñados, sistema de reservas, portfolio y todos los elementos que
                  necesitas para empezar. Ajusta colores, contenido y estilo sin código.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/register">
                    <Button size="lg" className={buttonPrimary}>
                      Crear mi tarjeta
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/product">
                    <Button variant="outline" size="lg" className={buttonOutline}>
                      Ver características
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                {templateShowcase.map((template, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-1 ${
                      isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-neutral-200 shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className={`text-lg font-semibold ${textPrimary}`}>{template.title}</h3>
                        <p className={`text-sm ${textSecondary}`}>{template.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className={`h-4 w-4 ${isDark ? 'text-yellow-400' : 'text-yellow-500'} fill-current`} />
                        <span className={`text-sm font-semibold ${textPrimary}`}>{template.rating}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {template.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-xs rounded-full px-2 py-1 ${
                            isDark ? 'bg-white/10 text-white/70' : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className={`text-xs ${textMuted}`}>
                      {template.bookings} reservas confirmadas este mes
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PLANTILLAS DESTACADAS */}
          <section className="space-y-12">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${textMuted}`}>
                Plantillas destacadas
              </p>
              <h2 className={`mt-2 text-3xl font-semibold ${textPrimary}`}>
                Diseños optimizados para cada profesión.
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {templates.map((template) => {
                const Icon = template.icon;
                return (
                  <div
                    key={template.name}
                    className={`relative rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1 ${surfaceSecondary}`}
                  >
                    {template.popular && (
                      <div className="absolute -top-3 right-6">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            isDark
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          }`}
                        >
                          <Sparkles className="h-3 w-3" />
                          Popular
                        </span>
                      </div>
                    )}
                    <div className="flex items-start gap-4 mb-6">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${template.color} shadow-lg`}
                      >
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h3 className={`text-xl font-semibold ${textPrimary}`}>{template.name}</h3>
                        <p className={`text-sm mt-1 ${textSecondary}`}>{template.description}</p>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {template.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          <Check className={`h-5 w-5 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          <span className={`text-sm ${textSecondary}`}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>

          {/* CARACTERÍSTICAS */}
          <section className={`rounded-[32px] px-8 py-12 lg:px-16 ${surfacePrimary}`}>
            <div className="space-y-12">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${textMuted}`}>
                  Incluido en todas las plantillas
                </p>
                <h2 className={`mt-2 text-3xl font-semibold ${textPrimary}`}>
                  Funcionalidades completas desde el primer día.
                </h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {featureBlocks.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.title} className={`rounded-2xl p-6 ${surfaceSecondary}`}>
                      <div
                        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
                          isDark ? 'bg-white/10 text-white' : 'bg-neutral-900 text-white'
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>{feature.title}</h3>
                      <p className={`text-sm leading-relaxed ${textSecondary}`}>{feature.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* CTA FINAL */}
          <section className={`rounded-[32px] px-8 py-12 text-center sm:px-10 md:px-16 ${surfacePrimary}`}>
            <h2 className={`text-3xl font-semibold md:text-4xl ${textPrimary}`}>
              Elige tu plantilla y lanza tu tarjeta hoy mismo.
            </h2>
            <p className={`mt-4 text-base ${textSecondary}`}>
              Todas las plantillas son completamente personalizables. Cambia colores, bloques y contenido en minutos.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className={buttonPrimary}>
                  Comenzar gratis
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

export default Services;
