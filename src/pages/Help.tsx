import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Book,
  FileText,
  Video,
  Headphones,
  Mail,
  MessageCircle,
  Search,
  ChevronRight,
  ArrowRight,
  HelpCircle,
  Settings,
  CreditCard,
  Calendar,
  Users,
  LayoutDashboard,
  Shield,
  Zap,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLayoutTheme } from '@/components/layout/Layout';

const resourceCategories = [
  {
    icon: Book,
    title: 'Guías de inicio',
    description: 'Tutoriales paso a paso para crear tu primera tarjeta, configurar servicios y publicar en minutos.',
    items: [
      'Cómo crear tu primera tarjeta digital',
      'Configurar tu perfil y marca personal',
      'Añadir bloques y personalizar diseño',
      'Publicar y compartir tu enlace',
    ],
    link: '/help/getting-started',
  },
  {
    icon: Calendar,
    title: 'Sistema de reservas',
    description: 'Aprende a gestionar calendarios, disponibilidad, confirmaciones automáticas y sincronización.',
    items: [
      'Conectar Google Calendar',
      'Definir disponibilidad y horarios',
      'Gestionar reservas y cancelaciones',
      'Configurar recordatorios automáticos',
    ],
    link: '/help/bookings',
  },
  {
    icon: CreditCard,
    title: 'Pagos y Stripe',
    description: 'Conecta Stripe, gestiona cobros, reembolsos y consulta tus ingresos en tiempo real.',
    items: [
      'Conectar tu cuenta de Stripe',
      'Configurar precios por servicio',
      'Gestionar pagos y reembolsos',
      'Consultar dashboard de ingresos',
    ],
    link: '/help/payments',
  },
  {
    icon: LayoutDashboard,
    title: 'Personalización y diseño',
    description: 'Domina el editor modular, temas, colores, tipografías y optimización de imágenes.',
    items: [
      'Usar el editor drag & drop',
      'Cambiar temas y colores',
      'Optimizar imágenes automáticamente',
      'Crear variantes de tarjetas',
    ],
    link: '/help/design',
  },
  {
    icon: Users,
    title: 'Equipos y colaboración',
    description: 'Gestiona miembros, roles, calendarios compartidos y workflows multi-equipo.',
    items: [
      'Invitar miembros al equipo',
      'Asignar roles y permisos',
      'Compartir calendarios',
      'Workflows para agencias',
    ],
    link: '/help/teams',
  },
  {
    icon: Zap,
    title: 'Analítica y métricas',
    description: 'Entiende tus datos: vistas, clics, conversiones e ingresos. Optimiza tu estrategia.',
    items: [
      'Leer el dashboard de analítica',
      'Métricas por tarjeta y servicio',
      'Identificar enlaces top',
      'Exportar datos para análisis',
    ],
    link: '/help/analytics',
  },
];

const faqItems = [
  {
    question: '¿Puedo usar KLYCS gratis?',
    answer:
      'Sí. El plan Free incluye tarjeta básica, bloques esenciales y acceso al editor. Puedes actualizar a Pro o Business cuando necesites automatizaciones, reservas avanzadas o gestión de equipos.',
  },
  {
    question: '¿Cómo sincronizo mi Google Calendar?',
    answer:
      'Desde tu panel de configuración, en la sección "Calendario", haz clic en "Conectar Google Calendar" y autoriza el acceso. Una vez conectado, tus reservas se sincronizarán automáticamente.',
  },
  {
    question: '¿Puedo aceptar pagos sin Stripe?',
    answer:
      'Sí. Puedes ofrecer reservas gratuitas o solicitar pagos offline. Stripe es opcional y solo necesario si deseas cobrar directamente desde la tarjeta.',
  },
  {
    question: '¿Cómo gestiono múltiples profesionales?',
    answer:
      'En el plan Business, puedes añadir miembros a tu equipo, asignar calendarios y definir roles. Las reservas se asignan automáticamente según disponibilidad.',
  },
  {
    question: '¿Qué es emergencyUIDCheck?',
    answer:
      'Es un diagnóstico técnico para verificar que tu sesión de usuario esté correctamente autenticada. Útil cuando encuentras errores de permisos o datos incompletos.',
  },
  {
    question: '¿Cómo optimizo las imágenes?',
    answer:
      'KLYCS comprime automáticamente las imágenes que subes. También puedes usar la función "diagnoseImages" desde el panel de configuración para detectar imágenes pesadas.',
  },
  {
    question: '¿Puedo duplicar tarjetas?',
    answer:
      'Sí. Desde tu dashboard, selecciona una tarjeta y usa la opción "Duplicar". Útil para crear variantes para diferentes campañas o servicios.',
  },
  {
    question: '¿Qué incluye el modo offline?',
    answer:
      'KLYCS es una PWA (Progressive Web App). Los usuarios pueden ver tu tarjeta sin conexión si la visitaron previamente. Ideal para eventos o zonas con mala conectividad.',
  },
];

