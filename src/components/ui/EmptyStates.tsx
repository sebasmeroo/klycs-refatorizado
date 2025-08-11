import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  Calendar, 
  BarChart3, 
  Users, 
  Settings,
  Plus,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  Gift,
  Rocket,
  Heart,
  Star,
  TrendingUp,
  Globe,
  Camera,
  Palette,
  Share2,
  DollarSign
} from 'lucide-react';

interface EmptyStateProps {
  type: 'cards' | 'bookings' | 'analytics' | 'contacts' | 'payments' | 'settings' | 'custom';
  title?: string;
  description?: string;
  actionText?: string;
  actionLink?: string;
  onAction?: () => void;
  illustration?: React.ReactNode;
  showFeatures?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionText,
  actionLink,
  onAction,
  illustration,
  showFeatures = true,
  size = 'medium'
}) => {
  const emptyStateConfig = {
    cards: {
      title: 'No tienes tarjetas aún',
      description: 'Crea tu primera tarjeta digital para empezar a compartir tu información profesional de forma elegante.',
      actionText: 'Crear Primera Tarjeta',
      actionLink: '/dashboard/cards/new',
      icon: CreditCard,
      color: 'from-blue-500 to-purple-500',
      features: [
        { icon: Palette, text: 'Diseño 100% personalizable' },
        { icon: Share2, text: 'Comparte con un solo enlace' },
        { icon: BarChart3, text: 'Estadísticas de visualización' },
        { icon: Zap, text: 'Actualizaciones en tiempo real' }
      ]
    },
    bookings: {
      title: 'Sin reservas por el momento',
      description: 'Cuando recibas tu primera reserva, aparecerá aquí. Asegúrate de promocionar tus servicios.',
      actionText: 'Configurar Servicios',
      actionLink: '/dashboard/cards',
      icon: Calendar,
      color: 'from-green-500 to-emerald-500',
      features: [
        { icon: Calendar, text: 'Gestión automática de citas' },
        { icon: DollarSign, text: 'Pagos integrados con Stripe' },
        { icon: Users, text: 'Perfil de clientes' },
        { icon: TrendingUp, text: 'Estadísticas de conversión' }
      ]
    },
    analytics: {
      title: 'Datos insuficientes',
      description: 'Necesitas más actividad en tus tarjetas para generar estadísticas significativas.',
      actionText: 'Compartir Tarjeta',
      actionLink: '/dashboard/cards',
      icon: BarChart3,
      color: 'from-orange-500 to-red-500',
      features: [
        { icon: BarChart3, text: 'Métricas en tiempo real' },
        { icon: Target, text: 'Análisis de audiencia' },
        { icon: Globe, text: 'Fuentes de tráfico' },
        { icon: TrendingUp, text: 'Tendencias de crecimiento' }
      ]
    },
    contacts: {
      title: 'Lista de contactos vacía',
      description: 'A medida que las personas interactúen con tus tarjetas, sus contactos aparecerán aquí.',
      actionText: 'Ver Mis Tarjetas',
      actionLink: '/dashboard/cards',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      features: [
        { icon: Users, text: 'Base de datos de contactos' },
        { icon: Star, text: 'Seguimiento de interacciones' },
        { icon: Heart, text: 'Gestión de relaciones' },
        { icon: Rocket, text: 'CRM integrado' }
      ]
    },
    payments: {
      title: 'Configuración de pagos pendiente',
      description: 'Conecta tu cuenta de Stripe para empezar a recibir pagos por tus servicios.',
      actionText: 'Configurar Stripe',
      actionLink: '/dashboard/payments',
      icon: DollarSign,
      color: 'from-green-500 to-blue-500',
      features: [
        { icon: DollarSign, text: 'Pagos seguros con Stripe' },
        { icon: BarChart3, text: 'Reportes financieros' },
        { icon: Gift, text: 'Cupones y descuentos' },
        { icon: Settings, text: 'Configuración flexible' }
      ]
    },
    settings: {
      title: 'Perfil incompleto',
      description: 'Completa tu perfil para mejorar la experiencia y generar más confianza con tus clientes.',
      actionText: 'Completar Perfil',
      actionLink: '/dashboard/profile',
      icon: Settings,
      color: 'from-slate-500 to-gray-500',
      features: [
        { icon: Users, text: 'Información personal' },
        { icon: Camera, text: 'Foto de perfil' },
        { icon: Globe, text: 'Enlaces sociales' },
        { icon: Settings, text: 'Preferencias' }
      ]
    },
    custom: {
      title: title || 'Sin contenido',
      description: description || 'No hay elementos para mostrar en este momento.',
      actionText: actionText || 'Empezar',
      actionLink: actionLink || '#',
      icon: Sparkles,
      color: 'from-blue-500 to-purple-500',
      features: []
    }
  };

  const config = emptyStateConfig[type];
  const Icon = config.icon;

  const sizeClasses = {
    small: {
      container: 'py-8',
      icon: 'h-12 w-12',
      title: 'text-lg',
      description: 'text-sm',
      button: 'px-4 py-2 text-sm'
    },
    medium: {
      container: 'py-12',
      icon: 'h-16 w-16',
      title: 'text-xl',
      description: 'text-base',
      button: 'px-6 py-3'
    },
    large: {
      container: 'py-16',
      icon: 'h-20 w-20',
      title: 'text-2xl',
      description: 'text-lg',
      button: 'px-8 py-4 text-lg'
    }
  };

  const classes = sizeClasses[size];

  const ActionButton = () => {
    const buttonContent = (
      <div className={`inline-flex items-center space-x-2 ${classes.button} bg-gradient-to-r ${config.color} text-white font-semibold rounded-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg`}>
        <span>{config.actionText}</span>
        <ArrowRight className="h-4 w-4" />
      </div>
    );

    if (onAction) {
      return (
        <button onClick={onAction}>
          {buttonContent}
        </button>
      );
    }

    return (
      <Link to={config.actionLink}>
        {buttonContent}
      </Link>
    );
  };

  return (
    <div className={`text-center ${classes.container}`}>
      {/* Illustration or Icon */}
      <div className="mb-6">
        {illustration || (
          <div className={`${classes.icon} bg-gradient-to-r ${config.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`${size === 'small' ? 'h-6 w-6' : size === 'large' ? 'h-10 w-10' : 'h-8 w-8'} text-white`} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-8">
        <h3 className={`${classes.title} font-bold text-white mb-3`}>
          {config.title}
        </h3>
        <p className={`${classes.description} text-slate-400 max-w-md mx-auto leading-relaxed`}>
          {config.description}
        </p>
      </div>

      {/* Action Button */}
      <div className="mb-8">
        <ActionButton />
      </div>

      {/* Features */}
      {showFeatures && config.features.length > 0 && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h4 className="font-semibold text-white mb-4 flex items-center justify-center space-x-2">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              <span>¿Qué puedes hacer?</span>
            </h4>
            <div className={`grid grid-cols-1 ${config.features.length > 2 ? 'md:grid-cols-2' : ''} gap-4`}>
              {config.features.map((feature, index) => {
                const FeatureIcon = feature.icon;
                return (
                  <div key={index} className="flex items-center space-x-3 text-left">
                    <div className={`h-8 w-8 bg-gradient-to-r ${config.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <FeatureIcon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm text-slate-300">{feature.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Secondary Actions */}
      {type === 'cards' && (
        <div className="mt-8 flex items-center justify-center space-x-4 text-sm">
          <Link 
            to="/dashboard/templates" 
            className="text-slate-400 hover:text-white transition-colors flex items-center space-x-1"
          >
            <Palette className="h-4 w-4" />
            <span>Ver Plantillas</span>
          </Link>
          <span className="text-slate-600">•</span>
          <Link 
            to="/help/getting-started" 
            className="text-slate-400 hover:text-white transition-colors flex items-center space-x-1"
          >
            <Target className="h-4 w-4" />
            <span>Guía de Inicio</span>
          </Link>
        </div>
      )}

      {type === 'bookings' && (
        <div className="mt-8 flex items-center justify-center space-x-4 text-sm">
          <Link 
            to="/dashboard/services" 
            className="text-slate-400 hover:text-white transition-colors flex items-center space-x-1"
          >
            <Settings className="h-4 w-4" />
            <span>Configurar Servicios</span>
          </Link>
          <span className="text-slate-600">•</span>
          <Link 
            to="/dashboard/availability" 
            className="text-slate-400 hover:text-white transition-colors flex items-center space-x-1"
          >
            <Calendar className="h-4 w-4" />
            <span>Horarios</span>
          </Link>
        </div>
      )}

      {type === 'analytics' && (
        <div className="mt-8">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-start space-x-3">
              <Zap className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h4 className="font-medium text-yellow-300 mb-1">💡 Consejo</h4>
                <p className="text-sm text-yellow-200">
                  Comparte tu tarjeta en redes sociales y con contactos para generar más actividad.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componentes específicos para casos de uso comunes
export const EmptyCardsState: React.FC = () => (
  <EmptyState type="cards" size="large" />
);

export const EmptyBookingsState: React.FC = () => (
  <EmptyState type="bookings" size="medium" />
);

export const EmptyAnalyticsState: React.FC = () => (
  <EmptyState type="analytics" size="medium" />
);

export const EmptyContactsState: React.FC = () => (
  <EmptyState type="contacts" size="medium" />
);

export const EmptyPaymentsState: React.FC = () => (
  <EmptyState type="payments" size="medium" />
);

// Estado vacío con animación
export const AnimatedEmptyState: React.FC<EmptyStateProps> = (props) => {
  return (
    <div className="animate-fade-in">
      <EmptyState {...props} />
    </div>
  );
};

// Estado vacío con ilustración personalizada
export const IllustratedEmptyState: React.FC<EmptyStateProps & { 
  illustrationUrl?: string;
  illustrationAlt?: string;
}> = ({ illustrationUrl, illustrationAlt, ...props }) => {
  const customIllustration = illustrationUrl ? (
    <img 
      src={illustrationUrl} 
      alt={illustrationAlt || 'Empty state illustration'} 
      className="w-48 h-48 mx-auto opacity-80"
    />
  ) : undefined;

  return (
    <EmptyState 
      {...props} 
      illustration={customIllustration}
    />
  );
};

export default EmptyState;