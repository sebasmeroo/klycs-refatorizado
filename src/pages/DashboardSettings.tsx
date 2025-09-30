import React, { useMemo, useState } from 'react';
import '@/styles/ios-dashboard.css';
import {
  Settings,
  Shield,
  Bell,
  Palette,
  Plug,
  Globe,
  Clock,
  Languages,
  Mail,
  Smartphone,
  Database,
  Download,
  Trash2,
  CheckCircle,
  Calendar,
  CreditCard
} from 'lucide-react';
import { IOSSection, IOSToggle, IOSSelect } from '@/components/ui/IOSControls';

const accentColors = [
  { name: 'iOS Blue', value: '#007aff' },
  { name: 'Purple', value: '#5856d6' },
  { name: 'Teal', value: '#64d2ff' },
  { name: 'Pink', value: '#ff2d55' },
  { name: 'Orange', value: '#ff9500' },
  { name: 'Green', value: '#34c759' }
];

const DashboardSettings: React.FC = () => {
  const [language, setLanguage] = useState('es-ES');
  const [timezone, setTimezone] = useState('Europe/Madrid');
  const [timeFormat, setTimeFormat] = useState<'24h' | '12h'>('24h');
  const [currency, setCurrency] = useState('EUR');
  const [twoFA, setTwoFA] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [marketingNotif, setMarketingNotif] = useState(false);
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  const [accent, setAccent] = useState<string>('#007aff');

  // Simulaciones de estado de integraciones
  const [gcalConnected, setGcalConnected] = useState<boolean>(false);
  const [stripeConnected, setStripeConnected] = useState<boolean>(true);

  // Aplicar color de acento en tiempo real (solo a nivel UI)
  useMemo(() => {
    document.documentElement.style.setProperty('--ios-accent', accent);
    return () => void 0;
  }, [accent]);

  return (
    <div className="ios-main-content ios-smooth-transition bg-white">
      <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
        {/* Encabezado */}
        <div className="rounded-2xl p-5 border border-black/5 shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="ios-app-icon !w-12 !h-12"><Settings className="text-white" size={20} /></div>
              <div>
                <h1 className="text-[22px] font-semibold text-[#1d1d1f]">Configuración</h1>
                <p className="text-[#8e8e93] text-sm">Gestiona tus preferencias y el comportamiento de la aplicación</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Columna izquierda (secciones) */}
          <div className="space-y-6 xl:col-span-2">
            <IOSSection title="Preferencias generales" icon={<Globe size={16} />} variant="dark">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IOSSelect label="Idioma" value={language} onChange={setLanguage}>
                  <option value="es-ES">Español (España)</option>
                  <option value="es-MX">Español (México)</option>
                  <option value="en-US">English (US)</option>
                </IOSSelect>
                <IOSSelect label="Zona horaria" value={timezone} onChange={setTimezone}>
                  <option value="Europe/Madrid">Europe/Madrid</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                </IOSSelect>
                <IOSSelect label="Formato de hora" value={timeFormat} onChange={(v) => setTimeFormat(v as '24h' | '12h')}>
                  <option value="24h">24 horas</option>
                  <option value="12h">12 horas</option>
                </IOSSelect>
                <IOSSelect label="Moneda" value={currency} onChange={setCurrency}>
                  <option value="EUR">EUR €</option>
                  <option value="USD">USD $</option>
                  <option value="GBP">GBP £</option>
                </IOSSelect>
              </div>
            </IOSSection>

            <IOSSection title="Seguridad" icon={<Shield size={16} />} variant="dark"> 
              <div className="space-y-3">
                <IOSToggle label="Autenticación en dos pasos (2FA)" checked={twoFA} onChange={setTwoFA} />
                <div className="text-sm text-[#8e8e93] flex items-center gap-2">
                  <Clock size={14} />
                  Último cambio de contraseña: hace 3 meses
                </div>
                <button className="ios-link-button mt-2">
                  <KeyIcon />
                  <span className="ml-2">Actualizar contraseña</span>
                </button>
              </div>
            </IOSSection>

            <IOSSection title="Notificaciones" icon={<Bell size={16} />} variant="dark"> 
              <div className="space-y-2">
                <IOSToggle label="Correo electrónico" checked={emailNotif} onChange={setEmailNotif} />
                <IOSToggle label="Push (navegador/móvil)" checked={pushNotif} onChange={setPushNotif} />
                <IOSToggle label="Marketing y anuncios" checked={marketingNotif} onChange={setMarketingNotif} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <IOSSelect label="Frecuencia" value={'instante'} onChange={() => {}}>
                    <option value="instante">En el momento</option>
                    <option value="diario">Resúmen diario</option>
                    <option value="semanal">Resúmen semanal</option>
                  </IOSSelect>
                  <IOSSelect label="Canal preferido" value={'email'} onChange={() => {}}>
                    <option value="email">Email</option>
                    <option value="push">Push</option>
                  </IOSSelect>
                </div>
              </div>
            </IOSSection>

            <IOSSection title="Apariencia" icon={<Palette size={16} />} variant="dark"> 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IOSSelect label="Tema" value={theme} onChange={(v) => setTheme(v as 'system' | 'light' | 'dark')}>
                  <option value="system">Sistema</option>
                  <option value="light">Claro</option>
                  <option value="dark">Oscuro</option>
                </IOSSelect>
                <div className="space-y-1 py-1">
                  <label className="block text-sm text-[#1d1d1f] dark:text-white">Color de acento</label>
                  <div className="flex flex-wrap gap-2">
                    {accentColors.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        aria-label={c.name}
                        onClick={() => setAccent(c.value)}
                        className={`w-8 h-8 rounded-full border border-black/10 transition-transform ios-smooth-transition ${accent === c.value ? 'ring-2 ring-[var(--ios-accent)] scale-105' : 'hover:scale-105'}`}
                        style={{ background: c.value }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-xs text-[#8e8e93]">Los cambios de apariencia se aplican de inmediato a la interfaz.</div>
            </IOSSection>

            <IOSSection title="Integraciones" icon={<Plug size={16} />} variant="dark"> 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Google Calendar */}
                <div className="rounded-2xl p-4 border border-black/5 bg-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="ios-app-icon !w-10 !h-10"><Calendar className="text-white" size={18}/></div>
                    <div>
                      <h3 className="font-semibold text-[16px]">Google Calendar</h3>
                      <p className="text-sm text-[#8e8e93]">Sincroniza tus reservas automáticamente</p>
                    </div>
                  </div>
                  {gcalConnected ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#34c759] flex items-center gap-2"><CheckCircle size={16}/> Conectado</span>
                      <button className="ios-link-button" onClick={() => setGcalConnected(false)}>Desconectar</button>
                    </div>
                  ) : (
                    <button className="ios-cta-button w-full" onClick={() => setGcalConnected(true)}>Conectar</button>
                  )}
                </div>

                {/* Stripe */}
                <div className="rounded-2xl p-4 border border-black/5 bg-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="ios-app-icon !w-10 !h-10"><CreditCard className="text-white" size={18}/></div>
                    <div>
                      <h3 className="font-semibold text-[16px]">Stripe</h3>
                      <p className="text-sm text-[#8e8e93]">Cobros y pagos seguros</p>
                    </div>
                  </div>
                  {stripeConnected ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#34c759] flex items-center gap-2"><CheckCircle size={16}/> Activo</span>
                      <a href="/dashboard/stripe" className="ios-link-button">Abrir detalles</a>
                    </div>
                  ) : (
                    <a href="/dashboard/stripe" className="ios-cta-button w-full">Configurar</a>
                  )}
                </div>
              </div>
            </IOSSection>

          </div>

          {/* Columna derecha (acciones) */}
          <div className="space-y-6">
            <div className="rounded-2xl p-5 border border-black/5 bg-white">
              <h3 className="text-[18px] font-semibold text-[#1d1d1f] mb-1">Privacidad y datos</h3>
              <p className="text-sm text-[#8e8e93] mb-4">Controla tus datos y su exportación</p>
              <div className="space-y-3">
                <button className="ios-link-button w-full justify-center">
                  <Download size={16} className="mr-2" />
                  Exportar datos
                </button>
                <button className="ios-link-button w-full justify-center">
                  <Database size={16} className="mr-2" />
                  Borrar caché local
                </button>
                <button className="ios-clear-button w-full flex items-center justify-center">
                  <Trash2 size={16} className="mr-2" />
                  Eliminar cuenta
                </button>
              </div>
            </div>

            <div className="rounded-2xl p-5 border border-black/5 bg-white">
              <h3 className="text-[18px] font-semibold text-[#1d1d1f] mb-1">Canales de comunicación</h3>
              <p className="text-sm text-[#8e8e93] mb-4">Elige cómo quieres recibir novedades y avisos</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-[#8e8e93]"><Mail size={14}/> Email: {emailNotif ? 'Activado' : 'Desactivado'}</div>
                <div className="flex items-center gap-2 text-sm text-[#8e8e93]"><Smartphone size={14}/> Push: {pushNotif ? 'Activado' : 'Desactivado'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KeyIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M14 10a4 4 0 10-3.999 4.001A3.999 3.999 0 0014 10zm-6 0a2 2 0 112.001 2.001A2 2 0 018 10z"/>
    <path d="M14 12a6 6 0 016-6V4a2 2 0 012-2h2v4h-2v2h-2v2h-2v2h-2a6 6 0 01-6 6v-2a4 4 0 004-4z"/>
  </svg>
);

export { DashboardSettings };
export default DashboardSettings;


