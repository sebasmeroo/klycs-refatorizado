import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRealTimeStats } from '@/hooks/useRealTimeStats';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentActivity from '@/components/dashboard/RecentActivity';
import TopCards from '@/components/dashboard/TopCards';
import '@/styles/ios-dashboard.css';
import {
  TrendingUp,
  Users,
  CreditCard,
  DollarSign,
  Eye,
  MousePointer,
  Calendar,
  Star,
  Plus,
  Clock,
  Lightbulb,
  Target,
  Palette,
  Zap,
  Heart,
  MessageCircle,
  Share2,
  Settings,
  Camera,
  Trophy,
  Brain,
  Rocket,
  ChevronRight,
  Crown,
  Diamond,
  BarChart3,
  RefreshCw
} from 'lucide-react';

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const { stats, loading, error, refresh } = useRealTimeStats();

  // Configuración de las métricas principales
  const statsConfig = [
    {
      title: 'Vistas Totales',
      key: 'totalViews',
      changeKey: 'viewsChange',
      icon: Eye,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Clics en Enlaces',
      key: 'totalClicks',
      changeKey: 'clicksChange',
      icon: MousePointer,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Reservas',
      key: 'totalBookings',
      changeKey: 'bookingsChange',
      icon: Calendar,
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Ingresos',
      key: 'totalRevenue',
      changeKey: 'revenueChange',
      icon: DollarSign,
      color: 'from-orange-500 to-red-500'
    }
  ];


  return (
    <div className="space-y-6">
      {/* iOS Welcome Header */}
      <div className="glass-card-ios">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="ios-user-avatar">
                <span className="text-white font-bold text-xl">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h1 className="ios-welcome-title">¡Hola, {user?.name}!</h1>
                <p className="ios-welcome-subtitle">Aquí tienes un resumen de tu actividad</p>
              </div>
            </div>
            <Link to="/dashboard/cards" className="ios-cta-button">
              <Plus size={18} className="mr-2" />
              Nueva Tarjeta
            </Link>
          </div>
        </div>
      </div>

      {/* Header con refresh */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Estadísticas en Tiempo Real</h2>
          <p className="text-slate-400 text-sm">Actualizado automáticamente cada 5 minutos</p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800/70 rounded-lg transition-colors"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-slate-400 text-sm">Actualizar</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Stats Grid con datos reales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsConfig.map((config) => (
          <StatsCard
            key={config.key}
            title={config.title}
            value={stats ? (stats as any)[config.key] : 0}
            change={stats ? (stats as any)[config.changeKey] : 0}
            icon={config.icon}
            color={config.color}
            loading={loading}
          />
        ))}
      </div>

      {/* Dashboard Real-Time Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actividad Reciente con datos reales */}
        <RecentActivity 
          activities={stats?.recentActivity || []} 
          loading={loading} 
        />

        {/* Rendimiento de Tarjetas con datos reales */}
        <TopCards 
          cards={stats?.topCards || []} 
          loading={loading} 
        />
      </div>

      {/* iOS Business Growth Section */}
      <div className="glass-card-ios">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="ios-stat-icon bg-gradient-to-br from-purple-500 to-pink-500">
                <Target size={20} className="text-white" />
              </div>
              <div>
                <h3 className="ios-section-title">Estrategias de Crecimiento</h3>
                <p className="ios-stat-label">Consejos para escalar tu negocio</p>
              </div>
            </div>
            <button className="ios-link-button">
              <TrendingUp size={16} className="mr-1" />
              Ver más
            </button>
          </div>
          
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="ios-metric-card">
              <div className="ios-metric-icon bg-blue-500">
                <TrendingUp size={16} className="text-white" />
              </div>
              <div>
                <p className="ios-metric-value">+24%</p>
                <p className="ios-metric-label">Crecimiento mensual</p>
              </div>
            </div>
            
            <div className="ios-metric-card">
              <div className="ios-metric-icon bg-green-500">
                <Users size={16} className="text-white" />
              </div>
              <div>
                <p className="ios-metric-value">1,247</p>
                <p className="ios-metric-label">Visitantes únicos</p>
              </div>
            </div>
            
            <div className="ios-metric-card">
              <div className="ios-metric-icon bg-purple-500">
                <MousePointer size={16} className="text-white" />
              </div>
              <div>
                <p className="ios-metric-value">2.8%</p>
                <p className="ios-metric-label">Tasa de conversión</p>
              </div>
            </div>

            <div className="ios-metric-card">
              <div className="ios-metric-icon bg-orange-500">
                <DollarSign size={16} className="text-white" />
              </div>
              <div>
                <p className="ios-metric-value">€1,245</p>
                <p className="ios-metric-label">Ingresos del mes</p>
              </div>
            </div>
          </div>

          {/* Growth Tips Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Color Psychology */}
            <div className="ios-booking-card">
              <div className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="ios-stat-icon bg-gradient-to-br from-red-500 to-pink-500">
                    <Palette size={16} className="text-white" />
                  </div>
                  <h4 className="ios-booking-name">Psicología del Color</h4>
                </div>
                <p className="ios-booking-time mb-3">Los colores influyen en las decisiones de compra</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="ios-stat-label text-xs">Azul: Confianza y profesionalismo</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="ios-stat-label text-xs">Verde: Crecimiento y naturaleza</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="ios-stat-label text-xs">Naranja: Energía y llamada a la acción</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Optimization Tips */}
            <div className="ios-booking-card">
              <div className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="ios-stat-icon bg-gradient-to-br from-yellow-500 to-orange-500">
                    <Zap size={16} className="text-white" />
                  </div>
                  <h4 className="ios-booking-name">Optimización Rápida</h4>
                </div>
                <p className="ios-booking-time mb-3">Mejoras que puedes hacer hoy mismo</p>
                <div className="space-y-2">
                  <div className="ios-info-row">
                    <span className="ios-info-label text-xs">• Personaliza tu tarjeta</span>
                    <Star size={12} className="text-yellow-500" />
                  </div>
                  <div className="ios-info-row">
                    <span className="ios-info-label text-xs">• Añade testimonios</span>
                    <Heart size={12} className="text-red-500" />
                  </div>
                  <div className="ios-info-row">
                    <span className="ios-info-label text-xs">• Incluye llamadas a la acción</span>
                    <MessageCircle size={12} className="text-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Business Insights */}
          <div className="ios-booking-card">
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="ios-stat-icon bg-gradient-to-br from-indigo-500 to-purple-500">
                  <Lightbulb size={16} className="text-white" />
                </div>
                <div>
                  <h4 className="ios-booking-name">Consejos de Experto</h4>
                  <p className="ios-booking-time">Estrategias probadas para aumentar conversiones</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                  <Share2 size={24} className="text-blue-600 mx-auto mb-2" />
                  <h5 className="ios-stat-value text-sm text-blue-800">Comparte en Redes</h5>
                  <p className="ios-stat-label text-xs text-blue-600">+40% más visibilidad</p>
                </div>
                
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100">
                  <MessageCircle size={24} className="text-green-600 mx-auto mb-2" />
                  <h5 className="ios-stat-value text-sm text-green-800">Responde Rápido</h5>
                  <p className="ios-stat-label text-xs text-green-600">+60% conversión</p>
                </div>
                
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
                  <Star size={24} className="text-purple-600 mx-auto mb-2" />
                  <h5 className="ios-stat-value text-sm text-purple-800">Muestra Reseñas</h5>
                  <p className="ios-stat-label text-xs text-purple-600">+80% confianza</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-orange-500">
                <p className="ios-stat-label text-sm text-orange-800">
                  <strong>💡 Tip del día:</strong> Los usuarios dedican solo 3 segundos a decidir si confían en tu perfil. 
                  Asegúrate de que tu mensaje principal sea claro y convincente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Advanced Features Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics & Performance */}
        <div className="glass-card-ios">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="ios-stat-icon bg-gradient-to-br from-indigo-500 to-blue-500">
                <BarChart3 size={20} className="text-white" />
              </div>
              <div>
                <h3 className="ios-section-title">Análisis de Rendimiento</h3>
                <p className="ios-stat-label">Optimiza tu presencia digital</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="ios-booking-card">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="ios-booking-name">Tasa de Conversión</h4>
                    <div className="flex items-center space-x-1">
                      <TrendingUp size={14} className="text-green-500" />
                      <span className="text-green-600 text-sm font-semibold">+12%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                  <p className="ios-stat-label text-xs">68% de visitantes se convierten en clientes</p>
                </div>
              </div>
              
              <div className="ios-booking-card">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="ios-booking-name">Tiempo en Página</h4>
                    <div className="flex items-center space-x-1">
                      <Clock size={14} className="text-blue-500" />
                      <span className="text-blue-600 text-sm font-semibold">2:34 min</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <p className="ios-stat-label text-xs">+22% más que el promedio del sector</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Growth Tools */}
        <div className="glass-card-ios">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="ios-stat-icon bg-gradient-to-br from-purple-500 to-purple-600">
                <Rocket size={20} className="text-white" />
              </div>
              <div>
                <h3 className="ios-section-title">Herramientas de Crecimiento</h3>
                <p className="ios-stat-label">Acelera tu negocio</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <Link to="/dashboard/cards" className="ios-booking-item hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="ios-booking-avatar bg-gradient-to-r from-blue-500 to-cyan-500">
                      <Camera size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="ios-booking-name">Optimizar Imágenes</p>
                      <p className="ios-booking-time">Mejora la velocidad de carga</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </Link>
              
              <Link to="/dashboard/profile" className="ios-booking-item hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="ios-booking-avatar bg-gradient-to-r from-green-500 to-emerald-500">
                      <Trophy size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="ios-booking-name">SEO Score</p>
                      <p className="ios-booking-time">Mejora tu posicionamiento</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600 font-semibold text-sm">92/100</span>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Business Intelligence */}
        <div className="glass-card-ios">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="ios-stat-icon bg-gradient-to-br from-yellow-500 to-orange-500">
                <Brain size={20} className="text-white" />
              </div>
              <div>
                <h3 className="ios-section-title">Inteligencia de Negocio</h3>
                <p className="ios-stat-label">Insights personalizados</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="ios-booking-card">
                <div className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Crown size={16} className="text-yellow-500" />
                    <h4 className="ios-booking-name">Mejor Hora para Publicar</h4>
                  </div>
                  <p className="ios-booking-time mb-2">Martes y Jueves de 14:00-16:00</p>
                  <p className="ios-stat-label text-xs">+45% más engagement en este horario</p>
                </div>
              </div>
              
              <div className="ios-booking-card">
                <div className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Diamond size={16} className="text-blue-500" />
                    <h4 className="ios-booking-name">Público Objetivo</h4>
                  </div>
                  <p className="ios-booking-time mb-2">Mujeres 25-45 años</p>
                  <p className="ios-stat-label text-xs">67% de tu audiencia más activa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/dashboard/cards" className="glass-card-ios">
          <div className="p-4 text-center">
            <div className="ios-stat-icon bg-gradient-to-br from-blue-500 to-cyan-500 mx-auto mb-3">
              <CreditCard size={20} className="text-white" />
            </div>
            <h4 className="ios-stat-value text-sm mb-1">Nueva Tarjeta</h4>
            <p className="ios-stat-label text-xs mb-3">Crear tarjeta de presentación digital</p>
          </div>
        </Link>

        <Link to="/dashboard/bookings" className="glass-card-ios">
          <div className="p-4 text-center">
            <div className="ios-stat-icon bg-gradient-to-br from-green-500 to-emerald-500 mx-auto mb-3">
              <Calendar size={20} className="text-white" />
            </div>
            <h4 className="ios-stat-value text-sm mb-1">Gestionar Citas</h4>
            <p className="ios-stat-label text-xs mb-3">Configurar disponibilidad y reservas</p>
          </div>
        </Link>

        <Link to="/dashboard/payments" className="glass-card-ios">
          <div className="p-4 text-center">
            <div className="ios-stat-icon bg-gradient-to-br from-purple-500 to-pink-500 mx-auto mb-3">
              <DollarSign size={20} className="text-white" />
            </div>
            <h4 className="ios-stat-value text-sm mb-1">Configurar Pagos</h4>
            <p className="ios-stat-label text-xs mb-3">Gestionar Stripe y facturación</p>
          </div>
        </Link>

        <Link to="/dashboard/profile" className="glass-card-ios">
          <div className="p-4 text-center">
            <div className="ios-stat-icon bg-gradient-to-br from-orange-500 to-red-500 mx-auto mb-3">
              <Settings size={20} className="text-white" />
            </div>
            <h4 className="ios-stat-value text-sm mb-1">Mi Perfil</h4>
            <p className="ios-stat-label text-xs mb-3">Configurar información personal</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default DashboardHome;