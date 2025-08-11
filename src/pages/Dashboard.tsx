import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Calendar, BarChart3, ExternalLink, TrendingUp, Users, MousePointer, CheckCircle2, Clock, Sparkles, ArrowUpRight, Lightbulb, Target, Palette, Zap, Star, Heart, MessageCircle, Share2, DollarSign, Settings, Globe, Camera, Trophy, Shield, Smartphone, Laptop, Brain, Rocket, Gift, ChevronRight, TrendingDown, AlertTriangle, ThumbsUp, Coffee, Briefcase, PieChart, LineChart, Activity, Award, Crown, Diamond, Flame, ChartBar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import '@/styles/ios-dashboard.css';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedTip, setSelectedTip] = useState(0);

  return (
    <div className="space-y-6">
      {/* iOS Welcome Header */}
      <div className="glass-card-ios animate-slideDown">
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
              Editar Tarjeta
            </Link>
          </div>
        </div>
      </div>

      {/* iOS Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="ios-stat-card animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="ios-stat-label">Visitas este mes</p>
              <p className="ios-stat-value text-blue-600">847</p>
              <p className="ios-stat-change text-green-600">+12% este mes</p>
            </div>
            <div className="ios-stat-icon bg-gradient-to-br from-blue-500 to-blue-600">
              <Users size={20} className="text-white" />
            </div>
          </div>
        </div>
        
        <div className="ios-stat-card animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="ios-stat-label">Clics en enlaces</p>
              <p className="ios-stat-value text-purple-600">324</p>
              <p className="ios-stat-change text-green-600">+8% este mes</p>
            </div>
            <div className="ios-stat-icon bg-gradient-to-br from-purple-500 to-purple-600">
              <MousePointer size={20} className="text-white" />
            </div>
          </div>
        </div>
        
        <div className="ios-stat-card animate-slideUp" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="ios-stat-label">Reservas pendientes</p>
              <p className="ios-stat-value text-orange-600">12</p>
              <p className="ios-stat-change text-orange-600">3 nuevas hoy</p>
            </div>
            <div className="ios-stat-icon bg-gradient-to-br from-orange-500 to-orange-600">
              <Clock size={20} className="text-white" />
            </div>
          </div>
        </div>
        
        <div className="ios-stat-card animate-slideUp" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="ios-stat-label">Reservas completadas</p>
              <p className="ios-stat-value text-green-600">98</p>
              <p className="ios-stat-change text-green-600">+15% este mes</p>
            </div>
            <div className="ios-stat-icon bg-gradient-to-br from-green-500 to-green-600">
              <CheckCircle2 size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* iOS Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tu Tarjeta */}
        <div className="glass-card-ios animate-slideUp" style={{ animationDelay: '0.5s' }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="ios-section-title">Tu Tarjeta Digital</h3>
              <Link to="/dashboard/cards" className="ios-link-button">
                <Eye size={16} className="mr-1" />
                Ver
              </Link>
            </div>
            
            <div className="ios-card-preview">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <div className="ios-preview-avatar">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="ios-card-title">Mi tarjeta Klycs</h4>
                    <p className="ios-card-url">klycs.com/{user?.name?.toLowerCase()}</p>
                  </div>
                </div>
                <ArrowUpRight size={18} className="text-gray-400" />
              </div>
            </div>
            
            <div className="space-y-3 mt-4">
              <div className="ios-info-row">
                <span className="ios-info-label">Enlaces activos</span>
                <span className="ios-info-value">8</span>
              </div>
              <div className="ios-info-row">
                <span className="ios-info-label">Servicios disponibles</span>
                <span className="ios-info-value">5</span>
              </div>
              <div className="ios-info-row">
                <span className="ios-info-label">Última actualización</span>
                <span className="ios-info-value">Hace 2 horas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reservas Recientes */}
        <div className="glass-card-ios animate-slideUp" style={{ animationDelay: '0.6s' }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="ios-section-title">Reservas Recientes</h3>
              <Link to="/dashboard/bookings" className="ios-link-button">
                <Calendar size={16} className="mr-1" />
                Ver todas
              </Link>
            </div>
            
            <div className="space-y-3">
              <div className="ios-booking-item">
                <div className="flex items-center space-x-3">
                  <div className="ios-booking-avatar bg-green-500">
                    <span className="text-white font-medium text-sm">MG</span>
                  </div>
                  <div className="flex-1">
                    <p className="ios-booking-name">María García</p>
                    <p className="ios-booking-time">Hoy a las 14:30</p>
                  </div>
                  <div className="ios-status-badge ios-status-confirmed">
                    <CheckCircle2 size={12} />
                  </div>
                </div>
              </div>
              
              <div className="ios-booking-item">
                <div className="flex items-center space-x-3">
                  <div className="ios-booking-avatar bg-orange-500">
                    <span className="text-white font-medium text-sm">CL</span>
                  </div>
                  <div className="flex-1">
                    <p className="ios-booking-name">Carlos López</p>
                    <p className="ios-booking-time">Mañana a las 10:00</p>
                  </div>
                  <div className="ios-status-badge ios-status-pending">
                    <Clock size={12} />
                  </div>
                </div>
              </div>
              
              <div className="ios-booking-item">
                <div className="flex items-center space-x-3">
                  <div className="ios-booking-avatar bg-blue-500">
                    <span className="text-white font-medium text-sm">AR</span>
                  </div>
                  <div className="flex-1">
                    <p className="ios-booking-name">Ana Rodríguez</p>
                    <p className="ios-booking-time">Viernes a las 16:15</p>
                  </div>
                  <div className="ios-status-badge ios-status-confirmed">
                    <CheckCircle2 size={12} />
                  </div>
                </div>
              </div>
            </div>
            
            <Link to="/dashboard/bookings" className="ios-view-all-button">
              Ver todas las reservas
            </Link>
          </div>
        </div>
      </div>

      {/* iOS Business Growth Section */}
      <div className="glass-card-ios animate-slideUp" style={{ animationDelay: '0.7s' }}>
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
        <div className="glass-card-ios animate-slideUp" style={{ animationDelay: '0.8s' }}>
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="ios-stat-icon bg-gradient-to-br from-indigo-500 to-blue-500">
                <ChartBar size={20} className="text-white" />
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
              
              <div className="ios-booking-card">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="ios-booking-name">Engagement Rate</h4>
                    <div className="flex items-center space-x-1">
                      <Heart size={14} className="text-red-500" />
                      <span className="text-red-600 text-sm font-semibold">84%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-gradient-to-r from-red-400 to-red-500 h-2 rounded-full" style={{ width: '84%' }}></div>
                  </div>
                  <p className="ios-stat-label text-xs">Excelente interacción con visitantes</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Growth Tools */}
        <div className="glass-card-ios animate-slideUp" style={{ animationDelay: '0.9s' }}>
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
              
              <div className="ios-booking-item">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="ios-booking-avatar bg-gradient-to-r from-orange-500 to-red-500">
                      <Shield size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="ios-booking-name">SSL Seguro</p>
                      <p className="ios-booking-time">Tu sitio está protegido</p>
                    </div>
                  </div>
                  <div className="ios-status-badge ios-status-confirmed">
                    <CheckCircle2 size={12} />
                  </div>
                </div>
              </div>
              
              <div className="ios-booking-item">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="ios-booking-avatar bg-gradient-to-r from-purple-500 to-pink-500">
                      <Smartphone size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="ios-booking-name">Mobile Friendly</p>
                      <p className="ios-booking-time">Optimizado para móviles</p>
                    </div>
                  </div>
                  <div className="ios-status-badge ios-status-confirmed">
                    <CheckCircle2 size={12} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Intelligence */}
        <div className="glass-card-ios animate-slideUp" style={{ animationDelay: '1.0s' }}>
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
              
              <div className="ios-booking-card">
                <div className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Flame size={16} className="text-red-500" />
                    <h4 className="ios-booking-name">Trending Topic</h4>
                  </div>
                  <p className="ios-booking-time mb-2">"Bienestar y Salud Mental"</p>
                  <p className="ios-stat-label text-xs">Aumenta 3x tu alcance con este tema</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Tips Carousel */}
      <div className="glass-card-ios animate-slideUp" style={{ animationDelay: '1.1s' }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="ios-stat-icon bg-gradient-to-br from-emerald-500 to-teal-500">
                <Lightbulb size={20} className="text-white" />
              </div>
              <div>
                <h3 className="ios-section-title">Tips Avanzados de Conversión</h3>
                <p className="ios-stat-label">Estrategias respaldadas por datos</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {[0, 1, 2, 3].map((index) => (
                <button
                  key={index}
                  onClick={() => setSelectedTip(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    selectedTip === index ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="relative overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${selectedTip * 100}%)` }}
            >
              {/* Tip 1: Storytelling */}
              <div className="w-full flex-shrink-0">
                <div className="ios-booking-card">
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="ios-stat-icon bg-gradient-to-br from-purple-500 to-pink-500">
                        <MessageCircle size={16} className="text-white" />
                      </div>
                      <h4 className="ios-section-title">El Poder del Storytelling</h4>
                    </div>
                    <p className="ios-booking-time mb-4">
                      Las historias aumentan la retención en un 65%. Comparte tu journey profesional, 
                      los desafíos que has superado y cómo ayudas a tus clientes a lograr sus objetivos.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
                        <Coffee size={24} className="text-purple-600 mx-auto mb-2" />
                        <p className="ios-stat-value text-sm text-purple-800">Origen</p>
                        <p className="ios-stat-label text-xs text-purple-600">Cuenta tu inicio</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                        <Briefcase size={24} className="text-blue-600 mx-auto mb-2" />
                        <p className="ios-stat-value text-sm text-blue-800">Proceso</p>
                        <p className="ios-stat-label text-xs text-blue-600">Explica tu método</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100">
                        <Trophy size={24} className="text-green-600 mx-auto mb-2" />
                        <p className="ios-stat-value text-sm text-green-800">Resultados</p>
                        <p className="ios-stat-label text-xs text-green-600">Muestra logros</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tip 2: Social Proof */}
              <div className="w-full flex-shrink-0">
                <div className="ios-booking-card">
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="ios-stat-icon bg-gradient-to-br from-green-500 to-emerald-500">
                        <Award size={16} className="text-white" />
                      </div>
                      <h4 className="ios-section-title">Prueba Social Efectiva</h4>
                    </div>
                    <p className="ios-booking-time mb-4">
                      El 92% de los consumidores confía en recomendaciones de otros. 
                      Maximiza tu credibilidad con testimonios estratégicos y números impactantes.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
                        <ThumbsUp size={20} className="text-green-600" />
                        <div>
                          <p className="ios-stat-value text-sm">Testimonios en Video</p>
                          <p className="ios-stat-label text-xs">300% más convincentes que texto</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50">
                        <Users size={20} className="text-blue-600" />
                        <div>
                          <p className="ios-stat-value text-sm">Números Específicos</p>
                          <p className="ios-stat-label text-xs">"500+ clientes satisfechos"</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
                        <Star size={20} className="text-purple-600" />
                        <div>
                          <p className="ios-stat-value text-sm">Logos de Clientes</p>
                          <p className="ios-stat-label text-xs">Aumenta credibilidad 40%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tip 3: Optimization */}
              <div className="w-full flex-shrink-0">
                <div className="ios-booking-card">
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="ios-stat-icon bg-gradient-to-br from-orange-500 to-red-500">
                        <Activity size={16} className="text-white" />
                      </div>
                      <h4 className="ios-section-title">Optimización Continua</h4>
                    </div>
                    <p className="ios-booking-time mb-4">
                      Pequeños cambios generan grandes resultados. Un botón mejor posicionado 
                      puede aumentar conversiones hasta 25%.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h5 className="ios-stat-value text-sm text-green-800">✅ Sí Funciona</h5>
                        <div className="space-y-1">
                          <p className="ios-stat-label text-xs">• Botones en colores contrastantes</p>
                          <p className="ios-stat-label text-xs">• Formularios cortos (3-5 campos)</p>
                          <p className="ios-stat-label text-xs">• Llamadas a la acción claras</p>
                          <p className="ios-stat-label text-xs">• Carga rápida (&lt;3 segundos)</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h5 className="ios-stat-value text-sm text-red-800">❌ Evita Esto</h5>
                        <div className="space-y-1">
                          <p className="ios-stat-label text-xs">• Demasiadas opciones</p>
                          <p className="ios-stat-label text-xs">• Textos largos sin pausas</p>
                          <p className="ios-stat-label text-xs">• Pop-ups agresivos</p>
                          <p className="ios-stat-label text-xs">• Información de contacto oculta</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tip 4: Psychology */}
              <div className="w-full flex-shrink-0">
                <div className="ios-booking-card">
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="ios-stat-icon bg-gradient-to-br from-indigo-500 to-purple-500">
                        <Brain size={16} className="text-white" />
                      </div>
                      <h4 className="ios-section-title">Psicología del Consumidor</h4>
                    </div>
                    <p className="ios-booking-time mb-4">
                      Entender cómo toman decisiones tus clientes te da una ventaja competitiva enorme.
                    </p>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500">
                        <h5 className="ios-stat-value text-sm text-yellow-800 mb-1">Escasez</h5>
                        <p className="ios-stat-label text-xs">"Solo 3 espacios disponibles este mes"</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500">
                        <h5 className="ios-stat-value text-sm text-blue-800 mb-1">Autoridad</h5>
                        <p className="ios-stat-label text-xs">Muestra certificaciones y experiencia</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500">
                        <h5 className="ios-stat-value text-sm text-green-800 mb-1">Reciprocidad</h5>
                        <p className="ios-stat-label text-xs">Ofrece valor antes de vender</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card-ios animate-slideUp" style={{ animationDelay: '1.2s' }}>
          <div className="p-4 text-center">
            <div className="ios-stat-icon bg-gradient-to-br from-blue-500 to-cyan-500 mx-auto mb-3">
              <PieChart size={20} className="text-white" />
            </div>
            <h4 className="ios-stat-value text-sm mb-1">Analizar Competencia</h4>
            <p className="ios-stat-label text-xs mb-3">Descubre qué está funcionando en tu sector</p>
            <button className="ios-link-button text-xs">Explorar</button>
          </div>
        </div>

        <div className="glass-card-ios animate-slideUp" style={{ animationDelay: '1.3s' }}>
          <div className="p-4 text-center">
            <div className="ios-stat-icon bg-gradient-to-br from-green-500 to-emerald-500 mx-auto mb-3">
              <LineChart size={20} className="text-white" />
            </div>
            <h4 className="ios-stat-value text-sm mb-1">A/B Testing</h4>
            <p className="ios-stat-label text-xs mb-3">Prueba diferentes versiones de tu tarjeta</p>
            <button className="ios-link-button text-xs">Comenzar</button>
          </div>
        </div>

        <div className="glass-card-ios animate-slideUp" style={{ animationDelay: '1.4s' }}>
          <div className="p-4 text-center">
            <div className="ios-stat-icon bg-gradient-to-br from-purple-500 to-pink-500 mx-auto mb-3">
              <Gift size={20} className="text-white" />
            </div>
            <h4 className="ios-stat-value text-sm mb-1">Lead Magnets</h4>
            <p className="ios-stat-label text-xs mb-3">Crea ofertas irresistibles para captar clientes</p>
            <button className="ios-link-button text-xs">Crear</button>
          </div>
        </div>

        <div className="glass-card-ios animate-slideUp" style={{ animationDelay: '1.5s' }}>
          <div className="p-4 text-center">
            <div className="ios-stat-icon bg-gradient-to-br from-orange-500 to-red-500 mx-auto mb-3">
              <Settings size={20} className="text-white" />
            </div>
            <h4 className="ios-stat-value text-sm mb-1">Automatizaciones</h4>
            <p className="ios-stat-label text-xs mb-3">Configura respuestas automáticas</p>
            <button className="ios-link-button text-xs">Configurar</button>
          </div>
        </div>
      </div>
    </div>
  );
};