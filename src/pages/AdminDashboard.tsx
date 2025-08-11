import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Palette, 
  Eye, 
  TrendingUp, 
  TrendingDown,
  Download,
  Star,
  Clock,
  Plus,
  Activity,
  Globe,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { templateDistributionService, TemplateStats, Template } from '@/services/templateDistribution';

interface StatsCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface PopularTemplate {
  id: string;
  name: string;
  category: string;
  usage: number;
  trend: number;
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState('7d');
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [popularTemplates, setPopularTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, templatesData] = await Promise.all([
        templateDistributionService.getStats(),
        templateDistributionService.getTemplates()
      ]);
      
      setStats(statsData);
      setPopularTemplates(templatesData.slice(0, 5)); // Top 5 templates
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsData: StatsCard[] = stats ? [
    {
      title: 'Total Plantillas',
      value: stats.totalTemplates.toString(),
      change: '+2 esta semana',
      trend: 'up',
      icon: <Palette className="w-5 h-5" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Plantillas Públicas',
      value: stats.publicTemplates.toString(),
      change: `${stats.privateTemplates} privadas`,
      trend: 'neutral',
      icon: <Eye className="w-5 h-5" />,
      color: 'bg-green-500'
    },
    {
      title: 'Total Descargas',
      value: stats.totalDownloads.toString(),
      change: '+8% esta semana',
      trend: 'up',
      icon: <Download className="w-5 h-5" />,
      color: 'bg-purple-500'
    },
    {
      title: 'Rating Promedio',
      value: stats.averageRating.toFixed(1),
      change: 'Basado en reseñas',
      trend: 'up',
      icon: <Star className="w-5 h-5" />,
      color: 'bg-orange-500'
    }
  ] : [];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const recentActivity = [
    {
      id: 1,
      type: 'template_created',
      message: 'Nueva plantilla "Futurista" creada',
      time: '2 horas',
      user: 'Admin'
    },
    {
      id: 2,
      type: 'template_updated',
      message: 'Plantilla "Moderno" actualizada',
      time: '5 horas',
      user: 'Admin'
    },
    {
      id: 3,
      type: 'user_activity',
      message: '156 nuevos usuarios registrados',
      time: '1 día',
      user: 'Sistema'
    },
    {
      id: 4,
      type: 'template_published',
      message: 'Plantilla "Vintage" publicada',
      time: '2 días',
      user: 'Admin'
    }
  ];

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-transparent text-[13px]">
      <div className="space-y-4 p-3">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 admin-rise">
          <div className="space-y-1.5 admin-card admin-card-hover rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Dashboard Administrativo
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  Panel de control y gestión de plantillas KLYCS
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative">
              <select 
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-3 py-1.5 border border-black/10 dark:border-white/10 rounded-lg bg-white/80 dark:bg-gray-800/70 backdrop-blur text-gray-900 dark:text-white text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-transparent"
              >
                <option value="7d">📊 Últimos 7 días</option>
                <option value="30d">📈 Últimos 30 días</option>
                <option value="90d">📉 Últimos 90 días</option>
              </select>
            </div>
            
            <Button
              onClick={() => navigate('/admin/creator')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 px-4 py-2 text-sm font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Plantilla
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((stat, index) => (
            <div
              key={index}
              className="group relative admin-card admin-card-hover rounded-xl p-3"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/30 dark:to-blue-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-white shadow group-hover:scale-105 transition-transform duration-300`}>
                    {stat.icon}
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(stat.trend)}
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-colors duration-300" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </h3>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {stat.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      stat.trend === 'up' ? 'bg-green-500 animate-pulse' : 
                      stat.trend === 'down' ? 'bg-red-500 animate-pulse' : 
                      'bg-gray-400'
                    }`}></div>
                    <p className={`text-[11px] font-medium ${
                      stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 
                      stat.trend === 'down' ? 'text-red-600 dark:text-red-400' : 
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {stat.change}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Popular Templates */}
          <div className="lg:col-span-2 admin-card rounded-xl">
            <div className="p-4 admin-divider">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Plantillas Más Populares
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Top 5 esta semana</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin/analytics')}
                  className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-200"
                >
                  Ver todo
                </Button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-2">
                {popularTemplates.map((template, index) => (
                  <div key={template.id} className="group flex items-center justify-between p-2 rounded-lg hover:bg-white/60 dark:hover:bg-white/5 transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                        index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                        index === 2 ? 'bg-gradient-to-br from-amber-600 to-yellow-700' :
                        'bg-gradient-to-br from-blue-500 to-purple-600'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {template.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                          {template.category} • {template.usage.toLocaleString()} usos
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        template.trend > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {template.trend > 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>{template.trend > 0 ? '+' : ''}{template.trend}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="admin-card rounded-xl">
            <div className="p-4 admin-divider">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Actividad Reciente
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Últimas acciones</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-2">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/60 dark:hover:bg-white/5 transition-all duration-200">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'template_created' ? 'bg-green-100 dark:bg-green-900/30' :
                      activity.type === 'template_updated' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      activity.type === 'user_activity' ? 'bg-purple-100 dark:bg-purple-900/30' :
                      'bg-orange-100 dark:bg-orange-900/30'
                    }`}>
                      {activity.type === 'template_created' ? '✨' :
                       activity.type === 'template_updated' ? '🔄' :
                       activity.type === 'user_activity' ? '👥' : '🚀'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-900 dark:text-white font-semibold">
                        {activity.message}
                      </p>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                        por {activity.user} • hace {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="admin-card rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Acciones Rápidas
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Herramientas más utilizadas</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              onClick={() => navigate('/admin/creator')}
              className="h-20 flex-col gap-2 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 border-0 text-sm"
            >
              <Plus className="w-6 h-6" />
              <span className="font-semibold">Nueva Plantilla</span>
            </Button>
            
            <Button
              onClick={() => navigate('/admin/templates')}
              className="h-20 flex-col gap-2 bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 border-0 text-sm"
            >
              <Palette className="w-6 h-6" />
              <span className="font-semibold">Gestionar Plantillas</span>
            </Button>
            
            <Button
              onClick={() => navigate('/admin/users')}
              className="h-20 flex-col gap-2 bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 border-0 text-sm"
            >
              <Users className="w-6 h-6" />
              <span className="font-semibold">Ver Usuarios</span>
            </Button>
            
            <Button
              onClick={() => navigate('/admin/analytics')}
              className="h-20 flex-col gap-2 bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 border-0 text-sm"
            >
              <BarChart3 className="w-6 h-6" />
              <span className="font-semibold">Analytics</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;