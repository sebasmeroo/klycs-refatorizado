import React, { useState, useEffect } from 'react';
import { performanceMonitor, WebVitalsMetric, PerformanceData } from '@/utils/performance';
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
  Cell
} from 'recharts';
import { 
  Activity, 
  Zap, 
  Timer, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface PerformanceDashboardProps {
  className?: string;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<Map<string, WebVitalsMetric>>(new Map());
  const [historicalData, setHistoricalData] = useState<PerformanceData[]>([]);
  const [performanceScore, setPerformanceScore] = useState<number>(0);

  useEffect(() => {
    // Get current metrics
    setMetrics(performanceMonitor.getMetrics());
    setHistoricalData(performanceMonitor.getStoredMetrics());
    setPerformanceScore(performanceMonitor.getPerformanceScore());

    // Listen for new metrics
    const handleMetric = (metric: WebVitalsMetric) => {
      setMetrics(new Map(performanceMonitor.getMetrics()));
      setPerformanceScore(performanceMonitor.getPerformanceScore());
    };

    performanceMonitor.onMetric(handleMetric);

    return () => {
      // Cleanup if needed
    };
  }, []);

  const getMetricColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getMetricIcon = (rating: string) => {
    switch (rating) {
      case 'good': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'needs-improvement': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'poor': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatValue = (name: string, value: number) => {
    if (name === 'CLS') {
      return value.toFixed(3);
    }
    return `${Math.round(value)}ms`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const chartData = Array.from(metrics.values()).map(metric => ({
    name: metric.name,
    value: metric.name === 'CLS' ? metric.value * 1000 : metric.value,
    rating: metric.rating,
  }));

  const scoreData = [
    { name: 'Performance Score', value: performanceScore },
    { name: 'Remaining', value: 100 - performanceScore },
  ];

  const COLORS = ['#10B981', '#EF4444'];

  const historicalChartData = historicalData.slice(-20).map((data, index) => ({
    time: index,
    LCP: data.lcp || 0,
    FID: data.fid || 0,
    CLS: (data.cls || 0) * 1000, // Scale CLS for visibility
    FCP: data.fcp || 0,
    TTFB: data.ttfb || 0,
  }));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <p className="text-gray-600">Core Web Vitals y métricas de rendimiento</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-blue-600" />
          <span className={`text-2xl font-bold ${getScoreColor(performanceScore)}`}>
            {performanceScore}
          </span>
        </div>
      </div>

      {/* Performance Score Circle */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Score</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={scoreData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                startAngle={90}
                endAngle={450}
              >
                {scoreData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [
                name === 'Performance Score' ? `${value}%` : '', 
                name === 'Performance Score' ? 'Score' : ''
              ]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center mt-2">
            <span className={`text-2xl font-bold ${getScoreColor(performanceScore)}`}>
              {performanceScore}/100
            </span>
          </div>
        </div>

        {/* Current Metrics */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Core Web Vitals</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from(metrics.values()).map((metric) => (
              <div key={metric.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-700">{metric.name}</h4>
                  {getMetricIcon(metric.rating)}
                </div>
                <div className={`text-2xl font-bold ${getMetricColor(metric.rating)}`}>
                  {formatValue(metric.name, metric.value)}
                </div>
                <div className="text-sm text-gray-500 capitalize">
                  {metric.rating.replace('-', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Métricas Actuales</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                typeof value === 'number' ? Math.round(value) : value,
                'Value'
              ]}
            />
            <Bar 
              dataKey="value" 
              fill={(entry) => {
                const rating = chartData.find(item => item.name === entry)?.rating;
                switch (rating) {
                  case 'good': return '#10B981';
                  case 'needs-improvement': return '#F59E0B';
                  case 'poor': return '#EF4444';
                  default: return '#6B7280';
                }
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Historical Trends */}
      {historicalChartData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Tendencias Históricas</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={historicalChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="LCP" stroke="#EF4444" strokeWidth={2} />
              <Line type="monotone" dataKey="FID" stroke="#F59E0B" strokeWidth={2} />
              <Line type="monotone" dataKey="FCP" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="TTFB" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="CLS" stroke="#8B5CF6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
              <span>LCP (Largest Contentful Paint)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
              <span>FID (First Input Delay)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              <span>FCP (First Contentful Paint)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              <span>TTFB (Time to First Byte)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
              <span>CLS (Cumulative Layout Shift × 1000)</span>
            </div>
          </div>
        </div>
      )}

      {/* Performance Tips */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Recomendaciones de Rendimiento</h3>
        <div className="space-y-3">
          {performanceScore < 90 && (
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Oportunidades de Mejora</h4>
                <p className="text-yellow-700 text-sm mt-1">
                  Tu puntuación de rendimiento puede mejorar. Considera optimizar imágenes, 
                  reducir JavaScript innecesario y usar lazy loading.
                </p>
              </div>
            </div>
          )}
          
          {Array.from(metrics.values()).some(m => m.rating === 'poor') && (
            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Métricas Críticas</h4>
                <p className="text-red-700 text-sm mt-1">
                  Algunas métricas están en el rango "poor". Esto puede afectar la experiencia del usuario 
                  y el SEO.
                </p>
              </div>
            </div>
          )}
          
          {performanceScore >= 90 && (
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">¡Excelente Rendimiento!</h4>
                <p className="text-green-700 text-sm mt-1">
                  Tu aplicación tiene un rendimiento excelente. Continúa monitoreando para 
                  mantener estos estándares.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};