const diagnosticTools = [
  {
    icon: AlertCircle,
    name: 'emergencyUIDCheck',
    description: 'Verifica la autenticación de tu sesión y permisos de usuario.',
    action: 'Ejecutar desde Configuración → Diagnósticos',
  },
  {
    icon: Shield,
    name: 'forceAuthRefresh',
    description: 'Refresca tu token de autenticación si experimentas problemas de sesión.',
    action: 'Disponible en panel de configuración',
  },
  {
    icon: Lightbulb,
    name: 'diagnoseImages',
    description: 'Analiza tus imágenes para detectar archivos pesados y sugerir optimizaciones.',
    action: 'Ejecutar desde Configuración → Diagnósticos',
  },
];

const supportChannels = [
  {
    icon: MessageCircle,
    title: 'Chat en vivo',
    description: 'Habla con nuestro equipo de soporte en horario laboral (9:00 - 18:00 CET).',
    action: 'Abrir chat',
    available: true,
  },
  {
    icon: Mail,
    title: 'Soporte por email',
    description: 'Envíanos tus consultas detalladas. Respondemos en menos de 24 horas.',
    action: 'support@klycs.com',
    available: true,
  },
  {
    icon: Video,
    title: 'Tutoriales en video',
    description: 'Aprende con videos cortos sobre cada función de KLYCS.',
    action: 'Ver biblioteca',
    available: true,
  },
  {
    icon: Headphones,
    title: 'Onboarding personalizado',
    description: 'Disponible para clientes Business. Configuración guiada 1:1.',
    action: 'Contactar ventas',
    available: false,
  },
];

export const Help: React.FC = () => {
  const { variant } = useLayoutTheme();
  const isDark = variant === 'dark';
  const [searchQuery, setSearchQuery] = useState('');

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
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-24">
          {/* HERO SECTION */}
          <section className={`relative overflow-hidden rounded-[40px] px-6 py-12 lg:px-16 lg:py-[72px] ${surfacePrimary}`}>
            <div className="space-y-8 text-center max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-4">
                <HelpCircle className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${textMuted}`}>Centro de recursos</p>
              </div>
              <h1 className={`text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl ${textPrimary}`}>
                Te ayudamos a sacar el máximo provecho de KLYCS.
              </h1>
              <p className={`text-base leading-relaxed ${textSecondary}`}>
                Encuentra guías, tutoriales, documentación técnica y soporte para resolver cualquier duda sobre tu tarjeta,
                reservas, pagos o analítica.
              </p>

              {/* BARRA DE BÚSQUEDA */}
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <Search
                    className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 z-10 ${
                      isDark ? 'text-white/40' : 'text-neutral-400'
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="Buscar guías, tutoriales o preguntas frecuentes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full rounded-2xl pl-12 pr-4 py-4 text-base ${
                      isDark
                        ? 'border border-white/20 bg-white/5 text-white placeholder-white/40 focus:border-white/30 focus:ring-white/20 focus:outline-none'
                        : 'border border-neutral-300 bg-white text-neutral-800 placeholder-neutral-400 focus:border-neutral-500 focus:ring-neutral-300 focus:outline-none'
                    }`}
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-4">
                {['Primeros pasos', 'Reservas', 'Pagos', 'Diseño', 'Analítica'].map((tag) => (
                  <button
                    key={tag}
                    className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                      isDark
                        ? 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                        : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300 hover:text-neutral-900'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* CATEGORÍAS DE RECURSOS */}
          <section className="space-y-12">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${textMuted}`}>Categorías de ayuda</p>
              <h2 className={`mt-2 text-3xl font-semibold ${textPrimary}`}>
                Explora guías organizadas por tema y funcionalidad.
              </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {resourceCategories.map(({ icon: Icon, title, description, items, link }) => (
                <div
                  key={title}
                  className={`rounded-3xl p-8 transition-transform duration-300 hover:-translate-y-1 ${surfaceSecondary}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                        isDark ? 'bg-white/10 text-white' : 'bg-neutral-900 text-white'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className={`text-xl font-semibold ${textPrimary}`}>{title}</h3>
                  </div>
                  <p className={`text-sm leading-relaxed mb-4 ${textSecondary}`}>{description}</p>
                  <ul className="space-y-2 mb-6">
                    {items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ChevronRight
                          className={`h-4 w-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                        />
                        <span className={`text-sm ${textSecondary}`}>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={link}
                    className={`inline-flex items-center gap-2 text-sm font-semibold ${
                      isDark ? 'text-white hover:underline' : 'text-neutral-900 hover:underline'
                    }`}
                  >
                    Ver guías completas
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* HERRAMIENTAS DE DIAGNÓSTICO */}
          <section className={`rounded-[32px] px-8 py-12 lg:px-16 ${surfacePrimary}`}>
            <div className="space-y-8">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${textMuted}`}>Herramientas técnicas</p>
                <h2 className={`mt-2 text-3xl font-semibold ${textPrimary}`}>
                  Diagnósticos avanzados para resolver problemas técnicos.
                </h2>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {diagnosticTools.map(({ icon: Icon, name, description, action }) => (
                  <div key={name} className={`rounded-2xl p-6 ${surfaceSecondary}`}>
                    <div
                      className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${
                        isDark ? 'bg-white/10 text-white' : 'bg-neutral-900 text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>{name}</h3>
                    <p className={`text-sm mb-3 ${textSecondary}`}>{description}</p>
                    <p className={`text-xs ${textMuted}`}>{action}</p>
                  </div>
                ))}
              </div>

              <div className={`rounded-2xl p-6 ${surfaceSecondary}`}>
                <div className="flex items-start gap-4">
                  <CheckCircle className={`h-6 w-6 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <div>
                    <p className={`text-sm font-semibold ${textPrimary}`}>Compatibilidad PWA monitorizada</p>
                    <p className={`mt-1 text-xs ${textSecondary}`}>
                      KLYCS funciona como Progressive Web App. Puedes instalarla en tu dispositivo y tus tarjetas estarán
                      disponibles offline si fueron visitadas previamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CANALES DE SOPORTE */}
          <section className="space-y-12">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${textMuted}`}>Contacta con nosotros</p>
              <h2 className={`mt-2 text-3xl font-semibold ${textPrimary}`}>
                Múltiples canales para resolver tus dudas.
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {supportChannels.map(({ icon: Icon, title, description, action, available }) => (
                <div
                  key={title}
                  className={`space-y-4 rounded-3xl p-6 transition-transform duration-300 ${
                    available ? 'hover:-translate-y-1' : 'opacity-60'
                  } ${surfaceSecondary}`}
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
                  <p className={`text-xs font-medium ${available ? textPrimary : textMuted}`}>{action}</p>
                  {!available && (
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                        isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      Solo Business
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className={`rounded-[32px] px-8 py-12 lg:px-16 ${surfacePrimary}`}>
            <div className="space-y-8">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${textMuted}`}>Preguntas frecuentes</p>
                <h2 className={`mt-2 text-3xl font-semibold ${textPrimary}`}>
                  Respuestas rápidas a las dudas más comunes.
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {faqItems.map(({ question, answer }) => (
                  <div key={question} className={`rounded-2xl p-6 ${surfaceSecondary}`}>
                    <h3 className={`text-base font-semibold mb-3 ${textPrimary}`}>{question}</h3>
                    <p className={`text-sm leading-relaxed ${textSecondary}`}>{answer}</p>
                  </div>
                ))}
              </div>

              <div className="text-center pt-6">
                <p className={`text-sm ${textSecondary}`}>¿No encuentras lo que buscas?</p>
                <Link
                  to="/contact"
                  className={`mt-2 inline-flex items-center gap-2 text-sm font-semibold ${
                    isDark ? 'text-white hover:underline' : 'text-neutral-900 hover:underline'
                  }`}
                >
                  Contáctanos directamente
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* CTA FINAL */}
          <section className={`rounded-[32px] px-8 py-12 text-center sm:px-10 md:px-16 ${surfaceSecondary}`}>
            <h2 className={`text-3xl font-semibold md:text-4xl ${textPrimary}`}>
              ¿Listo para empezar con KLYCS?
            </h2>
            <p className={`mt-4 text-base ${textSecondary}`}>
              Crea tu cuenta gratis y accede a todas las guías desde tu panel personalizado.
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

export default Help;

