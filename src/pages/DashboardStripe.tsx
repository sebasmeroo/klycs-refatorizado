import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  RefreshCw,
  Download,
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Copy,
  Save,
  Pencil
} from 'lucide-react';
import '@/styles/payments-dashboard.css';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useUserCalendars } from '@/hooks/useCalendar';
import { WorkHoursAnalyticsService } from '@/services/workHoursAnalytics';
import { toast } from '@/utils/toast';
import { usePaymentStats, usePaymentPendingServices, useUpdatePayoutComplete } from '@/hooks/usePaymentStats';
import { useQueryClient } from '@tanstack/react-query';

type CurrencySummary = {
  currency: string;
  amount: number;
  hours: number;
  professionals: number;
};

const formatCurrency = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency?.toUpperCase() || 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  } catch (error) {
    return `${(value || 0).toFixed(2)} ${currency?.toUpperCase() || 'EUR'}`;
  }
};

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const formatDisplayDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const DashboardStripe: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { planName, isLoading: planLoading } = useSubscriptionStatus();
  const { data: calendarsData, isLoading: loadingCalendars } = useUserCalendars(user?.uid);
  const calendars = calendarsData || [];

  const normalizedPlan = (planName || 'FREE').toUpperCase();
  const paymentsEnabled = normalizedPlan === 'PRO' || normalizedPlan === 'BUSINESS';

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [onlyCompleted, setOnlyCompleted] = useState(true);
  const [period, setPeriod] = useState<'year' | 'quarter' | 'month'>('year');
  const [selectedQuarter, setSelectedQuarter] = useState(() => Math.floor((new Date().getMonth()) / 3) + 1);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [payoutDrafts, setPayoutDrafts] = useState<Record<string, {
    iban?: string;
    bank?: string;
    notes?: string;
    paypalEmail?: string;
  }>>({});
  const [savingPayout, setSavingPayout] = useState<Record<string, boolean>>({});
  const [editingPayout, setEditingPayout] = useState<Record<string, boolean>>({});
  const [payoutRecordDrafts, setPayoutRecordDrafts] = useState<Record<string, {
    status: 'pending' | 'paid';
    lastPaymentDate?: string;
    lastPaymentBy?: string;
    note?: string;
  }>>({});
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);

  // ✅ REACT QUERY: Reemplaza loadStats manual con hook optimizado
  const { data: stats = [], isLoading: statsLoading, dataUpdatedAt } = usePaymentStats(
    user?.uid,
    selectedYear,
    onlyCompleted
  );

  const loading = statsLoading;
  const hasLoadedOnce = stats.length > 0 || !statsLoading;
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return [current, current - 1, current - 2];
  }, []);

  const calendarMap = useMemo(() => {
    const map = new Map<string, (typeof calendars)[number]>();
    calendars.forEach(calendar => map.set(calendar.id, calendar));
    return map;
  }, [calendars]);

  const periodRange = useMemo(() => {
    const startYear = selectedYear;
    let start = new Date(startYear, 0, 1);
    let end = new Date(startYear, 11, 31, 23, 59, 59);

    if (period === 'quarter') {
      const quarterIndex = Math.min(Math.max(selectedQuarter - 1, 0), 3);
      start = new Date(startYear, quarterIndex * 3, 1);
      end = new Date(startYear, quarterIndex * 3 + 3, 0, 23, 59, 59);
    } else if (period === 'month') {
      const monthIndex = Math.min(Math.max(selectedMonth, 0), 11);
      start = new Date(startYear, monthIndex, 1);
      end = new Date(startYear, monthIndex + 1, 0, 23, 59, 59);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [selectedYear, period, selectedQuarter, selectedMonth]);

  const periodKey = useMemo(() => {
    if (period === 'quarter') {
      return `${selectedYear}-Q${selectedQuarter}`;
    }
    if (period === 'month') {
      return `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`;
    }
    return `${selectedYear}`;
  }, [period, selectedYear, selectedQuarter, selectedMonth]);

  // ✅ REACT QUERY: Reemplaza loadPending manual con hook optimizado
  const calendarIds = useMemo(() => calendars.map(c => c.id), [calendars]);
  const { data: pendingServices = {}, isLoading: pendingLoading } = usePaymentPendingServices(
    calendarIds,
    periodRange.start,
    periodRange.end,
    paymentsEnabled
  );

  // ✅ Función para forzar refresh manual (botón Actualizar)
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['paymentStats'] });
    queryClient.invalidateQueries({ queryKey: ['paymentPendingServices'] });
    toast.success('Actualizando datos...');
  }, [queryClient]);

  const statsForDisplay = useMemo(() => {
    return stats.map(stat => {
      const filteredMonths = stat.monthlyBreakdown.filter(month => {
        const [yearStr, monthStr] = month.month.split('-');
        const monthIndex = Number(monthStr) - 1;
        const date = new Date(Number(yearStr), monthIndex, 1);
        return date >= periodRange.start && date <= periodRange.end;
      });

      const filteredAmount = filteredMonths.reduce((sum, month) => sum + (month.amount || 0), 0);
      const filteredHours = filteredMonths.reduce((sum, month) => sum + (month.hours || 0), 0);
      const filteredEvents = filteredMonths.reduce((sum, month) => sum + (month.events || 0), 0);

      return {
        base: stat,
        filteredMonths,
        filteredAmount,
        filteredHours,
        filteredEvents
      };
    });
  }, [stats, periodRange]);

  const totalsByCurrency = useMemo<CurrencySummary[]>(() => {
    const map = new Map<string, CurrencySummary>();

    statsForDisplay.forEach(({ base, filteredAmount, filteredHours }) => {
      const currency = (base.currency || 'EUR').toUpperCase();
      const entry = map.get(currency) ?? {
        currency,
        amount: 0,
        hours: 0,
        professionals: 0
      };

      entry.amount += filteredAmount || 0;
      entry.hours += filteredHours || 0;
      entry.professionals += 1;
      map.set(currency, entry);
    });

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [statsForDisplay]);

  const currentTotalAmount = useMemo(() => {
    return totalsByCurrency.reduce((sum, entry) => sum + entry.amount, 0);
  }, [totalsByCurrency]);

  const primaryCurrency = useMemo(() => {
    return totalsByCurrency[0]?.currency || 'EUR';
  }, [totalsByCurrency]);

  const overallTotals = useMemo(() => {
    const totalHours = statsForDisplay.reduce((sum, stat) => sum + (stat.filteredHours || 0), 0);
    const totalEvents = statsForDisplay.reduce((sum, stat) => sum + (stat.filteredEvents || 0), 0);
    return {
      totalHours,
      totalEvents
    };
  }, [statsForDisplay]);

  const previousPeriodRange = useMemo(() => {
    const start = new Date(periodRange.start);
    const end = new Date(periodRange.end);
    const duration = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);
    prevStart.setHours(0, 0, 0, 0);
    prevEnd.setHours(23, 59, 59, 999);
    return { start: prevStart, end: prevEnd };
  }, [periodRange]);

  const previousTotals = useMemo(() => {
    const result = stats.map(stat => {
      const previousMonths = stat.monthlyBreakdown.filter(month => {
        const [yearStr, monthStr] = month.month.split('-');
        const monthIndex = Number(monthStr) - 1;
        const date = new Date(Number(yearStr), monthIndex, 1);
        return date >= previousPeriodRange.start && date <= previousPeriodRange.end;
      });
      return {
        amount: previousMonths.reduce((sum, month) => sum + (month.amount || 0), 0),
        hours: previousMonths.reduce((sum, month) => sum + (month.hours || 0), 0),
        events: previousMonths.reduce((sum, month) => sum + (month.events || 0), 0)
      };
    });

    return {
      totalAmount: result.reduce((sum, item) => sum + item.amount, 0),
      totalHours: result.reduce((sum, item) => sum + item.hours, 0),
      totalEvents: result.reduce((sum, item) => sum + item.events, 0)
    };
  }, [stats, previousPeriodRange]);

  const isProfessionalPending = useCallback((professionalId: string) => {
    const pendingCount = pendingServices[professionalId]?.count ?? 0;
    const recordDraft = payoutRecordDrafts[professionalId];
    const recordStatus = recordDraft?.status
      ?? calendarMap.get(professionalId)?.payoutRecords?.[periodKey]?.status
      ?? 'pending';
    return pendingCount > 0 || recordStatus !== 'paid';
  }, [pendingServices, payoutRecordDrafts, calendarMap, periodKey]);

  const displayStats = useMemo(() => {
    if (!showPendingOnly) return statsForDisplay;
    return statsForDisplay.filter(({ base: stat }) => isProfessionalPending(stat.professionalId));
  }, [statsForDisplay, showPendingOnly, isProfessionalPending]);

  const hasPendingProfessionals = useMemo(() => {
    return statsForDisplay.some(({ base }) => isProfessionalPending(base.professionalId));
  }, [statsForDisplay, isProfessionalPending]);

  useEffect(() => {
    if (!displayStats.length) {
      setSelectedProfessionalId(null);
      return;
    }
    setSelectedProfessionalId(prev => {
      if (prev && displayStats.some(({ base }) => base.professionalId === prev)) {
        return prev;
      }
      return displayStats[0].base.professionalId;
    });
  }, [displayStats]);

  const handlePayoutFieldChange = useCallback((calendarId: string, field: 'iban' | 'bank' | 'notes' | 'paypalEmail', value: string) => {
    setPayoutDrafts(prev => {
      const base = prev[calendarId] ?? {
        iban: calendarMap.get(calendarId)?.payoutDetails?.iban || '',
        bank: calendarMap.get(calendarId)?.payoutDetails?.bank || '',
        notes: calendarMap.get(calendarId)?.payoutDetails?.notes || '',
        paypalEmail: calendarMap.get(calendarId)?.payoutDetails?.paypalEmail || ''
      };
      return {
        ...prev,
        [calendarId]: {
          ...base,
          [field]: value
        }
      };
    });
  }, [calendarMap]);

  const handlePayoutRecordChange = useCallback((calendarId: string, field: 'status' | 'lastPaymentDate' | 'lastPaymentBy' | 'note', value: string) => {
    setPayoutRecordDrafts(prev => {
      const currentRecord = prev[calendarId] ?? {
        status: (calendarMap.get(calendarId)?.payoutRecords?.[periodKey]?.status ?? 'pending') as 'pending' | 'paid',
        lastPaymentDate: calendarMap.get(calendarId)?.payoutRecords?.[periodKey]?.lastPaymentDate || '',
        lastPaymentBy: calendarMap.get(calendarId)?.payoutRecords?.[periodKey]?.lastPaymentBy || '',
        note: calendarMap.get(calendarId)?.payoutRecords?.[periodKey]?.note || ''
      };
      return {
        ...prev,
        [calendarId]: {
          ...currentRecord,
          [field]: field === 'status' ? (value as 'pending' | 'paid') : value
        }
      };
    });
  }, [calendarMap, periodKey]);

  const handleTogglePayoutEdit = useCallback((calendarId: string) => {
    setEditingPayout(prev => {
      const next = !prev[calendarId];
      if (next) {
        setPayoutDrafts(drafts => {
          if (drafts[calendarId]) return drafts;
          const calendar = calendarMap.get(calendarId);
          return {
            ...drafts,
            [calendarId]: {
              iban: calendar?.payoutDetails?.iban || '',
              bank: calendar?.payoutDetails?.bank || '',
              notes: calendar?.payoutDetails?.notes || '',
              paypalEmail: calendar?.payoutDetails?.paypalEmail || ''
            }
          };
        });
        setPayoutRecordDrafts(drafts => {
          if (drafts[calendarId]) return drafts;
          const record = calendarMap.get(calendarId)?.payoutRecords?.[periodKey];
          return {
            ...drafts,
            [calendarId]: {
              status: (record?.status ?? 'pending') as 'pending' | 'paid',
              lastPaymentDate: record?.lastPaymentDate || '',
              lastPaymentBy: record?.lastPaymentBy || '',
              note: record?.note || ''
            }
          };
        });
      }
      return { ...prev, [calendarId]: next };
    });
  }, [calendarMap, periodKey]);

  const handleCancelPayoutEdit = useCallback((calendarId: string) => {
    setEditingPayout(prev => ({ ...prev, [calendarId]: false }));
    setPayoutDrafts(prev => {
      const { [calendarId]: _discarded, ...rest } = prev;
      return rest;
    });
    setPayoutRecordDrafts(prev => {
      const { [calendarId]: _discarded, ...rest } = prev;
      return rest;
    });
  }, []);

  const handleCopyValue = useCallback(async (value: string | undefined, label: string) => {
    if (!value) {
      toast.info(`No hay ${label.toLowerCase()} para copiar`);
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado`);
    } catch (error) {
      console.error('Error copiando al portapapeles', error);
      toast.error(`No pudimos copiar el ${label.toLowerCase()}`);
    }
  }, []);

  // ✅ REACT QUERY: Hook de mutación optimizado
  const updatePayoutMutation = useUpdatePayoutComplete();

  const handleSavePayout = useCallback(async (calendarId: string) => {
    const calendar = calendarMap.get(calendarId);
    if (!calendar) {
      toast.error('No encontramos el profesional a actualizar');
      return;
    }

    const draft =
      payoutDrafts[calendarId] ?? {
        iban: calendar.payoutDetails?.iban || '',
        bank: calendar.payoutDetails?.bank || '',
        notes: calendar.payoutDetails?.notes || '',
        paypalEmail: calendar.payoutDetails?.paypalEmail || ''
      };

    const existingRecord = calendar.payoutRecords?.[periodKey];
    const recordDraft = payoutRecordDrafts[calendarId] ?? {
      status: (existingRecord?.status ?? 'pending') as 'pending' | 'paid',
      lastPaymentDate: existingRecord?.lastPaymentDate || '',
      lastPaymentBy: existingRecord?.lastPaymentBy || '',
      note: existingRecord?.note || ''
    };
    const normalizedRecord = {
      status: recordDraft.status,
      lastPaymentDate: recordDraft.lastPaymentDate || undefined,
      lastPaymentBy: recordDraft.lastPaymentBy || undefined,
      note: recordDraft.note || undefined
    };

    try {
      setSavingPayout(prev => ({ ...prev, [calendarId]: true }));

      // ✅ Usar mutación de React Query (actualiza caché automáticamente)
      await updatePayoutMutation.mutateAsync({
        calendarId,
        periodKey,
        payoutDetails: draft,
        payoutRecord: normalizedRecord
      });

      toast.success('Detalles de pago actualizados');
      setPayoutDrafts(prev => ({ ...prev, [calendarId]: draft }));
      setPayoutRecordDrafts(prev => ({ ...prev, [calendarId]: {
        status: normalizedRecord.status,
        lastPaymentDate: normalizedRecord.lastPaymentDate,
        lastPaymentBy: normalizedRecord.lastPaymentBy,
        note: normalizedRecord.note
      } }));
      setEditingPayout(prev => ({ ...prev, [calendarId]: false }));
    } catch (error) {
      console.error('Error guardando detalles de pago', error);
      toast.error('No pudimos guardar los detalles de pago');
    } finally {
      setSavingPayout(prev => ({ ...prev, [calendarId]: false }));
    }
  }, [calendarMap, payoutDrafts, payoutRecordDrafts, periodKey, updatePayoutMutation]);

  const renderProfessionalDetail = useCallback((statContainer: typeof statsForDisplay[number]) => {
    const { base: stat, filteredMonths, filteredAmount, filteredHours, filteredEvents } = statContainer;
    const relatedCalendar = calendarMap.get(stat.professionalId);
    const owner = relatedCalendar?.members?.find(member => member.role === 'owner') ?? relatedCalendar?.members?.[0];

    const payoutDetails = (() => {
      const calAny = relatedCalendar as any;
      return calAny?.payoutDetails || calAny?.billing || calAny?.settings?.payout || {};
    })() as {
      iban?: string;
      bank?: string;
      notes?: string;
      paypalEmail?: string;
    };

    const monthlySeries = Array.from({ length: 12 }, (_, index) => {
      const monthNumber = (index + 1).toString().padStart(2, '0');
      const key = `${selectedYear}-${monthNumber}`;
      const entry = stat.monthlyBreakdown.find(item => item.month === key);
      const amount = entry?.amount ?? 0;
      const hours = entry?.hours ?? 0;
      return {
        label: MONTH_LABELS[index],
        monthKey: key,
        amount,
        hours,
        events: entry?.events ?? 0,
        valueForChart: amount > 0 ? amount : hours
      };
    });

    const maxValue = monthlySeries.reduce((max, month) => Math.max(max, month.valueForChart), 0);
    const lastMonth = monthlySeries[monthlySeries.length - 1];
    const lastRecordedMonth = [...monthlySeries]
      .reverse()
      .find(month => month.events > 0 || month.hours > 0 || month.amount > 0);
    const lastFilteredMonth = filteredMonths.length ? filteredMonths[filteredMonths.length - 1] : undefined;
    const lastFilteredDisplay = lastFilteredMonth
      ? {
          label: MONTH_LABELS[Number(lastFilteredMonth.month.split('-')[1]) - 1],
          events: lastFilteredMonth.events,
          amount: lastFilteredMonth.amount
        }
      : lastRecordedMonth ?? lastMonth;

    const draft =
      payoutDrafts[stat.professionalId] ?? {
        iban: payoutDetails.iban || '',
        bank: payoutDetails.bank || '',
        notes: payoutDetails.notes || '',
        paypalEmail: payoutDetails.paypalEmail || ''
      };
    const isSaving = savingPayout[stat.professionalId];
    const editing = editingPayout[stat.professionalId] ?? false;
    const formValues = editing
      ? draft
      : {
          iban: payoutDetails.iban || draft.iban || '',
          bank: payoutDetails.bank || draft.bank || '',
          notes: payoutDetails.notes || draft.notes || '',
          paypalEmail: payoutDetails.paypalEmail || draft.paypalEmail || ''
        };

    const currentRecord = (relatedCalendar as any)?.payoutRecords?.[periodKey];
    const recordDraft = payoutRecordDrafts[stat.professionalId];
    const displayRecord = editing
      ? recordDraft ?? {
          status: (currentRecord?.status ?? 'pending') as 'pending' | 'paid',
          lastPaymentDate: currentRecord?.lastPaymentDate || '',
          lastPaymentBy: currentRecord?.lastPaymentBy || '',
          note: currentRecord?.note || ''
        }
      : currentRecord ?? null;
    const recordStatus = displayRecord?.status ?? 'pending';

    const activeMonthKeys = filteredMonths.length
      ? new Set(filteredMonths.map(month => month.month))
      : new Set(monthlySeries.map(month => month.monthKey));

    return (
      <article className="payments-professional-card">
        <div className="payments-professional-card__header">
          <div className="payments-professional-card__identity">
            <div className="payments-professional-card__avatar">
              {owner?.avatar ? (
                <img src={owner.avatar} alt={owner.name} />
              ) : (
                <span>{(stat.professionalName || 'P').charAt(0)}</span>
              )}
            </div>
            <div>
              <h4>{stat.professionalName}</h4>
              <span>{owner?.email || relatedCalendar?.linkedEmail || 'Sin email vinculado'}</span>
            </div>
          </div>
          <div className="payments-status">
            {editing ? (
              <select
                className="payments-status__select"
                value={(recordDraft?.status ?? displayRecord?.status ?? 'pending')}
                onChange={(event) => handlePayoutRecordChange(stat.professionalId, 'status', event.target.value)}
              >
                <option value="pending">Pendiente</option>
                <option value="paid">Pagado</option>
              </select>
            ) : (
              <span className={`payments-status__pill payments-status__pill--${recordStatus}`}>
                {recordStatus === 'paid' ? 'Pagado' : 'Pendiente'}
              </span>
            )}
            {!editing && displayRecord?.lastPaymentDate && (
              <span className="payments-status__meta">
                Último pago: {formatDisplayDate(displayRecord.lastPaymentDate)}
                {displayRecord?.lastPaymentBy ? ` · Responsable: ${displayRecord.lastPaymentBy}` : ''}
              </span>
            )}
          </div>
          <div className="payments-professional-card__metrics">
            <div className="payments-metric">
              <span>Total a pagar</span>
              <strong>{formatCurrency(filteredAmount || 0, stat.currency || 'EUR')}</strong>
              <small>Total servicios registrados: {filteredEvents}</small>
            </div>
            <div className="payments-metric payments-metric--hover">
              <span>Horas trabajadas</span>
              <strong>{WorkHoursAnalyticsService.formatHours(filteredHours || 0)}</strong>
              <small>Incluye servicios completados y en curso según filtros</small>
            </div>
            <div className="payments-metric">
              <span>Tarifa base</span>
              <strong>
                {stat.hourlyRate > 0
                  ? `${formatCurrency(stat.hourlyRate, stat.currency || 'EUR')}/h`
                  : 'Tarifa no definida'}
              </strong>
              <small>
                {stat.hourlyRate > 0
                  ? `Moneda: ${(stat.currency || 'EUR').toUpperCase()}`
                  : 'Edita el calendario para asignar una tarifa'}
              </small>
            </div>
            {pendingLoading ? (
              <div className="payments-metric">
                <span>Servicios pendientes</span>
                <strong>Calculando...</strong>
                <small>Revisa en unos segundos</small>
              </div>
            ) : (
              <div className={`payments-metric ${pendingServices[stat.professionalId]?.count ? 'payments-metric--alert' : ''}`}>
                <span>Servicios pendientes</span>
                <strong>{pendingServices[stat.professionalId]?.count ?? 0}</strong>
                <small>
                  {pendingServices[stat.professionalId]?.count
                    ? `Ejemplos: ${pendingServices[stat.professionalId]?.examples.join(', ')}`
                    : 'Todo completado en este período'}
                </small>
              </div>
            )}
            <div className="payments-metric">
              <span>Último mes</span>
              <strong>{formatCurrency(lastFilteredDisplay?.amount || 0, stat.currency || 'EUR')}</strong>
              <small>
                {(lastFilteredDisplay?.label ?? 'Sin datos')} ·{' '}
                {lastFilteredDisplay?.events ?? 0} servicios
              </small>
            </div>
          </div>
        </div>

        <div className="payments-professional-card__chart">
          <div className="payments-chart">
            {monthlySeries.map(month => {
              const height = maxValue > 0 ? Math.max(6, (month.valueForChart / maxValue) * 100) : 8;
              const amountLabel = formatCurrency(month.amount, stat.currency || 'EUR');
              return (
                <div
                  key={`${stat.professionalId}-${month.label}`}
                  className={`payments-chart__column ${activeMonthKeys.has(month.monthKey) ? 'payments-chart__column--active' : ''}`}
                >
                  <div
                    className="payments-chart__bar"
                    style={{ height: `${height}%` }}
                    data-amount={amountLabel}
                    data-hours={month.hours.toFixed(2)}
                  />
                  <span className="payments-chart__label">{month.label}</span>
                </div>
              );
            })}
          </div>
          <div className="payments-professional-card__legend">
            <div>
              <span className="legend-dot legend-dot--amount" />
              <span>Importe mensual</span>
            </div>
            <div>
              <span className="legend-dot legend-dot--hours" />
              <span>Horas registradas</span>
            </div>
          </div>
          <div className="payments-history">
            <h5>Histórico del período</h5>
            {filteredMonths.length === 0 ? (
              <p className="payments-history__empty">Sin movimientos registrados dentro del rango seleccionado.</p>
            ) : (
              <ul>
                {filteredMonths.map(month => {
                  const [yearStr, monthStr] = month.month.split('-');
                  const monthIndex = Number(monthStr) - 1;
                  return (
                    <li key={`${stat.professionalId}-history-${month.month}`}>
                      <span>{MONTH_LABELS[monthIndex]} {yearStr}</span>
                      <span>{formatCurrency(month.amount || 0, stat.currency || 'EUR')}</span>
                      <span>{WorkHoursAnalyticsService.formatHours(month.hours || 0)}</span>
                      <span>{month.events} servicios</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="payments-professional-card__payout">
          <div className="payments-payout-field">
            <label htmlFor={`iban-${stat.professionalId}`}>IBAN</label>
            <div className={`payments-payout-field__control ${editing ? '' : 'payments-payout-field__control--readonly'}`}>
              <input
                id={`iban-${stat.professionalId}`}
                value={formValues.iban || ''}
                onChange={(event) => handlePayoutFieldChange(stat.professionalId, 'iban', event.target.value)}
                placeholder="ES00 0000 0000 0000 0000 0000"
                readOnly={!editing}
              />
              <button
                type="button"
                className="payments-copy-button"
                onClick={() => handleCopyValue(formValues.iban, 'IBAN')}
                aria-label="Copiar IBAN"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
          <div className="payments-payout-field">
            <label htmlFor={`bank-${stat.professionalId}`}>Banco / Método</label>
            <div className={`payments-payout-field__control ${editing ? '' : 'payments-payout-field__control--readonly'}`}>
              <input
                id={`bank-${stat.professionalId}`}
                value={formValues.bank || ''}
                onChange={(event) => handlePayoutFieldChange(stat.professionalId, 'bank', event.target.value)}
                placeholder="Banco o plataforma de pago"
                readOnly={!editing}
              />
              <button
                type="button"
                className="payments-copy-button"
                onClick={() => handleCopyValue(formValues.bank, 'Banco')}
                aria-label="Copiar Banco"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
          <div className="payments-payout-field">
            <label htmlFor={`paypal-${stat.professionalId}`}>PayPal / Email</label>
            <div className={`payments-payout-field__control ${editing ? '' : 'payments-payout-field__control--readonly'}`}>
              <input
                id={`paypal-${stat.professionalId}`}
                value={formValues.paypalEmail || ''}
                onChange={(event) => handlePayoutFieldChange(stat.professionalId, 'paypalEmail', event.target.value)}
                placeholder="correo@paypal.com"
                readOnly={!editing}
              />
              <button
                type="button"
                className="payments-copy-button"
                onClick={() => handleCopyValue(formValues.paypalEmail, 'Email de pago')}
                aria-label="Copiar email de pago"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
          <div className="payments-payout-field">
            <label htmlFor={`last-payment-date-${stat.professionalId}`}>Fecha último pago</label>
            {editing ? (
              <input
                id={`last-payment-date-${stat.professionalId}`}
                type="date"
                value={(recordDraft?.lastPaymentDate ?? displayRecord?.lastPaymentDate ?? '')}
                onChange={(event) => handlePayoutRecordChange(stat.professionalId, 'lastPaymentDate', event.target.value)}
              />
            ) : (
              <p className="payments-readonly-value">
                {displayRecord?.lastPaymentDate ? formatDisplayDate(displayRecord.lastPaymentDate) : 'Sin registrar'}
              </p>
            )}
          </div>
          <div className="payments-payout-field">
            <label htmlFor={`last-payment-by-${stat.professionalId}`}>Responsable</label>
            {editing ? (
              <input
                id={`last-payment-by-${stat.professionalId}`}
                value={(recordDraft?.lastPaymentBy ?? displayRecord?.lastPaymentBy ?? '')}
                onChange={(event) => handlePayoutRecordChange(stat.professionalId, 'lastPaymentBy', event.target.value)}
                placeholder="Nombre de quien confirmó el pago"
              />
            ) : (
              <p className="payments-readonly-value">
                {displayRecord?.lastPaymentBy || 'Sin asignar'}
              </p>
            )}
          </div>
          <div className="payments-payout-field payments-payout-field--textarea">
            <label htmlFor={`notes-${stat.professionalId}`}>Notas internas</label>
            <textarea
              id={`notes-${stat.professionalId}`}
              value={formValues.notes || ''}
              onChange={(event) => handlePayoutFieldChange(stat.professionalId, 'notes', event.target.value)}
              placeholder="Instrucciones de transferencia, referencias, etc."
              rows={2}
              readOnly={!editing}
            />
          </div>
          <div className="payments-payout-field payments-payout-field--textarea">
            <label htmlFor={`period-note-${stat.professionalId}`}>Notas del período</label>
            {editing ? (
              <textarea
                id={`period-note-${stat.professionalId}`}
                value={(recordDraft?.note ?? displayRecord?.note ?? '')}
                onChange={(event) => handlePayoutRecordChange(stat.professionalId, 'note', event.target.value)}
                placeholder="Observaciones para este pago"
                rows={2}
              />
            ) : (
              <p className="payments-readonly-value">
                {displayRecord?.note || 'Sin notas adicionales'}
              </p>
            )}
          </div>
        </div>
        <div className="payments-professional-card__actions">
          <small>
            Estos datos se guardan en el calendario del profesional. Úsalos al procesar transferencias.
          </small>
          <div className="payments-professional-card__action-buttons">
            {editing ? (
              <>
                <button
                  type="button"
                  className="payments-button payments-button--ghost payments-button--with-icon payments-button--compact"
                  onClick={() => handleCancelPayoutEdit(stat.professionalId)}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="payments-button payments-button--primary payments-button--with-icon payments-button--compact"
                  onClick={() => handleSavePayout(stat.professionalId)}
                  disabled={isSaving}
                >
                  <Save size={16} />
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="payments-button payments-button--ghost payments-button--with-icon payments-button--compact"
                onClick={() => handleTogglePayoutEdit(stat.professionalId)}
              >
                <Pencil size={16} />
                Editar datos
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }, [calendarMap, selectedYear, payoutDrafts, savingPayout, editingPayout, payoutRecordDrafts, handlePayoutRecordChange, pendingLoading, pendingServices, handlePayoutFieldChange, handleCopyValue, handleCancelPayoutEdit, handleSavePayout, handleTogglePayoutEdit])

  const exportToCSV = useCallback(() => {
    if (!stats.length) {
      toast.info('No hay información que exportar todavía');
      return;
    }

    try {
      let csv = 'Profesional,Moneda,Total a pagar,Total horas,Tarifa/Hora,Último mes (importe),Eventos último mes\n';

      stats.forEach(stat => {
        const lastMonth = stat.monthlyBreakdown[stat.monthlyBreakdown.length - 1];

        csv += [
          stat.professionalName,
          stat.currency,
          stat.totalAmount,
          stat.totalHours,
          stat.hourlyRate,
          lastMonth?.amount ?? 0,
          lastMonth?.events ?? 0
        ].join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pagos-profesionales-${selectedYear}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Resumen económico exportado correctamente');
    } catch (error) {
      console.error('Error exportando CSV:', error);
      toast.error('No pudimos exportar el archivo');
    }
  }, [selectedYear, stats]);

  const exportPendingToCSV = useCallback(() => {
    const pendingProfessionals = statsForDisplay.filter(({ base }) => isProfessionalPending(base.professionalId));
    if (!pendingProfessionals.length) {
      toast.info('No hay profesionales pendientes en este período');
      return;
    }

    try {
      let csv = 'Profesional,Estado,Pendientes,Servicios pendientes,IBAN,Banco,Email Pago\n';
      pendingProfessionals.forEach(({ base: stat }) => {
        const calendar = calendarMap.get(stat.professionalId);
        const status = (calendar?.payoutRecords?.[periodKey]?.status ?? 'pending').toUpperCase();
        const pendingCount = pendingServices[stat.professionalId]?.count ?? 0;
        const details = calendar?.payoutDetails ?? {};
        csv += [
          `"${stat.professionalName}"`,
          status,
          pendingCount,
          `"${(pendingServices[stat.professionalId]?.examples ?? []).join('; ')}"`,
          `"${details.iban ?? ''}"`,
          `"${details.bank ?? ''}"`,
          `"${details.paypalEmail ?? ''}"`
        ].join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pendientes-${periodKey}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Exportado pendientes correctamente');
    } catch (error) {
      console.error('Error exportando pendientes', error);
      toast.error('No pudimos exportar los pendientes');
    }
  }, [statsForDisplay, isProfessionalPending, calendarMap, periodKey, pendingServices]);

  if (planLoading || loadingCalendars) {
    return (
      <div className="payments-page">
        <div className="payments-container payments-container--center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!paymentsEnabled) {
    return (
      <div className="payments-page">
        <div className="payments-container payments-container--center">
          <div className="payments-card payments-card--compact">
            <div className="payments-card__icon payments-card__icon--gradient">
              <Wallet size={26} />
            </div>
            <h2 className="payments-card__title">Consola económica disponible en planes PRO y BUSINESS</h2>
            <p className="payments-card__subtitle">
              Visualiza lo que debes pagar a cada profesional, su acumulado por mes y exporta reportes listos para contabilidad.
            </p>
            <Link to="/dashboard/settings" className="payments-button payments-button--primary">
              Ver planes disponibles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (calendars.length === 0) {
    return (
      <div className="payments-page">
        <div className="payments-container payments-container--center">
          <div className="payments-card payments-card--compact">
            <div className="payments-card__icon payments-card__icon--warning">
              <AlertCircle size={26} />
            </div>
            <h2 className="payments-card__title">No encontramos profesionales asignados</h2>
            <p className="payments-card__subtitle">
              Crea calendarios profesionales desde el panel de horarios para empezar a calcular el acumulado de pagos.
            </p>
            <Link to="/dashboard/horas" className="payments-button payments-button--primary payments-button--with-icon">
              Ir a horarios
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payments-page">
      <div className="payments-container">
        <header className="payments-header">
          <div className="payments-header__info">
            <div className="payments-header__icon">
              <Wallet size={24} />
            </div>
            <div>
              <h1 className="payments-header__title">Economía y pagos</h1>
              <p className="payments-header__subtitle">Consolidado por profesional · {selectedYear}</p>
            </div>
          </div>
          <div className="payments-header__actions">
            <button onClick={handleRefresh} className="payments-button payments-button--ghost payments-button--with-icon" disabled={loading}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
            <button
              onClick={exportToCSV}
              disabled={!stats.length}
              className="payments-button payments-button--ghost payments-button--with-icon"
            >
              <Download size={16} />
              Exportar CSV
            </button>
            <button
              onClick={exportPendingToCSV}
              disabled={!hasPendingProfessionals}
              className="payments-button payments-button--ghost payments-button--with-icon"
            >
              <Download size={16} />
              Exportar pendientes
            </button>
            {lastUpdated && (
              <span className="payments-header__timestamp">
                Última actualización: {lastUpdated.toLocaleString()}
              </span>
            )}
          </div>
        </header>

        {loading ? (
          <div className="payments-card payments-card--loader">
            <LoadingSpinner />
            <p>Calculando acumulado de pagos...</p>
          </div>
        ) : (
          <>
            <section className="payments-card">
              <h3 className="payments-card__section-title">Resumen general</h3>
              {!stats.length ? (
                <div className="payments-empty">No hay horas registradas para {selectedYear}. Actualiza o cambia el filtro.</div>
              ) : (
                <div className="payments-summary-grid">
                  {totalsByCurrency.map(summary => (
                    <article key={summary.currency} className="payments-summary-card">
                      <div className="payments-summary-card__icon payments-summary-card__icon--accent">
                        <TrendingUp size={18} />
                      </div>
                      <div className="payments-summary-card__content">
                        <span className="payments-summary-card__label">
                          Total a pagar ({summary.currency})
                        </span>
                        <strong className="payments-summary-card__value">
                          {formatCurrency(summary.amount, summary.currency)}
                        </strong>
                        <span className="payments-summary-card__meta">
                          {summary.professionals} profesionales · {summary.hours.toFixed(2)} h
                        </span>
                      </div>
                    </article>
                  ))}
                  <article className="payments-summary-card">
                    <div className="payments-summary-card__icon">
                      <Users size={18} />
                    </div>
                    <div className="payments-summary-card__content">
                      <span className="payments-summary-card__label">Profesionales activos</span>
                      <strong className="payments-summary-card__value">{stats.length}</strong>
                      <span className="payments-summary-card__meta">
                        Con horas registradas en {selectedYear}
                      </span>
                    </div>
                  </article>
                  <article className="payments-summary-card">
                    <div className="payments-summary-card__icon">
                      <Clock size={18} />
                    </div>
                    <div className="payments-summary-card__content">
                      <span className="payments-summary-card__label">Horas acumuladas</span>
                      <strong className="payments-summary-card__value">
                        {overallTotals.totalHours.toFixed(2)} h
                      </strong>
                      <span className="payments-summary-card__meta">
                        {overallTotals.totalEvents} servicios
                      </span>
                    </div>
                  </article>
                  <article className="payments-summary-card payments-summary-card--accent">
                    <div className="payments-summary-card__icon payments-summary-card__icon--accent">
                      <TrendingUp size={18} />
                    </div>
                    <div className="payments-summary-card__content">
                      <span className="payments-summary-card__label">Variación vs período anterior</span>
                      <strong className="payments-summary-card__value">
                        {formatCurrency(
                          currentTotalAmount - previousTotals.totalAmount,
                          primaryCurrency
                        )}
                      </strong>
                      <span className="payments-summary-card__meta">
                        Horas: {(overallTotals.totalHours - previousTotals.totalHours).toFixed(2)} · Servicios: {overallTotals.totalEvents - previousTotals.totalEvents}
                      </span>
                    </div>
                  </article>
                </div>
              )}
            </section>

            <section className="payments-card">
              <div className="payments-card__section-header">
                <div>
                  <h3 className="payments-card__section-title">Detalle por profesional</h3>
                  <p className="payments-card__subtitle">
                    Revisa el acumulado antes de realizar transferencias para validar horas y comisiones.
                  </p>
                </div>
              </div>
              {!stats.length ? (
                <div className="payments-empty">Aún no hay movimientos registrados en {selectedYear}.</div>
              ) : (
                <div className="payments-list">
                  {displayStats.map(({ base: stat, filteredMonths, filteredAmount, filteredHours, filteredEvents }) => {
                    const relatedCalendar = calendarMap.get(stat.professionalId);
                    const owner =
                      relatedCalendar?.members?.find(member => member.role === 'owner') ??
                      relatedCalendar?.members?.[0];

                    const payoutDetails = (() => {
                      const calAny = relatedCalendar as any;
                      return calAny?.payoutDetails ||
                        calAny?.billing ||
                        calAny?.settings?.payout ||
                        {};
                    })() as {
                      iban?: string;
                      bank?: string;
                      notes?: string;
                      paypalEmail?: string;
                    };

                    const monthlySeries = Array.from({ length: 12 }, (_, index) => {
                      const monthNumber = (index + 1).toString().padStart(2, '0');
                      const key = `${selectedYear}-${monthNumber}`;
                      const entry = stat.monthlyBreakdown.find(item => item.month === key);
                      const amount = entry?.amount ?? 0;
                      const hours = entry?.hours ?? 0;
                      return {
                        label: MONTH_LABELS[index],
                        monthKey: key,
                        amount,
                        hours,
                        events: entry?.events ?? 0,
                        valueForChart: amount > 0 ? amount : hours
                      };
                    });

                    const maxValue = monthlySeries.reduce(
                      (max, month) => Math.max(max, month.valueForChart),
                      0
                    );
                    const lastMonth = monthlySeries[monthlySeries.length - 1];
                    const lastRecordedMonth = [...monthlySeries]
                      .reverse()
                      .find(month => month.events > 0 || month.hours > 0 || month.amount > 0);
                    const lastFilteredMonth = filteredMonths.length
                      ? filteredMonths[filteredMonths.length - 1]
                      : undefined;
                    const lastFilteredDisplay = lastFilteredMonth
                      ? {
                          label: MONTH_LABELS[Number(lastFilteredMonth.month.split('-')[1]) - 1],
                          events: lastFilteredMonth.events,
                          amount: lastFilteredMonth.amount
                        }
                      : lastRecordedMonth ?? lastMonth;
                    const totalEvents = filteredEvents;
                    const draft =
                      payoutDrafts[stat.professionalId] ?? {
                        iban: payoutDetails.iban || '',
                        bank: payoutDetails.bank || '',
                        notes: payoutDetails.notes || '',
                        paypalEmail: payoutDetails.paypalEmail || ''
                      };
                    const isSaving = savingPayout[stat.professionalId];
                    const editing = editingPayout[stat.professionalId] ?? false;
                    const formValues = editing
                      ? draft
                      : {
                          iban: payoutDetails.iban || draft.iban || '',
                          bank: payoutDetails.bank || draft.bank || '',
                          notes: payoutDetails.notes || draft.notes || '',
                          paypalEmail: payoutDetails.paypalEmail || draft.paypalEmail || ''
                        };
                    const currentRecord = (relatedCalendar as any)?.payoutRecords?.[periodKey];
                    const recordDraft = payoutRecordDrafts[stat.professionalId];
                    const displayRecord = editing
                      ? (recordDraft ?? {
                          status: (currentRecord?.status ?? 'pending') as 'pending' | 'paid',
                          lastPaymentDate: currentRecord?.lastPaymentDate || '',
                          lastPaymentBy: currentRecord?.lastPaymentBy || '',
                          note: currentRecord?.note || ''
                        })
                      : currentRecord ?? null;
                    const recordStatus = displayRecord?.status ?? 'pending';
                    const activeMonthKeys = filteredMonths.length
                      ? new Set(filteredMonths.map(month => month.month))
                      : new Set(monthlySeries.map(month => month.monthKey));

                    return (
                      <article key={stat.professionalId} className="payments-professional-card">
                        <div className="payments-professional-card__header">
                          <div className="payments-professional-card__identity">
                            <div className="payments-professional-card__avatar">
                              {owner?.avatar ? (
                                <img src={owner.avatar} alt={owner.name} />
                              ) : (
                                <span>{(stat.professionalName || 'P').charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <h4>{stat.professionalName}</h4>
                              <span>{owner?.email || relatedCalendar?.linkedEmail || 'Sin email vinculado'}</span>
                            </div>
                          </div>
                          <div className="payments-status">
                            {editing ? (
                              <select
                                className="payments-status__select"
                                value={(recordDraft?.status ?? displayRecord?.status ?? 'pending')}
                                onChange={(event) => handlePayoutRecordChange(stat.professionalId, 'status', event.target.value)}
                              >
                                <option value="pending">Pendiente</option>
                                <option value="paid">Pagado</option>
                              </select>
                            ) : (
                              <span className={`payments-status__pill payments-status__pill--${recordStatus}`}>
                                {recordStatus === 'paid' ? 'Pagado' : 'Pendiente'}
                              </span>
                            )}
                            {!editing && displayRecord?.lastPaymentDate && (
                              <span className="payments-status__meta">
                                Último pago: {formatDisplayDate(displayRecord.lastPaymentDate)}
                                {displayRecord?.lastPaymentBy ? ` · Responsable: ${displayRecord.lastPaymentBy}` : ''}
                              </span>
                            )}
                          </div>
                          <div className="payments-professional-card__metrics">
                            <div className="payments-metric">
                              <span>Total a pagar</span>
                              <strong>{formatCurrency(filteredAmount || 0, stat.currency || 'EUR')}</strong>
                              <small>Total servicios registrados: {totalEvents}</small>
                            </div>
                            <div className="payments-metric payments-metric--hover">
                              <span>Horas trabajadas</span>
                              <strong>{WorkHoursAnalyticsService.formatHours(filteredHours || 0)}</strong>
                              <small>Incluye servicios completados y en curso según filtros</small>
                            </div>
                            <div className="payments-metric">
                              <span>Tarifa base</span>
                              <strong>
                                {stat.hourlyRate > 0
                                  ? `${formatCurrency(stat.hourlyRate, stat.currency || 'EUR')}/h`
                                  : 'Tarifa no definida'}
                              </strong>
                              <small>
                                {stat.hourlyRate > 0
                                  ? `Moneda: ${(stat.currency || 'EUR').toUpperCase()}`
                                  : 'Edita el calendario para asignar una tarifa'}
                              </small>
                            </div>
                            {pendingLoading ? (
                              <div className="payments-metric">
                                <span>Servicios pendientes</span>
                                <strong>Calculando...</strong>
                                <small>Revisa en unos segundos</small>
                              </div>
                            ) : (
                              <div className={`payments-metric ${pendingServices[stat.professionalId]?.count ? 'payments-metric--alert' : ''}`}>
                                <span>Servicios pendientes</span>
                                <strong>{pendingServices[stat.professionalId]?.count ?? 0}</strong>
                                <small>
                                  {pendingServices[stat.professionalId]?.count
                                    ? `Ejemplos: ${pendingServices[stat.professionalId]?.examples.join(', ')}`
                                    : 'Todo completado en este período'}
                                </small>
                              </div>
                            )}
                            <div className="payments-metric">
                              <span>Último mes</span>
                              <strong>{formatCurrency(lastFilteredDisplay?.amount || 0, stat.currency || 'EUR')}</strong>
                              <small>
                                {(lastFilteredDisplay?.label ?? 'Sin datos')} ·{' '}
                                {lastFilteredDisplay?.events ?? 0} servicios
                              </small>
                            </div>
                          </div>
                        </div>

                        <div className="payments-professional-card__chart">
                          <div className="payments-chart">
                            {monthlySeries.map(month => {
                              const height = maxValue > 0 ? Math.max(6, (month.valueForChart / maxValue) * 100) : 8;
                              const amountLabel = formatCurrency(month.amount, stat.currency || 'EUR');
                              return (
                                <div
                                  key={`${stat.professionalId}-${month.label}`}
                                  className={`payments-chart__column ${activeMonthKeys.has(month.monthKey) ? 'payments-chart__column--active' : ''}`}
                                >
                                  <div
                                    className="payments-chart__bar"
                                    style={{ height: `${height}%` }}
                                    data-amount={amountLabel}
                                    data-hours={month.hours.toFixed(2)}
                                  />
                                  <span className="payments-chart__label">{month.label}</span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="payments-professional-card__legend">
                            <div>
                              <span className="legend-dot legend-dot--amount" />
                              <span>Importe mensual</span>
                            </div>
                            <div>
                              <span className="legend-dot legend-dot--hours" />
                              <span>Horas registradas</span>
                            </div>
                          </div>
                          <div className="payments-history">
                            <h5>Histórico del período</h5>
                            {filteredMonths.length === 0 ? (
                              <p className="payments-history__empty">Sin movimientos registrados dentro del rango seleccionado.</p>
                            ) : (
                              <ul>
                                {filteredMonths.map(month => {
                                  const [yearStr, monthStr] = month.month.split('-');
                                  const monthIndex = Number(monthStr) - 1;
                                  return (
                                    <li key={`${stat.professionalId}-history-${month.month}`}>
                                      <span>{MONTH_LABELS[monthIndex]} {yearStr}</span>
                                      <span>{formatCurrency(month.amount || 0, stat.currency || 'EUR')}</span>
                                      <span>{WorkHoursAnalyticsService.formatHours(month.hours || 0)}</span>
                                      <span>{month.events} servicios</span>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        </div>

                        <div className="payments-professional-card__payout">
                          <div className="payments-payout-field">
                            <label htmlFor={`iban-${stat.professionalId}`}>IBAN</label>
                            <div className={`payments-payout-field__control ${editing ? '' : 'payments-payout-field__control--readonly'}`}>
                              <input
                                id={`iban-${stat.professionalId}`}
                                value={formValues.iban || ''}
                                onChange={(event) => handlePayoutFieldChange(stat.professionalId, 'iban', event.target.value)}
                                placeholder="ES00 0000 0000 0000 0000 0000"
                                readOnly={!editing}
                              />
                              <button
                                type="button"
                                className="payments-copy-button"
                                onClick={() => handleCopyValue(formValues.iban, 'IBAN')}
                                aria-label="Copiar IBAN"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="payments-payout-field">
                            <label htmlFor={`bank-${stat.professionalId}`}>Banco / Método</label>
                            <div className={`payments-payout-field__control ${editing ? '' : 'payments-payout-field__control--readonly'}`}>
                              <input
                                id={`bank-${stat.professionalId}`}
                                value={formValues.bank || ''}
                                onChange={(event) => handlePayoutFieldChange(stat.professionalId, 'bank', event.target.value)}
                                placeholder="Banco o plataforma de pago"
                                readOnly={!editing}
                              />
                              <button
                                type="button"
                                className="payments-copy-button"
                                onClick={() => handleCopyValue(formValues.bank, 'Banco')}
                                aria-label="Copiar Banco"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="payments-payout-field">
                            <label htmlFor={`paypal-${stat.professionalId}`}>PayPal / Email</label>
                            <div className={`payments-payout-field__control ${editing ? '' : 'payments-payout-field__control--readonly'}`}>
                              <input
                                id={`paypal-${stat.professionalId}`}
                                value={formValues.paypalEmail || ''}
                                onChange={(event) => handlePayoutFieldChange(stat.professionalId, 'paypalEmail', event.target.value)}
                                placeholder="correo@paypal.com"
                                readOnly={!editing}
                              />
                              <button
                                type="button"
                                className="payments-copy-button"
                                onClick={() => handleCopyValue(formValues.paypalEmail, 'Email de pago')}
                                aria-label="Copiar email de pago"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="payments-payout-field">
                            <label htmlFor={`last-payment-date-${stat.professionalId}`}>Fecha último pago</label>
                            {editing ? (
                              <input
                                id={`last-payment-date-${stat.professionalId}`}
                                type="date"
                                value={(recordDraft?.lastPaymentDate ?? displayRecord?.lastPaymentDate ?? '')}
                                onChange={(event) => handlePayoutRecordChange(stat.professionalId, 'lastPaymentDate', event.target.value)}
                              />
                            ) : (
                              <p className="payments-readonly-value">
                                {displayRecord?.lastPaymentDate ? formatDisplayDate(displayRecord.lastPaymentDate) : 'Sin registrar'}
                              </p>
                            )}
                          </div>
                          <div className="payments-payout-field">
                            <label htmlFor={`last-payment-by-${stat.professionalId}`}>Responsable</label>
                            {editing ? (
                              <input
                                id={`last-payment-by-${stat.professionalId}`}
                                value={(recordDraft?.lastPaymentBy ?? displayRecord?.lastPaymentBy ?? '')}
                                onChange={(event) => handlePayoutRecordChange(stat.professionalId, 'lastPaymentBy', event.target.value)}
                                placeholder="Nombre de quien confirmó el pago"
                              />
                            ) : (
                              <p className="payments-readonly-value">
                                {displayRecord?.lastPaymentBy || 'Sin asignar'}
                              </p>
                            )}
                          </div>
                          <div className="payments-payout-field payments-payout-field--textarea">
                            <label htmlFor={`notes-${stat.professionalId}`}>Notas internas</label>
                            <textarea
                              id={`notes-${stat.professionalId}`}
                              value={formValues.notes || ''}
                              onChange={(event) => handlePayoutFieldChange(stat.professionalId, 'notes', event.target.value)}
                              placeholder="Instrucciones de transferencia, referencias, etc."
                              rows={2}
                              readOnly={!editing}
                            />
                          </div>
                          <div className="payments-payout-field payments-payout-field--textarea">
                            <label htmlFor={`period-note-${stat.professionalId}`}>Notas del período</label>
                            {editing ? (
                              <textarea
                                id={`period-note-${stat.professionalId}`}
                                value={(recordDraft?.note ?? displayRecord?.note ?? '')}
                                onChange={(event) => handlePayoutRecordChange(stat.professionalId, 'note', event.target.value)}
                                placeholder="Observaciones para este pago"
                                rows={2}
                              />
                            ) : (
                              <p className="payments-readonly-value">
                                {displayRecord?.note || 'Sin notas adicionales'}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="payments-professional-card__actions">
                          <small>
                            Estos datos se guardan en el calendario del profesional. Úsalos al procesar transferencias.
                          </small>
                          <div className="payments-professional-card__action-buttons">
                            {editing ? (
                              <>
                                <button
                                  type="button"
                                  className="payments-button payments-button--ghost payments-button--with-icon payments-button--compact"
                                  onClick={() => handleCancelPayoutEdit(stat.professionalId)}
                                  disabled={isSaving}
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  className="payments-button payments-button--primary payments-button--with-icon payments-button--compact"
                                  onClick={() => handleSavePayout(stat.professionalId)}
                                  disabled={isSaving}
                                >
                                  <Save size={16} />
                                  {isSaving ? 'Guardando...' : 'Guardar'}
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="payments-button payments-button--ghost payments-button--with-icon payments-button--compact"
                                onClick={() => handleTogglePayoutEdit(stat.professionalId)}
                              >
                                <Pencil size={16} />
                                Editar datos
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardStripe;
