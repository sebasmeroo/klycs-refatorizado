import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Users,
  Calendar,
  LogIn,
  Mail,
  Search,
  Sparkles,
  LayoutDashboard,
  Smartphone,
  Share2,
  ShieldCheck,
  Clock,
  LineChart,
  Quote,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CollaborativeCalendarService } from '@/services/collaborativeCalendar';
import { authService } from '@/services/auth';
import { useLayoutTheme } from '@/components/layout/Layout';
import { PricingSection } from '@/components/pricing/PricingSection';
import { InteractiveCardPreview } from '@/components/home/InteractiveCardPreview';

interface Highlight {
  label: string;
  value: string;
  helper: string;
}

const highlights: Highlight[] = [
  {
    label: 'Reservas confirmadas',
    value: '70k+',
    helper: 'Gestionadas automáticamente por KLYCS',
  },
  {
    label: 'Tarjetas activas',
    value: '28k',
    helper: 'Profesionales que venden desde un solo enlace',
  },
  {
    label: 'Tiempo de publicación',
    value: '7 min',
    helper: 'Desde la idea hasta tu tarjeta publicada',
  },
];

const featureCards = [
  {
    icon: LayoutDashboard,
    title: 'Edición modular',
    description: 'Arrastra bloques de info, servicios, testimonios y convierte tu tarjeta en una mini web.',
  },
  {
    icon: Smartphone,
    title: 'UX móvil y desktop',
    description: 'Microinteracciones fluidas, animaciones suaves y diseños responsivos listos para compartir.',
  },
  {
    icon: Share2,
    title: 'Link hub inteligente',
    description: 'Integra links, videos, calendarios y funnels en un solo enlace personalizado.',
  },
  {
    icon: ShieldCheck,
    title: 'Automatización confiable',
    description: 'Pagos, recordatorios y confirmaciones con branding propio y métricas en vivo.',
  },
];

const processSteps = [
  {
    icon: Sparkles,
    label: 'Paso 1',
    title: 'Diseña tu experiencia',
    description: 'Selecciona un layout premium, define tu historia y destaca lo que te hace único.',
  },
  {
    icon: Clock,
    label: 'Paso 2',
    title: 'Activa reservas y servicios',
    description: 'Configura disponibilidad, formularios inteligentes y flujos de pago en minutos.',
  },
  {
    icon: LineChart,
    label: 'Paso 3',
    title: 'Analiza y optimiza',
    description: 'Recibe insights de clics, conversiones y rendimiento para ajustar tu estrategia.',
  },
];

const testimonials = [
  {
    quote:
      'Con KLYCS lancé mi tarjeta en menos de una hora. Mis clientes reservan, pagan y reciben recordatorios automáticos.',
    author: 'Sofía Miranda',
    role: 'Consultora de Marketing',
  },
  {
    quote:
      'Los embudos que puedo crear con bloques dinámicos son increíbles; es como tener landing pages vivas.',
    author: 'Daniela Fuentes',
    role: 'Product Designer',
  },
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { variant: layoutVariant } = useLayoutTheme();
  const isDark = layoutVariant === 'dark';

  const [professionalEmail, setProfessionalEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const featureSliderRef = useRef<HTMLDivElement | null>(null);
  const featureAutoplayRef = useRef<number | null>(null);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const totalFeatures = featureCards.length;

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProfessionalEmail(e.target.value);
    setSearchError('');
  }, []);

  const handleProfessionalAccess = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!professionalEmail.trim()) {
      setSearchError('Por favor ingresa tu email');
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      const allCalendars = await CollaborativeCalendarService.findCalendarsByLinkedEmail(
        professionalEmail.trim()
      );

      if (allCalendars.length === 0) {
        const user = await authService.getUserByEmail(professionalEmail.trim());

        if (user) {
          await CollaborativeCalendarService.getUserCalendars(user.uid);
        }

        setSearchError(`No se encontró un calendario asignado al email: ${professionalEmail.trim()}`);
        return;
      }

      const professionalCalendar = allCalendars[0];
      navigate(`/calendar/professional/${professionalCalendar.id}?email=${encodeURIComponent(professionalEmail)}`);
    } catch (error) {
      setSearchError(
        `Error: ${error instanceof Error ? error.message : 'Error desconocido'} - Revisa la consola para más detalles`
      );
    } finally {
      setIsSearching(false);
    }
  };

  const stopFeatureAutoplay = useCallback(() => {
    if (featureAutoplayRef.current !== null) {
      window.clearInterval(featureAutoplayRef.current);
      featureAutoplayRef.current = null;
    }
  }, []);

  const startFeatureAutoplay = useCallback(() => {
    stopFeatureAutoplay();
    if (totalFeatures <= 1) {
      return;
    }
    featureAutoplayRef.current = window.setInterval(() => {
      setActiveFeatureIndex(prev => (prev + 1) % totalFeatures);
    }, 4500);
  }, [stopFeatureAutoplay, totalFeatures]);

  useEffect(() => {
    startFeatureAutoplay();
    return () => {
      stopFeatureAutoplay();
    };
  }, [startFeatureAutoplay, stopFeatureAutoplay]);

  useEffect(() => {
    const container = featureSliderRef.current;
    if (!container) {
      return;
    }

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      let closestIndex = activeFeatureIndex;
      let minDistance = Number.POSITIVE_INFINITY;

      Array.from(container.children).forEach((child, index) => {
        const rect = (child as HTMLElement).getBoundingClientRect();
        const childCenter = rect.left + rect.width / 2;
        const distance = Math.abs(childCenter - containerCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      setActiveFeatureIndex(prev => (prev === closestIndex ? prev : closestIndex));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [activeFeatureIndex, totalFeatures]);

  useEffect(() => {
    const container = featureSliderRef.current;
    if (!container) {
      return;
    }

    const targetChild = container.children[activeFeatureIndex] as HTMLElement | undefined;
    if (!targetChild) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const idealOffset = targetChild.offsetLeft - (containerRect.width - targetChild.offsetWidth) / 2;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const nextOffset = Math.max(0, Math.min(idealOffset, maxScroll));
    container.scrollTo({ left: nextOffset, behavior: 'smooth' });
  }, [activeFeatureIndex]);

  const heroGradient = isDark
    ? 'from-[#111826] via-[#05070f] to-[#0d142d]'
    : 'from-[#f6f7ff] via-[#fffdfa] to-[#eef4ff]';

  const surfaceA = isDark
    ? 'border border-white/10 bg-white/5 backdrop-blur-xl'
    : 'border border-neutral-200 bg-white shadow-xl';

  const surfaceB = isDark ? 'border border-white/10 bg-white/5 backdrop-blur' : 'border border-neutral-200 bg-white';

  const textPrimary = isDark ? 'text-white' : 'text-neutral-900';
  const textSecondary = isDark ? 'text-white/70' : 'text-neutral-600';
  const textMuted = isDark ? 'text-white/60' : 'text-neutral-500';

  const badgeClass = isDark
    ? 'inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70'
    : 'inline-flex items-center gap-2 rounded-full bg-neutral-200 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-600';

  const primaryButton = isDark
    ? 'rounded-full bg-white px-6 text-[#05070f] transition-transform duration-200 hover:-translate-y-1'
    : 'rounded-full bg-neutral-900 px-6 text-white transition-transform duration-200 hover:-translate-y-1';

  const secondaryButton = isDark
    ? 'rounded-full border border-white/30 bg-white/5 px-6 text-white transition-transform duration-200 hover:-translate-y-1 hover:bg-white/10'
    : 'rounded-full border border-neutral-300 bg-white px-6 text-neutral-800 transition-transform duration-200 hover:-translate-y-1 hover:bg-neutral-100';

  const subtleSurface = isDark ? 'border border-white/10 bg-white/5' : 'border border-neutral-200 bg-neutral-50';

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden pb-24">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className={`absolute inset-0 bg-gradient-to-br ${heroGradient}`} />
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
            <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-semibold ${isDark ? 'bg-white/10 text-white' : 'bg-neutral-900 text-white'}`}>
              K
            </span>
            <span className={`text-lg font-semibold tracking-wide ${textPrimary}`}>KLYCS</span>
          </Link>
          <nav className={`hidden items-center gap-8 text-sm font-medium md:flex ${textMuted}`}>
            {[
              { label: 'Producto', to: '/product' },
              { label: 'Plantillas', to: '/services' },
              { label: 'Planes', to: '/pricing' },
              { label: 'Recursos', to: '/help' },
            ].map(({ label, to }) => (
              <Link key={label} to={to} className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-neutral-900'}`}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/contact"
              className={`hidden text-sm font-medium md:inline-flex ${isDark ? 'text-white/60 hover:text-white' : 'text-neutral-500 hover:text-neutral-800'}`}
            >
              Contáctanos
            </Link>
            <Link to="/login">
              <Button
                variant="outline"
                size="sm"
                className={isDark ? 'border-white/20 bg-white/5 text-white hover:bg-white hover:text-[#05070f]' : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-900 hover:text-white'}
              >
                Ingresar
              </Button>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* HERO */}
          <section className={`relative overflow-hidden rounded-[28px] px-4 py-8 sm:rounded-[40px] sm:px-6 sm:py-12 lg:px-16 lg:py-[72px] ${surfaceA}`}>
            <div className="space-y-6 sm:space-y-10">
              <div className="text-center max-w-3xl mx-auto space-y-5 sm:space-y-6">
                <div className={`${badgeClass} inline-flex text-[10px] sm:text-xs px-3 py-1 sm:px-4`}>Tarjetas digitales activas</div>
                <h1 className={`text-2xl font-semibold leading-tight sm:text-4xl lg:text-5xl ${textPrimary}`}>
                  Lanza una tarjeta inmersiva, automatiza reservas y mantén tu marca en un solo enlace.
                </h1>
                <p className={`text-sm leading-relaxed sm:text-lg ${textSecondary}`}>
                  Diseña experiencias interactivas con bloques inteligentes, sincroniza calendarios y entiende qué convierte mejor en cada campaña.
                </p>

                <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
                  <Link to="/register">
                    <Button size="lg" className={`${primaryButton} px-5 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base`}>
                      Crear mi tarjeta ahora
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/services">
                    <Button variant="outline" size="lg" className={`${secondaryButton} px-5 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base`}>
                      Ver plantillas
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:gap-4 sm:grid-cols-3 max-w-4xl mx-auto">
                {highlights.map(({ label, value, helper }) => (
                  <div
                    key={label}
                    className={`rounded-2xl px-5 py-4 sm:rounded-3xl sm:px-6 sm:py-5 transition duration-200 ${
                      isDark ? 'border border-white/15 bg-white/5 text-white' : 'border border-neutral-200 bg-white text-neutral-800 shadow-sm'
                    }`}
                  >
                    <p className={`text-xl sm:text-2xl font-semibold ${textPrimary}`}>{value}</p>
                    <p className={`mt-1 text-[11px] sm:text-xs uppercase tracking-[0.25em] ${textMuted}`}>{label}</p>
                    <p className={`mt-2 text-xs ${textSecondary}`}>{helper}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PREVIEW INTERACTIVO */}
          <section className={`hidden lg:block rounded-[40px] px-6 py-12 lg:px-16 lg:py-16 ${surfaceA}`}>
            <div className="text-center mb-12">
              <div className={`${badgeClass} inline-flex mb-4`}>
                <Sparkles className="h-4 w-4 mr-2" />
                Prueba interactiva
              </div>
              <h2 className={`text-3xl font-semibold mb-4 ${textPrimary}`}>
                Experimenta con tu propia tarjeta digital
              </h2>
              <p className={`text-base ${textSecondary} max-w-2xl mx-auto`}>
                Cambia colores, edita enlaces, modifica servicios y personaliza el portfolio. Todo en tiempo real.
              </p>
            </div>
            <InteractiveCardPreview />
          </section>

          {/* FEATURES */}
          <section className="mt-24 space-y-12">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${textMuted}`}>Valor en cada tarjeta</p>
                <h2 className={`mt-2 text-3xl font-semibold ${textPrimary}`}>
                  Todo lo que necesitas para convertir visitas en reservas reales.
                </h2>
              </div>
              <Link to="/services" className="inline-flex">
                <Button variant="outline" className={secondaryButton}>
                  Explorar plantillas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="md:hidden">
              <div
                ref={featureSliderRef}
                className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth gap-4 px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                onTouchStart={stopFeatureAutoplay}
                onTouchEnd={startFeatureAutoplay}
                onMouseEnter={stopFeatureAutoplay}
                onMouseLeave={startFeatureAutoplay}
              >
                {featureCards.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="flex-shrink-0 snap-center w-[calc(100%-1.5rem)]">
                    <div className={`h-full space-y-4 rounded-3xl p-5 transition-transform duration-300 ${surfaceB}`}>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isDark ? 'bg-white/10 text-white' : 'bg-neutral-900 text-white'}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className={`text-lg font-semibold ${textPrimary}`}>{title}</h3>
                      <p className={`text-sm leading-relaxed ${textSecondary}`}>{description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex justify-center gap-2">
                {featureCards.map(({ title }, index) => (
                  <button
                    key={title}
                    type="button"
                    aria-label={`Ver ${title}`}
                    className={`h-2 rounded-full transition-all ${activeFeatureIndex === index
                      ? `w-6 ${isDark ? 'bg-white' : 'bg-neutral-900'}`
                      : `w-2 ${isDark ? 'bg-white/30' : 'bg-neutral-400/60'}`
                    }`}
                    onClick={() => {
                      setActiveFeatureIndex(index);
                      startFeatureAutoplay();
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="hidden md:grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {featureCards.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className={`space-y-4 rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-1 ${surfaceB}`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isDark ? 'bg-white/10 text-white' : 'bg-neutral-900 text-white'}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className={`text-lg font-semibold ${textPrimary}`}>{title}</h3>
                  <p className={`text-sm leading-relaxed ${textSecondary}`}>{description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* PROCESS */}
          <section className={`mt-24 grid gap-10 rounded-[32px] px-8 py-10 sm:px-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] ${surfaceB}`}>
            <div className="space-y-6">
              <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${textMuted}`}>Flujo completo</p>
              <h2 className={`text-3xl font-semibold ${textPrimary}`}>
                Publica en minutos, automatiza reservas y escala con datos.
              </h2>
              <p className={`text-sm leading-relaxed ${textSecondary}`}>
                Cada paso está diseñado para lanzar rápido, mantener tu contenido actualizado y entender cómo interactúan tus clientes con tu tarjeta.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {processSteps.map(({ icon: Icon, label, title, description }) => (
                <div
                  key={title}
                  className={`relative rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-1 ${surfaceB}`}
                >
                  <span className={`text-xs font-semibold uppercase tracking-[0.4em] ${textMuted}`}>{label}</span>
                  <div className={`mt-4 flex h-12 w-12 items-center justify-center rounded-2xl ${isDark ? 'bg-white/10 text-white' : 'bg-neutral-900 text-white'}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className={`mt-6 text-lg font-semibold ${textPrimary}`}>{title}</h3>
                  <p className={`mt-3 text-sm leading-relaxed ${textSecondary}`}>{description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ACCESS */}
          <section className={`mt-24 grid gap-12 rounded-[32px] px-8 py-12 sm:px-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] ${surfaceB}`}>
            <div className="space-y-6">
              <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${textMuted}`}>Acceso inmediato</p>
              <h2 className={`text-3xl font-semibold ${textPrimary}`}>
                Profesionales y equipos se conectan desde cualquier dispositivo.
              </h2>
              <p className={`text-sm leading-relaxed ${textSecondary}`}>
                Usa tu email corporativo para ingresar a tu calendario personalizado. Gestiona horarios, confirma reservas y mantén todo sincronizado con tu equipo.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className={`rounded-2xl p-4 text-sm ${surfaceB} ${textSecondary}`}>
                  <p className={`font-semibold ${textPrimary}`}>Reconocimiento automático</p>
                  <p>Relacionamos tu correo con tus tarjetas y calendarios en segundos.</p>
                </div>
                <div className={`rounded-2xl p-4 text-sm ${surfaceB} ${textSecondary}`}>
                  <p className={`font-semibold ${textPrimary}`}>Seguridad integrada</p>
                  <p>Autenticación y permisos alineados con tu organización.</p>
                </div>
              </div>
            </div>
            <div className={`rounded-3xl p-6 ${isDark ? 'border border-white/10 bg-[#0b1220] shadow-2xl' : 'border border-neutral-200 bg-white shadow-xl'}`}>
              <form onSubmit={handleProfessionalAccess} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="professional-email" className={`block text-sm font-semibold ${textPrimary}`}>
                    Email del profesional
                  </label>
                  <div className="relative">
                    <Mail className={`pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-neutral-400'}`} />
                    <Input
                      key="professional-email-search-stable-input"
                      id="professional-email"
                      type="email"
                      placeholder="tu-email@ejemplo.com"
                      value={professionalEmail}
                      onChange={handleEmailChange}
                      className={
                        isDark
                          ? 'pl-10 border-white/20 bg-white/5 text-white placeholder-white/40 focus:border-white/30 focus:ring-white/20'
                          : 'pl-10 border-neutral-300 bg-white text-neutral-800 placeholder-neutral-400 focus:border-neutral-500 focus:ring-neutral-300'
                      }
                      disabled={isSearching}
                    />
                  </div>
                </div>

                {searchError && (
                  <div className={`rounded-2xl border p-3 ${isDark ? 'border-red-500/40 bg-red-500/20 text-red-100' : 'border-red-200 bg-red-50 text-red-600'}`}>
                    <p className="text-sm">{searchError}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className={
                    isDark
                      ? 'w-full rounded-full bg-white py-3 text-[#05070f] transition-transform duration-200 hover:-translate-y-1 hover:bg-white/90'
                      : 'w-full rounded-full bg-neutral-900 py-3 text-white transition-transform duration-200 hover:-translate-y-1 hover:bg-neutral-800'
                  }
                  disabled={isSearching}
                  size="lg"
                >
                  {isSearching ? (
                    <>
                      <Search className="mr-2 h-4 w-4 animate-spin" />
                      Buscando calendario...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Acceder a mi calendario
                    </>
                  )}
                </Button>
              </form>
              <p className={`mt-4 text-center text-xs ${textSecondary}`}>
                ¿Problemas con tu acceso? Contacta a tu administrador para validar tus permisos.
              </p>
            </div>
          </section>

          {/* PRICING */}
          <PricingSection isDark={isDark} />

          {/* TESTIMONIOS */}
          <section className="mt-24 grid gap-6 md:grid-cols-2">
            {testimonials.map(({ quote, author, role }) => (
              <div
                key={author}
                className={`rounded-3xl p-8 transition-transform duration-200 hover:-translate-y-1 ${surfaceB}`}
              >
                <Quote className={`mb-4 h-8 w-8 ${isDark ? 'text-white/30' : 'text-neutral-300'}`} />
                <p className={`text-lg leading-relaxed ${textSecondary}`}>{quote}</p>
                <div className="mt-6 space-y-1">
                  <p className={`text-sm font-semibold ${textPrimary}`}>{author}</p>
                  <p className={`text-xs uppercase tracking-[0.25em] ${textMuted}`}>{role}</p>
                </div>
              </div>
            ))}
          </section>

          {/* FINAL CTA */}
          <section className={`mt-24 rounded-[32px] px-8 py-12 text-center sm:px-10 md:px-16 ${surfaceB}`}>
            <h2 className={`text-3xl font-semibold md:text-4xl ${textPrimary}`}>
              ¿Listo para lanzar tu próxima tarjeta profesional?
            </h2>
            <p className={`mt-4 text-base ${textSecondary}`}>
              Conecta servicios, pagos y analítica en minutos. Haz que cada interacción cuente.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className={primaryButton}>
                  Empezar gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg" className={secondaryButton}>
                  Ver planes
                </Button>
              </Link>
            </div>
          </section>
        </main>
      </div>

      <footer className={`${isDark ? 'border-t border-white/10 bg-[#04050c]' : 'border-t border-neutral-200 bg-[#f8f6f2]'}`}>
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="space-y-4 md:col-span-2">
              <Link to="/" className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-bold ${isDark ? 'bg-white/10 text-white' : 'bg-neutral-900 text-white'}`}>
                  K
                </span>
                <span className={`text-lg font-semibold ${textPrimary}`}>KLYCS</span>
              </Link>
              <p className={`text-sm ${textSecondary}`}>
                La plataforma líder para crear tarjetas digitales profesionales con reservas inteligentes, analítica y branding premium.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className={`font-semibold ${textPrimary}`}>Explora</h4>
              <div className={`space-y-2 text-sm ${textSecondary}`}>
                <Link to="/demo" className={`block ${isDark ? 'hover:text-white' : 'hover:text-neutral-900'}`}>
                  Tarjetas demo
                </Link>
                <Link to="/pricing" className={`block ${isDark ? 'hover:text-white' : 'hover:text-neutral-900'}`}>
                  Planes y precios
                </Link>
                <Link to="/services" className={`block ${isDark ? 'hover:text-white' : 'hover:text-neutral-900'}`}>
                  Directorio de plantillas
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className={`font-semibold ${textPrimary}`}>Recursos</h4>
              <div className={`space-y-2 text-sm ${textSecondary}`}>
                <Link to="/help" className={`block ${isDark ? 'hover:text-white' : 'hover:text-neutral-900'}`}>
                  Centro de ayuda
                </Link>
                <Link to="/terms" className={`block ${isDark ? 'hover:text-white' : 'hover:text-neutral-900'}`}>
                  Términos
                </Link>
                <Link to="/privacy" className={`block ${isDark ? 'hover:text-white' : 'hover:text-neutral-900'}`}>
                  Privacidad
                </Link>
              </div>
            </div>
          </div>

          <div className={`mt-12 rounded-3xl p-6 ${isDark ? 'border border-white/10 bg-white/5 text-white/70' : 'border border-neutral-200 bg-white text-neutral-600 shadow-lg'}`}>
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className={`text-base font-semibold ${textPrimary}`}>KLYCS Business</p>
                <p className={`mt-1 text-sm ${textSecondary}`}>
                  Panel centralizado para equipos, plantillas avanzadas y workflows multi-marca.
                </p>
              </div>
              <Link to="/admin/login">
                <Button
                  size="sm"
                  className={isDark ? 'inline-flex items-center rounded-full bg-white px-5 text-[#05070f] hover:bg-white/90' : 'inline-flex items-center rounded-full bg-neutral-900 px-5 text-white hover:bg-neutral-800'}
                >
                  Acceder al panel
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <p className={`text-xs ${textSecondary}`}>Solo para administradores autorizados</p>
            </div>
          </div>

          <div className={`mt-10 flex flex-col gap-4 border-t pt-6 text-sm sm:flex-row sm:items-center sm:justify-between ${isDark ? 'border-white/10 text-white/60' : 'border-neutral-200 text-neutral-500'}`}>
            <p>© 2024 KLYCS. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              <span>Hecho para creadores y consultores.</span>
              <Link to="/privacy" className={isDark ? 'hover:text-white' : 'hover:text-neutral-900'}>
                Privacidad
              </Link>
              <Link to="/terms" className={isDark ? 'hover:text-white' : 'hover:text-neutral-900'}>
                Términos
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
