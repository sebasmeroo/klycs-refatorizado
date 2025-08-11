import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { MetricsSummary } from '@/services/realTimeMetrics';

interface InteractiveChartsProps {
  metrics: MetricsSummary;
  loading?: boolean;
}

const COLORS = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#06B6D4'
};

const InteractiveCharts: React.FC<InteractiveChartsProps> = ({ 
  metrics, 
  loading = false 
}) => {
  // Datos para gráfico de líneas de actividad por hora
  const hourlyChartData = useMemo(() => {
    return metrics.hourlyData.map(data => ({
      ...data,
      hour: `${data.hour}:00`
    }));
  }, [metrics.hourlyData]);

  // Datos para gráfico de dispositivos
  const deviceChartData = useMemo(() => {
    return metrics.deviceBreakdown.map((device, index) => ({
      ...device,
      fill: Object.values(COLORS)[index % Object.values(COLORS).length]
    }));
  }, [metrics.deviceBreakdown]);

  // Datos para gráfico de referrers
  const referrerChartData = useMemo(() => {
    return metrics.topReferrers.slice(0, 5);
  }, [metrics.topReferrers]);

  // Datos de conversión
  const conversionData = useMemo(() => [
    { name: 'Vistas', value: metrics.totalViews, fill: COLORS.info },
    { name: 'Clics', value: metrics.totalClicks, fill: COLORS.primary },
    { name: 'Reservas', value: metrics.totalBookings, fill: COLORS.success }
  ], [metrics]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="glass-card-ios p-6">
            <div className="h-4 bg-gray-300 rounded animate-pulse w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actividad por Hora */}
      <div className="glass-card-ios p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <BarChart className="h-5 w-5 text-blue-400" />
          <span>Actividad por Hora (Últimas 24h)</span>
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="hour" 
                stroke="#9CA3AF"
                fontSize={12}
              />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                labelStyle={{ color: '#D1D5DB' }}
              />
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke={COLORS.info}
                strokeWidth={2}
                dot={{ fill: COLORS.info, r: 4 }}
                name="Vistas"
              />
              <Line 
                type="monotone" 
                dataKey="clicks" 
                stroke={COLORS.primary}
                strokeWidth={2}
                dot={{ fill: COLORS.primary, r: 4 }}
                name="Clics"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Embudo de Conversión */}
        <div className="glass-card-ios p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-green-400" />
            <span>Embudo de Conversión</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  width={60}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-400">
              Tasa de conversión: <span className="text-green-400 font-bold">
                {metrics.conversionRate.toFixed(1)}%
              </span>
            </p>
          </div>
        </div>

        {/* Dispositivos */}
        <div className="glass-card-ios p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-purple-400" />
            <span>Dispositivos</span>
          </h3>
          {deviceChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    label={({ device, percent }) => 
                      `${device} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {deviceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-slate-400 text-sm">No hay datos de dispositivos</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Referrers */}
      <div className="glass-card-ios p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <BarChart className="h-5 w-5 text-orange-400" />
          <span>Principales Fuentes de Tráfico</span>
        </h3>
        {referrerChartData.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={referrerChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="source" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill={COLORS.warning}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <p className="text-slate-400 text-sm">No hay datos de referrers</p>
          </div>
        )}
      </div>

      {/* Métricas Avanzadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card-ios p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {metrics.uniqueVisitors}
          </div>
          <div className="text-sm text-slate-400">Visitantes únicos</div>
          <div className="text-xs text-green-400 mt-1">
            Últimas 24 horas
          </div>
        </div>

        <div className="glass-card-ios p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {Math.floor(metrics.avgSessionDuration / 60)}m {metrics.avgSessionDuration % 60}s
          </div>
          <div className="text-sm text-slate-400">Duración promedio</div>
          <div className="text-xs text-blue-400 mt-1">
            Tiempo en sitio
          </div>
        </div>

        <div className="glass-card-ios p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {metrics.totalShares}
          </div>
          <div className="text-sm text-slate-400">Compartidos</div>
          <div className="text-xs text-purple-400 mt-1">
            Redes sociales
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveCharts;