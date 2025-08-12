import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Palette, 
  Zap, 
  Star,
  Heart,
  Award,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Shield
} from 'lucide-react';
import { EasyWeekStyleBookingSystem } from './EasyWeekStyleBookingSystem';
import { MobileOptimizedBooking } from './MobileOptimizedBooking';
import { BookingThemeProvider, useBookingTheme, BookingThemeSelector } from './BookingThemeSystem';
import { ModernSelect, ModernChip, PremiumServiceCard, BusinessInfoCard } from './ModernUIComponents';

interface EasyWeekBookingShowcaseProps {
  cardId: string;
  className?: string;
}

// Mock data para el showcase
const mockServices = [
  {
    id: '1',
    name: 'Consulta Médica General',
    description: 'Revisión médica completa con análisis de síntomas y recomendaciones personalizadas para tu bienestar.',
    duration: 45,
    price: 75,
    originalPrice: 90,
    isActive: true,
    category: 'Medicina General',
    icon: '🏥',
    rating: 4.8,
    reviewCount: 247,
    isPopular: true,
    features: ['Consulta completa', 'Informe detallado', 'Seguimiento 15 días']
  },
  {
    id: '2',
    name: 'Limpieza Dental Profunda',
    description: 'Limpieza dental profesional con fluorización y revisión completa de la salud bucal.',
    duration: 60,
    price: 85,
    isActive: true,
    category: 'Odontología',
    icon: '🦷',
    rating: 4.9,
    reviewCount: 183,
    isPremium: true,
    features: ['Limpieza profunda', 'Fluorización', 'Consejos personalizados']
  },
  {
    id: '3',
    name: 'Masaje Relajante',
    description: 'Sesión de masaje terapéutico para aliviar tensiones y estrés. Incluye aromaterapia.',
    duration: 90,
    price: 65,
    isActive: true,
    category: 'Bienestar',
    icon: '💆‍♀️',
    rating: 4.7,
    reviewCount: 156,
    features: ['Masaje completo', 'Aromaterapia', 'Música relajante']
  },
  {
    id: '4',
    name: 'Entrenamiento Personal',
    description: 'Sesión de entrenamiento personalizado con instructor certificado. Plan adaptado a tus objetivos.',
    duration: 60,
    price: 45,
    isActive: true,
    category: 'Fitness',
    icon: '💪',
    rating: 4.6,
    reviewCount: 89,
    isPopular: true,
    features: ['Plan personalizado', 'Instructor certificado', 'Seguimiento de progreso']
  },
  {
    id: '5',
    name: 'Sesión de Psicología',
    description: 'Consulta psicológica individual para apoyo emocional y desarrollo personal.',
    duration: 50,
    price: 80,
    isActive: true,
    category: 'Salud Mental',
    icon: '🧠',
    rating: 4.9,
    reviewCount: 234,
    isPremium: true,
    features: ['Sesión individual', 'Enfoque personalizado', 'Seguimiento continuo']
  },
  {
    id: '6',
    name: 'Tratamiento Facial',
    description: 'Limpieza facial profunda con tratamiento anti-edad y hidratación intensiva.',
    duration: 75,
    price: 95,
    originalPrice: 120,
    isActive: true,
    category: 'Estética',
    icon: '✨',
    rating: 4.8,
    reviewCount: 167,
    features: ['Limpieza profunda', 'Anti-edad', 'Hidratación']
  }
];

const mockBusinessInfo = {
  name: 'Centro de Bienestar KLYCS',
  description: 'Tu centro integral de salud y bienestar. Ofrecemos servicios médicos, de belleza y fitness con los mejores profesionales.',
  address: 'Calle Gran Vía, 123, 28013 Madrid',
  phone: '+34 91 123 45 67',
  email: 'info@klycs.com',
  rating: 4.8,
  reviewCount: 1247,
  features: ['Cita Online', 'Parking Gratuito', 'WiFi', 'Acceso Discapacitados', 'Sala de Espera']
};

