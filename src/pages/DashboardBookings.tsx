import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { BookingsService, BookingData, BookingStats } from '@/services/bookings';
import '@/styles/ios-dashboard.css';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  Trash2,
  Bell,
  ChevronLeft,
  ChevronRight,
  X,
  Circle,
  CheckCircle2,
  XCircle as XCircleIcon,
  Clock3,
  TrendingUp,
  Sparkles
} from 'lucide-react';

const DashboardBookings: React.FC = () => {
  const { firebaseUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const userId = firebaseUser?.uid;

  useEffect(() => {
    if (userId) {
      loadBookings();
      loadStats();
      loadNotifications();
    }
  }, [userId, activeTab, searchTerm, dateFrom, dateTo]);

  const loadBookings = async () => {
    if (!userId) return;
    
    setLoading(true);
    const filters = {
      status: activeTab !== 'all' ? activeTab : undefined,
      dateFrom,
      dateTo,
      searchTerm: searchTerm || undefined
    };
    
    const result = await BookingsService.getUserBookings(userId, filters);
    if (result.success && result.data) {
      setBookings(result.data);
    } else {
      setError(result.error || 'Error al cargar reservas');
    }
    setLoading(false);
  };

  const loadStats = async () => {
    if (!userId) return;
    
    const result = await BookingsService.getBookingStats(userId);
    if (result.success && result.data) {
      setStats(result.data);
    }
  };

  const loadNotifications = async () => {
    // Mock notifications for now
    setNotifications([
      { id: '1', message: 'Nueva reserva de María García', time: '5 min', type: 'booking' },
      { id: '2', message: 'Reserva confirmada para mañana', time: '1 hora', type: 'confirmation' }
    ]);
  };

  const filteredBookings = bookings;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle size={16} className="text-green-400" />;
      case 'pending': return <AlertCircle size={16} className="text-yellow-400" />;
      case 'cancelled': return <XCircle size={16} className="text-red-400" />;
      default: return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      default: return 'Desconocido';
    }
  };

  const tabs = [
    { id: 'all', label: 'Todas', count: stats?.total || 0 },
    { id: 'pending', label: 'Pendientes', count: stats?.pending || 0 },
    { id: 'confirmed', label: 'Confirmadas', count: stats?.confirmed || 0 },
    { id: 'cancelled', label: 'Canceladas', count: stats?.cancelled || 0 }
  ];

  const handleStatusChange = async (bookingId: string, newStatus: BookingData['status']) => {
    const result = await BookingsService.updateBookingStatus(bookingId, newStatus);
    if (result.success) {
      loadBookings();
      loadStats();
    } else {
      setError(result.error || 'Error al actualizar estado');
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta reserva?')) {
      const result = await BookingsService.deleteBooking(bookingId);
      if (result.success) {
        loadBookings();
        loadStats();
      } else {
        setError(result.error || 'Error al eliminar reserva');
      }
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getBookingsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return bookings.filter(booking => booking.date === dateStr);
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: `
        radial-gradient(circle at 20% 20%, rgba(255, 165, 0, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 30%, rgba(255, 135, 0, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 40% 70%, rgba(255, 200, 100, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 90% 80%, rgba(255, 180, 50, 0.12) 0%, transparent 50%),
        linear-gradient(135deg, #ffffff 0%, #fefefe 100%)
      `
    }}>
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-orange-200/20 to-orange-300/10 blur-xl"></div>
        <div className="absolute top-32 right-20 w-24 h-24 rounded-full bg-gradient-to-br from-orange-100/15 to-yellow-200/10 blur-lg"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 rounded-full bg-gradient-to-br from-orange-50/20 to-orange-200/10 blur-2xl"></div>
        <div className="absolute bottom-32 right-10 w-28 h-28 rounded-full bg-gradient-to-br from-yellow-100/15 to-orange-100/10 blur-xl"></div>
      </div>

      <div className="relative z-10 p-4 space-y-4 max-w-7xl mx-auto">
        {/* iOS Native Header */}
        <div className="glass-card-ios ">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="ios-search-container">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar reservas"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="ios-search-input"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`ios-tab-button ${
                      activeTab === tab.id ? 'ios-tab-active' : 'ios-tab-inactive'
                    }`}
                  >
                    {tab.label}
                    <span className="ios-badge">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="ios-icon-button relative">
                <Bell size={18} className="text-gray-600" />
                {notifications.length > 0 && (
                  <span className="ios-notification-badge">
                    {notifications.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`ios-icon-button ${showFilters ? 'ios-button-active' : ''}`}
              >
                <Filter size={18} className="text-gray-600" />
              </button>
              <button 
                onClick={() => setShowCalendar(!showCalendar)}
                className={`ios-icon-button ${showCalendar ? 'ios-button-active' : ''}`}
              >
                <CalendarIcon size={18} className="text-gray-600" />
              </button>
              <button 
                onClick={() => setShowNewBooking(!showNewBooking)}
                className="ios-primary-button"
              >
                <Plus size={18} className="text-white" />
              </button>
            </div>
          </div>

          {/* iOS Filters Dropdown */}
          {showFilters && (
            <div className="ios-filters-dropdown ">
              <div className="flex items-center space-x-4 flex-wrap">
                <div className="flex items-center space-x-2">
                  <span className="ios-filter-label">Desde:</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="ios-date-input"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="ios-filter-label">Hasta:</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="ios-date-input"
                  />
                </div>
                <button 
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setSearchTerm('');
                    setShowFilters(false);
                  }}
                  className="ios-clear-button"
                >
                  Limpiar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* iOS Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="ios-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="ios-stat-label">Total Reservas</p>
                <p className="ios-stat-value">{stats?.total || 0}</p>
              </div>
              <div className="ios-stat-icon bg-gradient-to-br from-blue-500 to-blue-600">
                <Calendar size={20} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="ios-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="ios-stat-label">Pendientes</p>
                <p className="ios-stat-value text-orange-600">{stats?.pending || 0}</p>
              </div>
              <div className="ios-stat-icon bg-gradient-to-br from-orange-500 to-orange-600">
                <Clock3 size={20} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="ios-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="ios-stat-label">Confirmadas</p>
                <p className="ios-stat-value text-green-600">{stats?.confirmed || 0}</p>
              </div>
              <div className="ios-stat-icon bg-gradient-to-br from-green-500 to-green-600">
                <CheckCircle2 size={20} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="ios-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="ios-stat-label">Ingresos</p>
                <p className="ios-stat-value text-purple-600">€{stats?.totalRevenue || 0}</p>
              </div>
              <div className="ios-stat-icon bg-gradient-to-br from-purple-500 to-purple-600">
                <TrendingUp size={20} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* iOS Calendar View */}
        {showCalendar && (
          <div className="glass-card-ios ">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="ios-section-title">Vista de Calendario</h3>
                <button 
                  onClick={() => setShowCalendar(false)}
                  className="ios-close-button"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                  className="ios-nav-button"
                >
                  <ChevronLeft size={20} className="text-gray-600" />
                </button>
                <h4 className="ios-month-title">
                  {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </h4>
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                  className="ios-nav-button"
                >
                  <ChevronRight size={20} className="text-gray-600" />
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(day => (
                  <div key={day} className="ios-calendar-header">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentDate).map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="h-16"></div>;
                  }
                  
                  const dayBookings = getBookingsForDate(day);
                  const isToday = new Date().getDate() === day && 
                                 new Date().getMonth() === currentDate.getMonth() && 
                                 new Date().getFullYear() === currentDate.getFullYear();
                  
                  return (
                    <div 
                      key={`day-${day}`} 
                      className={`ios-calendar-day ${
                        isToday ? 'ios-calendar-today' : ''
                      }`}
                    >
                      <div className={`ios-day-number ${isToday ? 'text-white' : 'text-gray-800'}`}>{day}</div>
                      <div className="space-y-0.5">
                        {dayBookings.slice(0, 2).map((booking, bookingIndex) => (
                          <div 
                            key={`booking-${booking.id}-${bookingIndex}`}
                            className={`ios-booking-dot ${
                              booking.status === 'confirmed' ? 'bg-green-500' :
                              booking.status === 'pending' ? 'bg-orange-500' :
                              'bg-red-500'
                            }`}
                          ></div>
                        ))}
                        {dayBookings.length > 2 && (
                          <div className="ios-more-indicator">+{dayBookings.length - 2}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}


        {/* iOS Error Display */}
        {error && (
          <div className="ios-error-card ">
            <p className="text-red-600 font-medium">{error}</p>
            <button 
              onClick={() => setError('')}
              className="ios-error-close"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* iOS Loading State */}
        {loading ? (
          <div className="glass-card-ios text-center py-12 ">
            <div className="flex items-center justify-center space-x-3 text-gray-600">
              <div className="ios-spinner"></div>
              <span className="ios-loading-text">Cargando reservas...</span>
            </div>
          </div>
        ) : (
          /* iOS Bookings List */
          <div className="space-y-3">
            {filteredBookings.length === 0 ? (
              <div className="glass-card-ios text-center py-16 ">
                <div className="ios-empty-icon">
                  <Calendar size={48} className="text-gray-400 mx-auto mb-4" />
                </div>
                <h3 className="ios-empty-title">
                  {searchTerm || dateFrom || dateTo ? 'No se encontraron reservas' : 'No tienes reservas aún'}
                </h3>
                <p className="ios-empty-subtitle">
                  {searchTerm || dateFrom || dateTo
                    ? 'Intenta con otros filtros de búsqueda' 
                    : 'Las reservas aparecerán aquí cuando los clientes agenden citas'
                  }
                </p>
                {!searchTerm && !dateFrom && !dateTo && (
                  <button 
                    onClick={() => setShowNewBooking(true)}
                    className="ios-cta-button"
                  >
                    <Plus size={18} className="mr-2" />
                    Crear Nueva Reserva
                  </button>
                )}
              </div>
            ) : (
              filteredBookings.map((booking, index) => (
                <div 
                  key={`booking-item-${booking.id}`} 
                  className="ios-booking-card"
                >
                  <div className="flex items-start justify-between p-4">
                    <div className="flex items-start space-x-3">
                      <div className="ios-avatar-container">
                        <User size={20} className="text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="ios-booking-name">{booking.clientName}</h3>
                          <span className={`ios-status-badge ios-status-${booking.status}`}>
                            {booking.status === 'confirmed' && <CheckCircle2 size={12} />}
                            {booking.status === 'pending' && <Clock3 size={12} />}
                            {booking.status === 'cancelled' && <XCircleIcon size={12} />}
                            <span className="ml-1">{getStatusLabel(booking.status)}</span>
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="ios-booking-detail">
                            <Mail size={14} className="text-gray-500" />
                            <span>{booking.clientEmail}</span>
                          </div>
                          <div className="ios-booking-detail">
                            <Phone size={14} className="text-gray-500" />
                            <span>{booking.clientPhone || 'No especificado'}</span>
                          </div>
                          <div className="ios-booking-detail">
                            <Calendar size={14} className="text-gray-500" />
                            <span>{new Date(booking.date).toLocaleDateString()} a las {booking.time}</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center space-x-4 flex-wrap">
                          <div className="ios-booking-meta">
                            <span className="text-gray-500">Servicio:</span>
                            <span className="font-medium text-gray-800">{booking.serviceName}</span>
                          </div>
                          <div className="ios-booking-meta">
                            <Clock size={14} className="text-gray-500" />
                            <span>{booking.duration} min</span>
                          </div>
                          <div className="ios-booking-meta">
                            <span className="text-gray-500">Precio:</span>
                            <span className="font-semibold text-green-600">€{booking.price}</span>
                          </div>
                        </div>
                        
                        {booking.notes && (
                          <div className="ios-notes-container">
                            <p className="text-gray-600 text-sm">{booking.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {booking.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleStatusChange(booking.id!, 'confirmed')}
                            className="ios-confirm-button"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleStatusChange(booking.id!, 'cancelled')}
                            className="ios-cancel-button"
                          >
                            <XCircleIcon size={16} />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => handleDeleteBooking(booking.id!)}
                        className="ios-delete-button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardBookings;