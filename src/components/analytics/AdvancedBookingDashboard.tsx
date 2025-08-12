import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  Calendar, TrendingUp, TrendingDown, Users, DollarSign, Clock,
  Star, AlertCircle, CheckCircle, XCircle, Phone, Mail,
  Filter, Download, RefreshCw, Eye, Target, Zap
} from 'lucide-react';
import { 
  BookingAnalyticsService, 
  BookingMetrics, 
  TimeSlotAnalytics, 
  ServiceAnalytics,
  ClientAnalytics,
  TrendAnalysis,
  PredictiveInsights,
  OperationalInsights
} from '@/services/bookingAnalytics';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface AdvancedBookingDashboardProps {
  cardId: string;
  className?: string;
}

export const AdvancedBookingDashboard: React.FC<AdvancedBookingDashboardProps> = ({
  cardId,
  className = ''
}) => {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const [metrics, setMetrics] = useState<BookingMetrics | null>(null);
  const [timeSlotAnalytics, setTimeSlotAnalytics] = useState<TimeSlotAnalytics[]>([]);
  const [serviceAnalytics, setServiceAnalytics] = useState<ServiceAnalytics[]>([]);
  const [clientAnalytics, setClientAnalytics] = useState<ClientAnalytics | null>(null);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsights | null>(null);
  const [operationalInsights, setOperationalInsights] = useState<OperationalInsights | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'services' | 'clients' | 'predictions' | 'operations'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, [cardId, dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [
        metricsData,
        timeSlotsData,
        servicesData,
        clientsData,
        trendsData,
        predictionsData,
        operationsData
      ] = await Promise.all([
        BookingAnalyticsService.getBookingMetrics(cardId, dateRange.from, dateRange.to),
        BookingAnalyticsService.getTimeSlotAnalytics(cardId, dateRange.from, dateRange.to),
        BookingAnalyticsService.getServiceAnalytics(cardId, dateRange.from, dateRange.to),
        BookingAnalyticsService.getClientAnalytics(cardId, dateRange.from, dateRange.to),
        BookingAnalyticsService.getTrendAnalysis(cardId, 'daily', dateRange.from, dateRange.to),
        BookingAnalyticsService.getPredictiveInsights(cardId, 30),
        BookingAnalyticsService.getOperationalInsights(cardId, dateRange.from, dateRange.to)
      ]);

      setMetrics(metricsData);
      setTimeSlotAnalytics(timeSlotsData);
      setServiceAnalytics(servicesData);
      setClientAnalytics(clientsData);
      setTrendAnalysis(trendsData);
      setPredictiveInsights(predictionsData);
      setOperationalInsights(operationsData);
    } catch (error) {
      console.error('Error cargando analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: number;
    icon: React.ReactNode;
    color?: string;
  }> = ({ title, value, subtitle, trend, icon, color = 'blue' }) => (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <div className={`text-${color}-600`}>{icon}</div>
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-4 flex items-center">
          {trend >= 0 ? (
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
          )}
          <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercentage(Math.abs(trend))}
          </span>
          <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
        </div>
      )}
    </Card>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Reservas"
          value={metrics?.totalBookings || 0}
          icon={<Calendar className="w-6 h-6" />}
          color="blue"
        />
        <MetricCard
          title="Ingresos Totales"
          value={formatCurrency(metrics?.totalRevenue || 0)}
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
        />
        <MetricCard
          title="Tasa de Conversión"
          value={formatPercentage(metrics?.conversionRate || 0)}
          icon={<Target className="w-6 h-6" />}
          color="purple"
        />
        <MetricCard
          title="Clientes Únicos"
          value={clientAnalytics?.totalClients || 0}
          icon={<Users className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {/* Gráfico de reservas por franja horaria */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Distribución por Horarios</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={timeSlotAnalytics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timeSlot" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                name === 'totalBookings' ? value : formatCurrency(value as number),
                name === 'totalBookings' ? 'Reservas' : 'Ingresos'
              ]}
            />
            <Legend />
            <Bar dataKey="totalBookings" fill="#3B82F6" name="Reservas" />
            <Bar dataKey="revenue" fill="#10B981" name="Ingresos" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top servicios */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Servicios Más Populares</h3>
          <div className="space-y-3">
            {serviceAnalytics.slice(0, 5).map((service, index) => (
              <div key={service.serviceId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold text-sm">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{service.serviceName}</p>
                    <p className="text-sm text-gray-500">{service.totalBookings} reservas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{formatCurrency(service.revenue)}</p>
                  <p className="text-xs text-gray-500">Score: {service.profitabilityScore}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Estado de reservas */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Estado de Reservas</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="font-medium">Confirmadas</span>
              </div>
              <span className="font-bold text-green-600">{metrics?.confirmedBookings || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="font-medium">Canceladas</span>
              </div>
              <span className="font-bold text-red-600">{metrics?.cancelledBookings || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="font-medium">No Show</span>
              </div>
              <span className="font-bold text-yellow-600">{metrics?.noShowBookings || 0}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const TrendsTab = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tendencias de Reservas</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={trendAnalysis?.data || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="bookings" 
              stroke="#3B82F6" 
              strokeWidth={2}
              name="Reservas"
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="revenue" 
              stroke="#10B981" 
              strokeWidth={2}
              name="Ingresos (€)"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Crecimiento Reservas"
          value={formatPercentage(trendAnalysis?.growth.bookingsGrowth || 0)}
          icon={<TrendingUp className="w-6 h-6" />}
          color="blue"
        />
        <MetricCard
          title="Crecimiento Ingresos"
          value={formatPercentage(trendAnalysis?.growth.revenueGrowth || 0)}
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
        />
        <MetricCard
          title="Crecimiento Clientes"
          value={formatPercentage(trendAnalysis?.growth.clientGrowth || 0)}
          icon={<Users className="w-6 h-6" />}
          color="purple"
        />
      </div>
    </div>
  );

  const PredictionsTab = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Períodos de Alta Demanda Próximos</h3>
        <div className="space-y-3">
          {predictiveInsights?.busyPeriods.slice(0, 7).map((period, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-medium">{new Date(period.date).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}</p>
                <p className="text-sm text-gray-600">Reservas esperadas: {period.expectedBookings}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    period.confidence > 80 ? 'bg-green-500' : 
                    period.confidence > 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm font-medium">{period.confidence}% confianza</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Proyección de Ingresos</h3>
        <div className="space-y-3">
          {predictiveInsights?.revenueProjection.map((projection, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium">{projection.month}</p>
                <p className="text-sm text-gray-600">Ingresos proyectados</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">{formatCurrency(projection.projectedRevenue)}</p>
                <p className="text-xs text-gray-500">{projection.confidence}% confianza</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Optimización de Capacidad</h3>
        <div className="space-y-3">
          {predictiveInsights?.capacityOptimization.map((opt, index) => (
            <div key={index} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">{opt.timeSlot}</p>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {opt.currentUtilization}% utilización
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 capitalize">
                  {opt.recommendedAction.replace('_', ' ')}
                </p>
                <p className="text-sm font-medium text-green-600">
                  +{opt.potentialImpact}% impacto
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const OperationsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Horarios Pico</h3>
          <div className="space-y-2">
            {operationalInsights?.peakHours.map((hour, index) => (
              <div key={index} className="flex items-center p-2 bg-red-50 rounded">
                <Clock className="w-4 h-4 text-red-500 mr-2" />
                <span className="font-medium">{hour}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Horarios de Baja Demanda</h3>
          <div className="space-y-2">
            {operationalInsights?.slowHours.map((hour, index) => (
              <div key={index} className="flex items-center p-2 bg-blue-50 rounded">
                <Clock className="w-4 h-4 text-blue-500 mr-2" />
                <span className="font-medium">{hour}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recomendaciones de Personal</h3>
        <div className="space-y-3">
          {operationalInsights?.staffingRecommendations.map((rec, index) => (
            <div key={index} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">{rec.timeSlot}</p>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                  {rec.recommendedStaff} persona{rec.recommendedStaff > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-sm text-gray-600">{rec.reasoning}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics de Reservas</h2>
          <p className="text-gray-600">Dashboard completo del sistema de reservas</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Desde:</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Hasta:</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <Button onClick={loadAnalytics} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Resumen', icon: Eye },
            { key: 'trends', label: 'Tendencias', icon: TrendingUp },
            { key: 'predictions', label: 'Predicciones', icon: Zap },
            { key: 'operations', label: 'Operaciones', icon: Clock }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido según tab activo */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'trends' && <TrendsTab />}
      {activeTab === 'predictions' && <PredictionsTab />}
      {activeTab === 'operations' && <OperationsTab />}
    </div>
  );
};