const EasyWeekBookingShowcaseContent: React.FC<EasyWeekBookingShowcaseProps> = ({
  cardId,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile' | 'preview'>('desktop');
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const { currentTheme } = useBookingTheme();

  const handleBookingComplete = (booking: any) => {
    console.log('Booking completed:', booking);
    // Aquí se manejaría la reserva completada
  };

  const handleBookingError = (error: string) => {
    console.error('Booking error:', error);
    // Aquí se manejaría el error
  };

  const DeviceSelector = () => (
    <div className="flex items-center space-x-2 bg-white rounded-xl p-2 shadow-sm border border-gray-200">
      <motion.button
        onClick={() => setViewMode('desktop')}
        className={`p-3 rounded-lg transition-all ${
          viewMode === 'desktop' 
            ? 'bg-emerald-500 text-white shadow-md' 
            : 'text-gray-600 hover:bg-gray-100'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Monitor className="w-5 h-5" />
      </motion.button>
      
      <motion.button
        onClick={() => setViewMode('mobile')}
        className={`p-3 rounded-lg transition-all ${
          viewMode === 'mobile' 
            ? 'bg-emerald-500 text-white shadow-md' 
            : 'text-gray-600 hover:bg-gray-100'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Smartphone className="w-5 h-5" />
      </motion.button>
      
      <motion.button
        onClick={() => setViewMode('preview')}
        className={`p-3 rounded-lg transition-all ${
          viewMode === 'preview' 
            ? 'bg-emerald-500 text-white shadow-md' 
            : 'text-gray-600 hover:bg-gray-100'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Star className="w-5 h-5" />
      </motion.button>
    </div>
  );

  const ThemeControls = () => (
    <div className="flex items-center space-x-3">
      <motion.button
        onClick={() => setShowThemeSelector(!showThemeSelector)}
        className="flex items-center space-x-2 bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-200 hover:shadow-md transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Palette className="w-5 h-5 text-emerald-600" />
        <span className="font-medium text-gray-700">Temas</span>
      </motion.button>
      
      <div className="flex items-center space-x-2 bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-200">
        <div 
          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: currentTheme.colors.primary }}
        />
        <span className="text-sm font-medium text-gray-700">{currentTheme.name}</span>
      </div>
    </div>
  );

  const PreviewMode = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center space-x-2 bg-emerald-50 px-4 py-2 rounded-full">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <span className="text-emerald-700 font-semibold">Sistema de Reservas Avanzado</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
          Reservas al estilo
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">
            EasyWeek
          </span>
        </h1>
        
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Sistema completo de reservas con diseño moderno, animaciones fluidas y experiencia optimizada para todos los dispositivos.
        </p>
      </motion.div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"
          whileHover={{ y: -4, shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Súper Rápido</h3>
          <p className="text-gray-600">
            Reservas en menos de 60 segundos con flujo optimizado y validación en tiempo real.
          </p>
        </motion.div>

        <motion.div
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"
          whileHover={{ y: -4, shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
            <Smartphone className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Mobile First</h3>
          <p className="text-gray-600">
            Experiencia perfecta en móvil con gestos intuitivos y diseño responsivo.
          </p>
        </motion.div>

        <motion.div
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"
          whileHover={{ y: -4, shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Súper Seguro</h3>
          <p className="text-gray-600">
            Validación avanzada, notificaciones automáticas y gestión inteligente de conflictos.
          </p>
        </motion.div>
      </div>

      {/* Business Info Card */}
      <div className="max-w-lg mx-auto">
        <BusinessInfoCard business={mockBusinessInfo} />
      </div>

      {/* Services Showcase */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Servicios Disponibles</h2>
          <p className="text-gray-600">Diseño de tarjetas moderno con toda la información necesaria</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockServices.slice(0, 3).map((service) => (
            <PremiumServiceCard
              key={service.id}
              service={service}
              onSelect={() => console.log('Service selected:', service.id)}
            />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 text-white">
        <div className="grid md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold mb-2">150ms</div>
            <div className="text-emerald-100">Tiempo de carga</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">98%</div>
            <div className="text-emerald-100">Satisfacción</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">6</div>
            <div className="text-emerald-100">Temas incluidos</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">24/7</div>
            <div className="text-emerald-100">Disponibilidad</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">KLYCS Booking</span>
              </div>
              
              <div className="hidden md:flex items-center space-x-2">
                <ModernChip variant="success" size="sm" icon={<Zap className="w-3 h-3" />}>
                  EasyWeek Style
                </ModernChip>
                <ModernChip variant="primary" size="sm" icon={<Award className="w-3 h-3" />}>
                  Premium
                </ModernChip>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeControls />
              <DeviceSelector />
            </div>
          </div>
        </div>
      </div>

      {/* Theme Selector Modal */}
      <AnimatePresence>
        {showThemeSelector && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowThemeSelector(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Seleccionar Tema</h2>
                <button
                  onClick={() => setShowThemeSelector(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <BookingThemeSelector onThemeChange={() => setShowThemeSelector(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <AnimatePresence mode="wait">
          {viewMode === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PreviewMode />
            </motion.div>
          )}
          
          {viewMode === 'desktop' && (
            <motion.div
              key="desktop"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <EasyWeekStyleBookingSystem
                cardId={cardId}
                services={mockServices}
                onBookingComplete={handleBookingComplete}
                onBookingError={handleBookingError}
                businessInfo={mockBusinessInfo}
                cardOwnerEmail="owner@klycs.com"
                cardTitle="Centro KLYCS"
              />
            </motion.div>
          )}
          
          {viewMode === 'mobile' && (
            <motion.div
              key="mobile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
                <MobileOptimizedBooking
                  cardId={cardId}
                  services={mockServices}
                  onBookingComplete={handleBookingComplete}
                  onBookingError={handleBookingError}
                  businessInfo={mockBusinessInfo}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const EasyWeekBookingShowcase: React.FC<EasyWeekBookingShowcaseProps> = (props) => {
  return (
    <BookingThemeProvider initialThemeId="easyweek-modern">
      <EasyWeekBookingShowcaseContent {...props} />
    </BookingThemeProvider>
  );
};