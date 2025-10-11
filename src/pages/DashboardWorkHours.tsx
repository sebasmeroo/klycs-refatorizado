import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserCalendars } from '@/hooks/useCalendar';
import { WorkHoursAnalyticsService } from '@/services/workHoursAnalytics';
import { WorkHoursStats } from '@/types/calendar';
import { Clock, TrendingUp, Calendar, Users, Download, Filter, CheckCircle2, DollarSign } from 'lucide-react';
import { toast } from '@/utils/toast';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';

export const DashboardWorkHours: React.FC = () => {
  const { user } = useAuth();
  const { planName, isLoading: planLoading } = useSubscriptionStatus();
  const { data: calendarsData, isLoading: loadingCalendars } = useUserCalendars(user?.uid);
  const calendars = calendarsData || [];

  const normalizedPlan = (planName || 'FREE').toUpperCase();
  const analyticsEnabled = normalizedPlan !== 'FREE';

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [onlyCompleted, setOnlyCompleted] = useState(true);
  const [stats, setStats] = useState<WorkHoursStats[]>([]);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cargar estadísticas SOLO cuando el usuario hace clic en "Actualizar"
  const loadStats = useCallback(async () => {
    if (!analyticsEnabled) return;
    if (calendars.length === 0) return;

    try {
      setLoading(true);

      const calendarsWithNames = calendars.map(cal => ({
        id: cal.id,
        name: cal.name,
        hourlyRate: typeof cal.hourlyRate === 'number' ? cal.hourlyRate : 0,
        currency: cal.hourlyRateCurrency ?? 'EUR'
      }));

      const professionalStats = await WorkHoursAnalyticsService.getAllProfessionalsStats(
        calendarsWithNames,
        selectedYear,
        onlyCompleted
      );

      setStats(professionalStats);
      setHasLoadedOnce(true);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      toast.error('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  }, [analyticsEnabled, calendars, selectedYear, onlyCompleted]);

  useEffect(() => {
    if (!analyticsEnabled) return;
    if (calendars.length > 0 && !hasLoadedOnce) {
      loadStats();
    }
  }, [analyticsEnabled, calendars.length, hasLoadedOnce, loadStats]);

  if (planLoading || loadingCalendars) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!analyticsEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="glass-card-ios max-w-xl w-full space-y-4 p-8 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
            <Clock className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Estadísticas de horas sólo para planes PRO y BUSINESS
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Al actualizar podrás generar reportes detallados de horas trabajadas, ingresos y rendimiento de tu equipo.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/dashboard/settings"
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg transition"
            >
              Ver planes disponibles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calcular totales generales
  const totalHours = stats.reduce((sum, s) => sum + s.totalHours, 0);
  const totalEvents = stats.reduce((sum, s) =>
    sum + s.monthlyBreakdown.reduce((eventSum, month) => eventSum + month.events, 0),
    0
  );
  const totalAmount = stats.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const aggregateCurrency = stats[0]?.currency ?? 'EUR';

  // Profesional con más horas
  const topProfessional = stats.length > 0
    ? stats.reduce((max, s) => s.totalHours > max.totalHours ? s : max, stats[0])
    : null;

  // Años disponibles (últimos 3 años)
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  // Exportar a CSV
  const exportToCSV = () => {
    try {
      let csv = 'Profesional,Mes,Horas,Eventos,Importe,Moneda\n';

      stats.forEach(stat => {
        const totalEventsForProfessional = stat.monthlyBreakdown.reduce((sum, month) => sum + month.events, 0);

        stat.monthlyBreakdown.forEach(month => {
          csv += `${stat.professionalName},${month.month},${month.hours},${month.events},${month.amount},${stat.currency}\n`;
        });

        csv += `${stat.professionalName},Total ${selectedYear},${stat.totalHours},${totalEventsForProfessional},${stat.totalAmount},${stat.currency}\n`;
      });

      if (stats.length > 1) {
        const aggregateHours = Math.round(totalHours * 100) / 100;
        const aggregateEvents = totalEvents;
        const aggregateAmount = Math.round(totalAmount * 100) / 100;

        csv += `Global,Total ${selectedYear},${aggregateHours},${aggregateEvents},${aggregateAmount},${aggregateCurrency}\n`;
      }

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `horas-trabajadas-${selectedYear}.csv`;
      a.click();

      toast.success('Estadísticas exportadas exitosamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al exportar las estadísticas');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-600" />
                Horas Trabajadas
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Estadísticas de tiempo trabajado por profesional
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadStats}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Actualizar
              </button>
              <button
                onClick={exportToCSV}
                disabled={stats.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Selector de año */}
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Filtro de servicios completados */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyCompleted}
                  onChange={(e) => setOnlyCompleted(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Solo servicios completados
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Resumen general */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Horas</p>
                <p className="text-3xl font-bold mt-2">
                  {WorkHoursAnalyticsService.formatHours(totalHours)}
                </p>
              </div>
              <Clock className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Servicios</p>
                <p className="text-3xl font-bold mt-2">{totalEvents}</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Total a pagar (año)</p>
                <p className="text-3xl font-bold mt-2">
                  {WorkHoursAnalyticsService.formatCurrency(totalAmount, aggregateCurrency)}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-emerald-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Top Profesional</p>
                <p className="text-lg font-bold mt-2 truncate">
                  {topProfessional?.professionalName || 'N/A'}
                </p>
                <p className="text-sm text-purple-100">
                  {topProfessional ? WorkHoursAnalyticsService.formatHours(topProfessional.totalHours) : '0h'}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Lista de profesionales */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6" />
            Desglose por Profesional
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando estadísticas...</p>
            </div>
          ) : stats.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No hay datos de horas trabajadas para este año
              </p>
            </div>
          ) : (
            stats.map((stat) => (
              <div
                key={stat.professionalId}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
              >
                {/* Header del profesional */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {stat.professionalName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Promedio: {WorkHoursAnalyticsService.formatHours(stat.averagePerMonth)}/mes
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {WorkHoursAnalyticsService.formatCurrency(stat.totalAmount, stat.currency)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total {selectedYear}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {WorkHoursAnalyticsService.formatHours(stat.totalHours)} • Tarifa {WorkHoursAnalyticsService.formatCurrency(stat.hourlyRate ?? 0, stat.currency)}/h
                    </p>
                  </div>
                </div>

                {/* Desglose mensual */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Desglose Mensual
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stat.monthlyBreakdown.map((month) => (
                      <div
                        key={month.month}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                              {new Date(month.month + '-01').toLocaleDateString('es-ES', {
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                              {WorkHoursAnalyticsService.formatHours(month.hours)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {month.events} servicios
                            </p>
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                              {WorkHoursAnalyticsService.formatCurrency(month.amount, stat.currency)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total anual: <span className="text-emerald-600 dark:text-emerald-400">{WorkHoursAnalyticsService.formatCurrency(stat.totalAmount, stat.currency)}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardWorkHours;
