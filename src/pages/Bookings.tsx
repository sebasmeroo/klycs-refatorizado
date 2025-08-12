import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Filter, 
  Search, 
  Plus,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  MapPin,
  Zap,
  Award,
  Shield,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AnimatedContainer, 
  AnimatedButton, 
  AnimatedCard,
  StaggeredList 
} from '@/components/booking/BookingAnimations';
import { 
  ModernSelect, 
  ModernChip,
  FloatingActionButton 
} from '@/components/booking/ModernUIComponents';
import { AdvancedBookingDashboard } from '@/components/analytics/AdvancedBookingDashboard';

interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  price?: number;
  avatar?: string;
  rating?: number;
  isVip?: boolean;
}

export const Bookings: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'analytics'>('list');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showQuickStats, setShowQuickStats] = useState(true);

  const mockBookings: Booking[] = [
    {
      id: '1',
      clientName: 'María García',
      clientEmail: 'maria@example.com',
      clientPhone: '+34 600 123 456',
      service: 'Consulta Médica General',
      date: '2024-01-15',
      time: '10:00',
      duration: 45,
      status: 'confirmed',
      notes: 'Primera consulta. Dolor de cabeza recurrente.',
      price: 75,
      rating: 5,
      isVip: true
    },
    {
      id: '2',
      clientName: 'Carlos López',
      clientEmail: 'carlos@example.com',
      clientPhone: '+34 600 234 567',
      service: 'Limpieza Dental',
      date: '2024-01-16',
      time: '14:00',
      duration: 60,
      status: 'pending',
      notes: 'Cliente habitual. Limpieza semestral.',
      price: 85,
      rating: 4
    },
    {
      id: '3',
      clientName: 'Ana Martín',
      clientEmail: 'ana@example.com',
      clientPhone: '+34 600 345 678',
      service: 'Masaje Relajante',
      date: '2024-01-12',
      time: '16:00',
      duration: 90,
      status: 'completed',
      notes: 'Masaje por estrés laboral. Muy satisfecha.',
      price: 65,
      rating: 5
    },
    {
      id: '4',
      clientName: 'Roberto Silva',
      clientEmail: 'roberto@example.com',
      clientPhone: '+34 600 456 789',
      service: 'Entrenamiento Personal',
      date: '2024-01-18',
      time: '09:00',
      duration: 60,
      status: 'confirmed',
      notes: 'Sesión de inicio. Objetivos de pérdida de peso.',
      price: 45,
      isVip: true
    },
    {
      id: '5',
      clientName: 'Laura Ruiz',
      clientEmail: 'laura@example.com',
      clientPhone: '+34 600 567 890',
      service: 'Tratamiento Facial',
      date: '2024-01-14',
      time: '11:30',
      duration: 75,
      status: 'no_show',
      notes: 'No se presentó a la cita.',
      price: 95
    },
    {
      id: '6',
      clientName: 'Diego Fernández',
      clientEmail: 'diego@example.com',
      clientPhone: '+34 600 678 901',
      service: 'Sesión de Psicología',
      date: '2024-01-17',
      time: '15:30',
      duration: 50,
      status: 'confirmed',
      notes: 'Seguimiento de terapia cognitiva.',
      price: 80,
      rating: 5
    }
  ];

  // Stats calculadas
  const stats = {
    total: mockBookings.length,
    pending: mockBookings.filter(b => b.status === 'pending').length,
    confirmed: mockBookings.filter(b => b.status === 'confirmed').length,
    completed: mockBookings.filter(b => b.status === 'completed').length,
    revenue: mockBookings
      .filter(b => ['confirmed', 'completed'].includes(b.status))
      .reduce((sum, b) => sum + (b.price || 0), 0),
    avgRating: mockBookings
      .filter(b => b.rating)
      .reduce((sum, b) => sum + (b.rating || 0), 0) / mockBookings.filter(b => b.rating).length || 0
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'primary';
      case 'cancelled': return 'error';
      case 'no_show': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      case 'no_show': return 'No asistió';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'no_show': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredBookings = mockBookings.filter(booking => {
    const matchesSearch = booking.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || booking.status === filter;
    return matchesSearch && matchesFilter;
  });

  const filterOptions = [
    { value: 'all', label: 'Todas las reservas', icon: <Calendar className="w-4 h-4" /> },
    { value: 'pending', label: 'Pendientes', icon: <AlertCircle className="w-4 h-4" /> },
    { value: 'confirmed', label: 'Confirmadas', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'completed', label: 'Completadas', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'cancelled', label: 'Canceladas', icon: <XCircle className="w-4 h-4" /> },
    { value: 'no_show', label: 'No asistieron', icon: <XCircle className="w-4 h-4" /> }
  ];

  const StatCard = ({ title, value, icon, color = 'emerald', change }: any) => (
    <AnimatedCard className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm font-medium text-green-600">{change}%</span>
              <span className="text-sm text-gray-500 ml-1">vs mes anterior</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-${color}-100`}>
          <div className={`text-${color}-600`}>{icon}</div>
        </div>
      </div>
    </AnimatedCard>
  );

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
      <AnimatedCard className="p-6 relative">
        {/* Badges */}
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          {booking.isVip && (
            <ModernChip variant="warning" size="sm" icon={<Award className="w-3 h-3" />}>
              VIP
            </ModernChip>
          )}
          <ModernChip 
            variant={getStatusColor(booking.status)} 
            size="sm" 
            icon={getStatusIcon(booking.status)}
          >
            {getStatusText(booking.status)}
          </ModernChip>
        </div>

        {/* Header con avatar y info cliente */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">
                {booking.clientName.charAt(0).toUpperCase()}
              </span>
            </div>
            {booking.isVip && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <Star className="w-3 h-3 text-white" fill="currentColor" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{booking.clientName}</h3>
            <p className="text-emerald-600 font-semibold">{booking.service}</p>
            {booking.rating && (
              <div className="flex items-center mt-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < booking.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-600">({booking.rating})</span>
              </div>
            )}
          </div>

          {/* Menu de acciones */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-10"
                >
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center">
                    <Eye className="w-4 h-4 mr-3 text-gray-400" />
                    Ver detalles
                  </button>
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center">
                    <Edit className="w-4 h-4 mr-3 text-gray-400" />
                    Editar
                  </button>
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-3 text-gray-400" />
                    Contactar
                  </button>
                  <hr className="my-2" />
                  <button className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center text-red-600">
                    <Trash2 className="w-4 h-4 mr-3" />
                    Eliminar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Información de la cita */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(booking.date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hora</p>
                  <p className="font-semibold text-gray-900">
                    {booking.time} ({booking.duration} min)
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a 
                    href={`mailto:${booking.clientEmail}`} 
                    className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    {booking.clientEmail}
                  </a>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <a 
                    href={`tel:${booking.clientPhone}`} 
                    className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    {booking.clientPhone}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notas */}
        {booking.notes && (
          <div className="mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">Notas</p>
                  <p className="text-sm text-blue-800">{booking.notes}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer con precio y acciones */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {booking.price && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Precio</p>
                <p className="text-2xl font-bold text-emerald-600">€{booking.price}</p>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {booking.status === 'pending' && (
              <>
                <AnimatedButton variant="outline" size="sm">
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar
                </AnimatedButton>
                <AnimatedButton size="sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar
                </AnimatedButton>
              </>
            )}
            {booking.status === 'confirmed' && (
              <>
                <AnimatedButton variant="outline" size="sm">
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancelar
                </AnimatedButton>
                <AnimatedButton size="sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completar
                </AnimatedButton>
              </>
            )}
            {booking.status === 'completed' && booking.rating && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                <span>Valorado: {booking.rating}/5</span>
              </div>
            )}
          </div>
        </div>
      </AnimatedCard>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header moderno */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Reservas</h1>
              <p className="text-gray-600">Gestiona todas tus citas desde un lugar</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Selector de vista */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'list' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Lista
                </button>
                <button
                  onClick={() => setViewMode('analytics')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'analytics' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Analytics
                </button>
              </div>
              
              <AnimatedButton size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Reserva
              </AnimatedButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {viewMode === 'analytics' ? (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AdvancedBookingDashboard cardId="demo-card" />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Stats cards */}
              {showQuickStats && (
                <AnimatedContainer>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                      title="Total Reservas"
                      value={stats.total}
                      icon={<Calendar className="w-6 h-6" />}
                      color="blue"
                      change={8.2}
                    />
                    <StatCard
                      title="Pendientes"
                      value={stats.pending}
                      icon={<AlertCircle className="w-6 h-6" />}
                      color="yellow"
                    />
                    <StatCard
                      title="Ingresos"
                      value={`€${stats.revenue}`}
                      icon={<DollarSign className="w-6 h-6" />}
                      color="emerald"
                      change={12.5}
                    />
                    <StatCard
                      title="Valoración Media"
                      value={stats.avgRating.toFixed(1)}
                      icon={<Star className="w-6 h-6" />}
                      color="purple"
                    />
                  </div>
                </AnimatedContainer>
              )}

              {/* Controles de búsqueda y filtros */}
              <AnimatedContainer className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por cliente, servicio..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <ModernSelect
                      options={filterOptions}
                      value={filter}
                      onChange={setFilter}
                      placeholder="Filtrar por estado"
                      className="min-w-[200px]"
                    />
                    
                    <button
                      onClick={() => setShowQuickStats(!showQuickStats)}
                      className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <TrendingUp className="w-5 h-5 text-gray-600" />
                    </button>
                    
                    <button className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                      <RefreshCw className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </AnimatedContainer>

              {/* Lista de reservas */}
              {filteredBookings.length > 0 ? (
                <StaggeredList className="space-y-6">
                  {filteredBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </StaggeredList>
              ) : (
                <AnimatedContainer>
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No hay reservas
                    </h3>
                    <p className="text-gray-600 mb-6">
                      No se encontraron reservas que coincidan con tu búsqueda
                    </p>
                    <AnimatedButton>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear nueva reserva
                    </AnimatedButton>
                  </div>
                </AnimatedContainer>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FAB para crear nueva reserva */}
      <FloatingActionButton
        icon={<Plus className="w-6 h-6" />}
        onClick={() => console.log('Nueva reserva')}
        pulse={true}
      />
    </div>
  );
};