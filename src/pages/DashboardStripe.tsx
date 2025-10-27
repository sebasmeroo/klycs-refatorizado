import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { logger } from '@/utils/logger';
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
  Pencil,
  DollarSign,
  FileText,
  PlusCircle,
  Trash2,
  Building2,
  ExternalLink,
  Calendar,
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  Search,
  X,
  BarChart3
} from 'lucide-react';
import '@/styles/financial-dashboard.css';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useUserCalendars } from '@/hooks/useCalendar';
import { WorkHoursAnalyticsService } from '@/services/workHoursAnalytics';
import { toast } from '@/utils/toast';
import { usePaymentStats, usePaymentPendingServices, useUpdatePayoutComplete } from '@/hooks/usePaymentStats';
import { useQueryClient } from '@tanstack/react-query';
import { PaymentFrequency, PaymentMethod } from '@/types/calendar';
import { usePlatformWithdrawals, useCreatePlatformWithdrawal, useDeletePlatformWithdrawal } from '@/hooks/usePlatformWithdrawals';
import {
  useExternalInvoices,
  useCreateExternalInvoice,
  useUpdateExternalInvoiceStatus,
  useDeleteExternalInvoice
} from '@/hooks/useExternalInvoices';
import { InvoiceStatus } from '@/types/income';
import { useExternalClients } from '@/hooks/useExternalClients';
import { convertPeriodKey, useMigrationCheck } from '@/utils/migratePayoutRecords';
import { useWorkHoursByPeriod, useWorkHoursByPeriodTotals } from '@/hooks/useWorkHoursByPeriod';
import { useWorkHoursStats } from '@/hooks/useWorkHoursStats';
import { getCurrentPaymentPeriod, PaymentPeriod } from '@/utils/paymentPeriods';

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
const WEEKDAY_SHORT_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const PAYMENT_TYPE_OPTIONS: { value: PaymentFrequency; label: string }[] = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'monthly', label: 'Mensual' }
];

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'bizum', label: 'Bizum' },
  { value: 'other', label: 'Otro' }
];

const INVOICE_STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: 'draft', label: 'Borrador' },
  { value: 'sent', label: 'Enviada' },
  { value: 'paid', label: 'Pagada' },
  { value: 'overdue', label: 'Vencida' }
];

const PAYMENT_TYPE_BADGE_CLASS: Record<PaymentFrequency, string> = {
  daily: 'financial-badge--daily',
  weekly: 'financial-badge--weekly',
  biweekly: 'financial-badge--biweekly',
  monthly: 'financial-badge--monthly'
};

const WEEKDAY_OPTIONS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' }
];

type PayoutDraft = {
  iban?: string;
  bank?: string;
  notes?: string;
  paypalEmail?: string;
  paymentType?: PaymentFrequency;
  paymentDay?: number | null;
  paymentMethod?: PaymentMethod;
};

type PayoutRecordDraft = {
  status: 'pending' | 'paid';
  actualPaymentDate?: string | null;      // Cuándo se pagó realmente
  scheduledPaymentDate?: string | null;   // Cuándo debería haberse pagado
  lastPaymentDate?: string | null;        // Mantener para compatibilidad
  lastPaymentBy?: string | null;
  note?: string | null;
  paymentMethod?: PaymentMethod | null;
  amountPaid?: number | null;
  earlyPaymentDays?: number | null;       // Cuántos días antes se pagó
  cycleStart?: string | null;
  cycleEnd?: string | null;
  nextCycleStart?: string | null;
  nextCycleEnd?: string | null;
  preserveScheduledDate?: boolean | null;
  intervalDays?: number | null;
};

type PaymentActionModalState = {
  open: boolean;
  calendarId: string | null;
  amount?: number;
  method?: PaymentMethod;
  summary?: string;
};

const getPaymentTypeLabel = (type?: PaymentFrequency) => {
  return PAYMENT_TYPE_OPTIONS.find(option => option.value === type)?.label ?? 'Mensual';
};

const getPaymentMethodLabel = (method?: PaymentMethod) => {
  return PAYMENT_METHOD_OPTIONS.find(option => option.value === method)?.label ?? 'Transferencia';
};

const getPaymentDayDescription = (paymentType: PaymentFrequency, paymentDay: number | null | undefined) => {
  if (paymentType === 'daily') return 'Cada día del calendario laboral';
  if (paymentType === 'weekly') {
    const weekday = WEEKDAY_OPTIONS.find(option => option.value === (paymentDay ?? 5));
    return weekday ? `Cada ${weekday.label.toLowerCase()}` : 'Semanal';
  }
  if (paymentType === 'biweekly') {
    const base = normalizePaymentDay(paymentDay, 1);
    return `Cada 2 semanas (días ${base} y ${base + 14})`;
  }
  const base = normalizePaymentDay(paymentDay, 1);
  return `Cada mes (día ${base})`;
};

const daysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const clampDayOfMonth = (day: number, referenceDate: Date) => {
  const max = daysInMonth(referenceDate.getFullYear(), referenceDate.getMonth());
  return Math.min(Math.max(day, 1), max);
};

const normalizePaymentDay = (paymentDay: number | null | undefined, fallback = 1) => {
  if (paymentDay === null || paymentDay === undefined || Number.isNaN(paymentDay)) {
    return fallback;
  }
  return paymentDay;
};

const getLatestPaymentRecord = (payoutRecords?: Record<string, any>) => {
  if (!payoutRecords) return null;
  let latest: any = null;
  Object.entries(payoutRecords).forEach(([periodKey, record]) => {
    // ✅ Usar actualPaymentDate o lastPaymentDate como referencia
    const dateToCheck = record?.actualPaymentDate || record?.lastPaymentDate;
    if (!dateToCheck) return;
    const currentDate = new Date(dateToCheck);
    if (Number.isNaN(currentDate.getTime())) return;
    if (!latest) {
      latest = { periodKey, ...record };
      return;
    }
    const latestDateToCheck = latest.actualPaymentDate || latest.lastPaymentDate;
    const latestDate = new Date(latestDateToCheck);
    if (currentDate.getTime() > latestDate.getTime()) {
      latest = { periodKey, ...record };
    }
  });
  return latest;
};

const getLatestPaidRecord = (payoutRecords?: Record<string, any>) => {
  if (!payoutRecords) return null;
  let latest: any = null;
  Object.entries(payoutRecords).forEach(([periodKey, record]) => {
    if (record?.status !== 'paid') return;
    const dateToCheck = record?.actualPaymentDate || record?.lastPaymentDate || record?.cycleEnd;
    if (!dateToCheck) return;
    const currentDate = new Date(dateToCheck);
    if (Number.isNaN(currentDate.getTime())) return;
    if (!latest) {
      latest = { periodKey, ...record };
      return;
    }
    const latestDateToCheck = latest.actualPaymentDate || latest.lastPaymentDate || latest.cycleEnd;
    const latestDate = new Date(latestDateToCheck);
    if (currentDate.getTime() > latestDate.getTime()) {
      latest = { periodKey, ...record };
    }
  });
  return latest;
};

const formatRelativeDate = (date: Date, reference: Date = new Date()) => {
  const normalizedTarget = new Date(date);
  normalizedTarget.setHours(0, 0, 0, 0);
  const normalizedReference = new Date(reference);
  normalizedReference.setHours(0, 0, 0, 0);
  const diffMs = normalizedTarget.getTime() - normalizedReference.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Mañana';
  if (diffDays === -1) return 'Ayer';
  if (diffDays > 1 && diffDays <= 7) return `En ${diffDays} días`;
  if (diffDays < -1 && diffDays >= -7) return `Hace ${Math.abs(diffDays)} días`;
  return normalizedTarget.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

const formatDisplayDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatPeriodRange = (period?: { start: Date; end: Date }) => {
  if (!period) return '';
  const formatter = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' });
  return `${formatter.format(period.start)} - ${formatter.format(period.end)}`;
};

/**
 * Genera una lista de próximos períodos de pago
 * Basada en scheduledPaymentDate para mantener ciclos consistentes
 */
const getUpcomingPaymentPeriods = (
  paymentType: PaymentFrequency,
  paymentDay: number | null | undefined,
  currentCycleEnd?: string,
  count: number = 3
): Array<{ start: Date; date: Date; label: string }> => {
  const periods: Array<{ start: Date; date: Date; label: string }> = [];
  const intervalDays = getIntervalDays(paymentType);

  let nextCycleStart: Date;
  if (currentCycleEnd) {
    nextCycleStart = addDays(new Date(currentCycleEnd), 1);
  } else {
    const initial = getInitialCyclePeriod(new Date(), paymentType, paymentDay);
    nextCycleStart = addDays(initial.end, 1);
  }

  for (let i = 0; i < count; i++) {
    if (i > 0) {
      nextCycleStart = addDays(periods[i - 1].date, 1);
    }
    const cycleEnd = addDays(nextCycleStart, intervalDays - 1);
    periods.push({
      start: new Date(nextCycleStart),
      date: cycleEnd,
      label: cycleEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    });
  }

  return periods;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const normalizeDate = (value: Date | null | undefined): Date | null => {
  if (!value) return null;
  const normalized = new Date(value);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getIntervalDays = (paymentType: PaymentFrequency): number => {
  switch (paymentType) {
    case 'daily':
      return 1;
    case 'weekly':
      return 7;
    case 'biweekly':
      return 14;
    case 'monthly':
    default:
      return 30;
  }
};

const getNextPeriodStartDate = (
  currentPeriod: PaymentPeriod | null,
  paymentType: PaymentFrequency,
  paymentDay: number | null | undefined
): Date | null => {
  if (!currentPeriod) {
    return null;
  }

  const reference = new Date(currentPeriod.end);
  reference.setDate(reference.getDate() + 1);
  reference.setHours(0, 0, 0, 0);

  const nextPeriod = getCurrentPaymentPeriod(reference, paymentType, paymentDay);
  return normalizeDate(nextPeriod.start);
};

const getExpectedPaymentDate = (period: PaymentPeriod | null): Date | null => {
  if (!period) return null;
  return normalizeDate(period.end);
};

const getInitialCyclePeriod = (
  referenceDate: Date,
  paymentType: PaymentFrequency,
  paymentDay: number | null | undefined,
  lastPaymentDate?: string,
  scheduledPaymentDate?: string
): { start: Date; end: Date } => {
  const fallback = getCurrentPaymentPeriod(
    referenceDate,
    paymentType,
    paymentDay,
    lastPaymentDate,
    scheduledPaymentDate
  );
  return {
    start: normalizeDate(fallback.start)!,
    end: normalizeDate(fallback.end)!
  };
};

const createPeriodLabel = (start: Date, end: Date) => {
  return `${start.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`;
};

const buildPeriodFromRecord = (
  recordKey: string,
  record: any,
  paymentType: PaymentFrequency,
  paymentDay: number | null | undefined,
  intervalDays: number
): PaymentPeriod => {
  const defaultStart = normalizeDate(new Date(recordKey)) ?? new Date(recordKey);
  const cycleStart = record?.cycleStart
    ? normalizeDate(new Date(record.cycleStart)) ?? defaultStart
    : defaultStart;

  let cycleEnd: Date;
  if (record?.cycleEnd) {
    cycleEnd = normalizeDate(new Date(record.cycleEnd)) ?? addDays(cycleStart, intervalDays - 1);
  } else if (record?.scheduledPaymentDate) {
    cycleEnd = normalizeDate(new Date(record.scheduledPaymentDate)) ?? addDays(cycleStart, intervalDays - 1);
  } else {
    cycleEnd = addDays(cycleStart, intervalDays - 1);
  }

  return {
    start: cycleStart,
    end: cycleEnd,
    label: createPeriodLabel(cycleStart, cycleEnd),
    periodKey: record?.cycleStart
      ? normalizeDate(new Date(record.cycleStart))?.toISOString().split('T')[0] ?? recordKey
      : recordKey
  };
};

const formatDateLabel = (date: Date | null): string => {
  if (!date) return 'Sin fecha';
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
};

const toInputDateValue = (date: Date | null): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calculateStatusVariant = (status: 'pending' | 'paid', dueDate: Date | null): 'pending' | 'paid' | 'overdue' | 'upcoming' => {
  if (status === 'paid') {
    return 'paid';
  }
  if (!dueDate) {
    return 'pending';
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dueDate.getTime() < today.getTime()) {
    return 'overdue';
  }
  if (dueDate.getTime() === today.getTime()) {
    return 'pending';
  }
  return 'upcoming';
};

const describeDueState = (dueDate: Date | null): string => {
  if (!dueDate) return 'Sin fecha programada';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((dueDate.getTime() - today.getTime()) / DAY_IN_MS);
  if (diffDays === 0) return 'Vence hoy';
  if (diffDays === 1) return 'En 1 día';
  if (diffDays > 1) return `En ${diffDays} días`;
  if (diffDays === -1) return 'Atrasado 1 día';
  return `Atrasado ${Math.abs(diffDays)} días`;
};

/**
 * ✅ FUNCIÓN CLAVE: Calcular periodKey INDIVIDUAL para cada calendario
 * Esto reemplaza el periodKey global y permite pagos independientes por paymentType
 */
const calculatePeriodKeyForCalendar = (
  calendar: any, // SharedCalendar type
  today: Date = new Date()
): string => {
  const paymentType = calendar?.payoutDetails?.paymentType ?? 'monthly';
  return convertPeriodKey(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`, paymentType);
};

const DashboardStripe: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { planName, isLoading: planLoading } = useSubscriptionStatus();
  const { data: calendarsData, isLoading: loadingCalendars } = useUserCalendars(user?.uid);
  const calendars = calendarsData || [];

  const normalizedPlan = (planName || 'FREE').toUpperCase();
  const paymentsEnabled = normalizedPlan === 'PRO' || normalizedPlan === 'BUSINESS';

  // ✅ Ejecutar migración UNA SOLA VEZ por usuario
  const { needsMigration, executeMigration } = useMigrationCheck(user?.uid);
  useEffect(() => {
    if (needsMigration && user?.uid) {
      executeMigration().catch(err => logger.error('Error ejecutando migración', err as Error));
    }
  }, [needsMigration, user?.uid, executeMigration]);

  const [incomeTab, setIncomeTab] = useState<'platform' | 'external'>('platform');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [onlyCompleted, setOnlyCompleted] = useState(true);
  const [period, setPeriod] = useState<'year' | 'quarter' | 'month' | 'payment'>('year');
  const [selectedQuarter, setSelectedQuarter] = useState(() => Math.floor((new Date().getMonth()) / 3) + 1);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [payoutDrafts, setPayoutDrafts] = useState<Record<string, PayoutDraft>>({});
  const [savingPayout, setSavingPayout] = useState<Record<string, boolean>>({});
  const [markingPayout, setMarkingPayout] = useState<Record<string, boolean>>({});
  const [editingPayout, setEditingPayout] = useState<Record<string, boolean>>({});
  const [payoutRecordDrafts, setPayoutRecordDrafts] = useState<Record<string, PayoutRecordDraft>>({});
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);
  const [withdrawalForm, setWithdrawalForm] = useState({
    date: new Date().toISOString().split('T')[0],
    grossAmount: '',
    commission: '',
    note: ''
  });
  const [invoiceForm, setInvoiceForm] = useState({
    clientName: '',
    amount: '',
    currency: 'EUR',
    status: 'draft' as InvoiceStatus,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    reference: '',
    notes: ''
  });
  const [paymentActionState, setPaymentActionState] = useState<PaymentActionModalState>({
    open: false,
    calendarId: null
  });
  const [customPaymentDate, setCustomPaymentDate] = useState<string>('');
  const [preserveScheduledDate, setPreserveScheduledDate] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // ✅ REACT QUERY: Reemplaza loadStats manual con hook optimizado
  const { data: stats = [], isLoading: statsLoading, dataUpdatedAt } = usePaymentStats(
    user?.uid,
    selectedYear,
    onlyCompleted
  );

  // ✅ PARA EL GRÁFICO: Obtener datos anuales completos (12 meses)
  // useWorkHoursStats siempre devuelve el año completo, ideal para gráficos
  const { data: annualStats = [], isLoading: annualStatsLoading } = useWorkHoursStats(
    user?.uid,
    selectedYear,
    onlyCompleted
  );

  // ✅ NUEVO: Hook para estadísticas por periodo de pago
  const { data: statsByPeriod = [], isLoading: statsByPeriodLoading } = useWorkHoursByPeriod(
    user?.uid,
    onlyCompleted
  );
  const periodTotals = useWorkHoursByPeriodTotals(statsByPeriod);

  const loading = period === 'payment' ? statsByPeriodLoading : statsLoading;
  const hasLoadedOnce = (stats.length > 0 || !statsLoading) || (statsByPeriod.length > 0 || !statsByPeriodLoading);
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  const {
    data: withdrawals = [],
    isLoading: withdrawalsLoading
  } = usePlatformWithdrawals(user?.uid);
  const createWithdrawal = useCreatePlatformWithdrawal(user?.uid);
  const deleteWithdrawal = useDeletePlatformWithdrawal(user?.uid);

  const {
    data: invoices = [],
    isLoading: invoicesLoading
  } = useExternalInvoices(user?.uid);
  const createInvoice = useCreateExternalInvoice(user?.uid);
  const updateInvoiceStatus = useUpdateExternalInvoiceStatus(user?.uid);
  const deleteInvoice = useDeleteExternalInvoice(user?.uid);
  const updatePayoutMutation = useUpdatePayoutComplete();

  // ✅ NUEVO: External Clients CRM
  const {
    data: externalClients = [],
    isLoading: externalClientsLoading
  } = useExternalClients(user?.uid);

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
    } else if (period === 'payment') {
      if (statsByPeriod.length > 0) {
        const minStart = statsByPeriod.reduce((min, item) => {
          const time = item.period.start.getTime();
          return time < min ? time : min;
        }, statsByPeriod[0].period.start.getTime());

        const maxEnd = statsByPeriod.reduce((max, item) => {
          const time = item.period.end.getTime();
          return time > max ? time : max;
        }, statsByPeriod[0].period.end.getTime());

        start = new Date(minStart);
        end = new Date(maxEnd);
      } else {
        const today = new Date();
        start = new Date(today);
        end = new Date(today);
      }
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [selectedYear, period, selectedQuarter, selectedMonth, statsByPeriod]);

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
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['paymentStats'] });
      await queryClient.invalidateQueries({ queryKey: ['workHoursByPeriod'] });
      await queryClient.invalidateQueries({ queryKey: ['paymentPendingServices'] });
      await queryClient.invalidateQueries({ queryKey: ['calendars'] });
      await queryClient.invalidateQueries({ queryKey: ['platformWithdrawals'] });
      await queryClient.invalidateQueries({ queryKey: ['externalInvoices'] });
      await queryClient.invalidateQueries({ queryKey: ['externalClients'] });
      toast.success('Datos actualizados correctamente');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Error al actualizar los datos');
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  }, [queryClient]);

  const statsForDisplay = useMemo(() => {
    // ✅ Si el periodo es 'payment', usar datos filtrados por periodo de pago
    if (period === 'payment') {
      return statsByPeriod.map(item => ({
        base: item.stats,
        filteredMonths: item.stats.monthlyBreakdown,
        filteredAmount: item.stats.totalAmount,
        filteredHours: item.stats.totalHours,
        filteredEvents: item.stats.monthlyBreakdown.reduce((sum, m) => sum + m.events, 0),
        paymentPeriod: item.period // ✅ Información del periodo de pago
      }));
    }

    // ✅ Comportamiento original para otros periodos
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
  }, [stats, periodRange, period, statsByPeriod]);

  const statsByPeriodMap = useMemo(() => {
    const map = new Map<string, (typeof statsByPeriod)[number]>();
    statsByPeriod.forEach(item => map.set(item.professionalId, item));
    return map;
  }, [statsByPeriod]);

  const getCalendarPaymentContext = useCallback((calendarId: string) => {
    const calendar = calendarMap.get(calendarId);
    if (!calendar) return null;

    const details = (calendar as any)?.payoutDetails ?? {};
    const paymentType: PaymentFrequency = details?.paymentType ?? 'monthly';
    const paymentDay = typeof details?.paymentDay === 'number' ? details.paymentDay : null;
    const preferredMethod: PaymentMethod = details?.paymentMethod ?? 'transfer';
    const intervalDays = getIntervalDays(paymentType);

    const payoutRecords = calendar.payoutRecords ?? {};
    const latestRecord = getLatestPaymentRecord(payoutRecords);
    const latestPaidRecord = getLatestPaidRecord(payoutRecords);

    let cycleStart: Date | null = null;
    let projectedCycleEnd: Date | null = null;

    if (
      latestRecord?.status === 'pending' &&
      latestRecord?.cycleStart
    ) {
      cycleStart = normalizeDate(new Date(latestRecord.cycleStart));
      const scheduled = latestRecord?.scheduledPaymentDate
        ? normalizeDate(new Date(latestRecord.scheduledPaymentDate))
        : null;
      projectedCycleEnd = scheduled ?? (cycleStart ? addDays(cycleStart, intervalDays - 1) : null);
    } else {
      const basePaidRecord = latestRecord?.status === 'paid' ? latestRecord : latestPaidRecord;
      if (basePaidRecord) {
        const recordedNextCycleStart = basePaidRecord.nextCycleStart
          ? normalizeDate(new Date(basePaidRecord.nextCycleStart))
          : null;
        const recordedNextCycleEnd = basePaidRecord.nextCycleEnd
          ? normalizeDate(new Date(basePaidRecord.nextCycleEnd))
          : null;
        const recordedCycleEnd = basePaidRecord.cycleEnd
          ? normalizeDate(new Date(basePaidRecord.cycleEnd))
          : null;

        if (recordedNextCycleStart) {
          cycleStart = recordedNextCycleStart;
          projectedCycleEnd = recordedNextCycleEnd ?? addDays(recordedNextCycleStart, intervalDays - 1);
        } else if (recordedCycleEnd) {
          cycleStart = addDays(recordedCycleEnd, 1);
          projectedCycleEnd = addDays(cycleStart, intervalDays - 1);
        }
      }
    }

    if (!cycleStart || !projectedCycleEnd) {
      const referenceDate = latestRecord?.actualPaymentDate
        ? new Date(latestRecord.actualPaymentDate)
        : new Date();
      const initial = getInitialCyclePeriod(
        referenceDate,
        paymentType,
        paymentDay,
        latestRecord?.lastPaymentDate,
        latestRecord?.scheduledPaymentDate
      );
      cycleStart = normalizeDate(initial.start) ?? initial.start;
      projectedCycleEnd = normalizeDate(initial.end) ?? initial.end;
    }

    const periodKey = cycleStart.toISOString().split('T')[0];
    const currentRecord = payoutRecords?.[periodKey];
    if (currentRecord?.status === 'pending' && currentRecord?.scheduledPaymentDate) {
      projectedCycleEnd = normalizeDate(new Date(currentRecord.scheduledPaymentDate)) ?? projectedCycleEnd;
    } else if (currentRecord?.status === 'paid') {
      const recordEnd = currentRecord?.nextCycleEnd
        ? normalizeDate(new Date(currentRecord.nextCycleEnd))
        : currentRecord?.cycleEnd
          ? normalizeDate(new Date(currentRecord.cycleEnd))
          : null;
      projectedCycleEnd = recordEnd ?? projectedCycleEnd;
    }

    const currentPeriod: PaymentPeriod = {
      start: cycleStart,
      end: projectedCycleEnd,
      label: formatPeriodRange({ start: cycleStart, end: projectedCycleEnd }),
      periodKey
    };

    const periodStats = statsByPeriodMap.get(calendarId);

    // Buscar los datos específicos del período actual
    let amountForCurrentPeriod: number | undefined;
    let hoursForCurrentPeriod: number | undefined;

    if (periodStats) {
      const allStatsData = Array.isArray(periodStats) ? periodStats : [periodStats];
      const currentPeriodData = allStatsData.find(item => {
        return item?.period?.periodKey === currentPeriod?.periodKey;
      });

      if (currentPeriodData) {
        amountForCurrentPeriod = currentPeriodData.stats?.totalAmount;
        hoursForCurrentPeriod = currentPeriodData.stats?.totalHours;
      } else {
        amountForCurrentPeriod = periodStats.stats?.totalAmount;
        hoursForCurrentPeriod = periodStats.stats?.totalHours;
      }
    }

    let nextCycleStartRaw: Date;
    if (currentRecord?.nextCycleStart) {
      nextCycleStartRaw = normalizeDate(new Date(currentRecord.nextCycleStart)) ?? addDays(projectedCycleEnd, 1);
    } else if (currentRecord?.status === 'paid' && currentRecord?.cycleEnd) {
      nextCycleStartRaw = addDays(new Date(currentRecord.cycleEnd), 1);
    } else {
      nextCycleStartRaw = addDays(projectedCycleEnd, 1);
    }
    const nextCycleStart = normalizeDate(nextCycleStartRaw) ?? nextCycleStartRaw;
    const nextCycleEndRaw = currentRecord?.nextCycleEnd
      ? normalizeDate(new Date(currentRecord.nextCycleEnd)) ?? addDays(nextCycleStart, intervalDays - 1)
      : addDays(nextCycleStart, intervalDays - 1);
    const nextCycleEnd = normalizeDate(nextCycleEndRaw) ?? nextCycleEndRaw;

    const nextPeriod: PaymentPeriod = {
      start: nextCycleStart,
      end: nextCycleEnd,
      label: createPeriodLabel(nextCycleStart, nextCycleEnd),
      periodKey: nextCycleStart.toISOString().split('T')[0]
    };

    return {
      calendar,
      paymentType,
      paymentDay,
      preferredMethod,
      currentPeriod,
      latestRecord,
      latestPaidRecord,
      amountForPeriod: amountForCurrentPeriod,
      hoursForPeriod: hoursForCurrentPeriod,
      intervalDays,
      nextCycleStart,
      nextCycleEnd,
      nextPeriod
    };
  }, [calendarMap, statsByPeriodMap]);

  // ✅ NUEVO: Función para obtener el monto de horas del SIGUIENTE período de pago
  // Si la persona pagó el período, muestra las horas reales acumuladas en el SIGUIENTE período
  const getNextPaymentPeriodAmount = useCallback((calendarId: string): number | undefined => {
    const context = getCalendarPaymentContext(calendarId);
    if (!context) return undefined;

    const { nextPeriod } = context;

    if (!nextPeriod) return undefined;

    const periodStats = statsByPeriodMap.get(calendarId);
    if (!periodStats) return undefined;

    // Buscar horas acumuladas en ese período
    const allStatsData = Array.isArray(periodStats) ? periodStats : [periodStats];
    const nextPeriodData = allStatsData.find(item => {
      return item?.period?.periodKey === nextPeriod?.periodKey;
    });

    return nextPeriodData?.stats?.totalAmount ?? 0;
  }, [getCalendarPaymentContext, statsByPeriodMap]);

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
    const paymentContext = getCalendarPaymentContext(professionalId);
    const periodKeyForRecord = paymentContext?.currentPeriod.periodKey ?? periodKey;
    const calendarRecordStatus = paymentContext?.calendar?.payoutRecords?.[periodKeyForRecord]?.status;
    const recordStatus = recordDraft?.status
      ?? calendarRecordStatus
      ?? 'pending';
    return pendingCount > 0 || recordStatus !== 'paid';
  }, [pendingServices, payoutRecordDrafts, getCalendarPaymentContext, periodKey]);

  const displayStats = useMemo(() => {
    if (!showPendingOnly) return statsForDisplay;
    return statsForDisplay.filter(({ base: stat }) => isProfessionalPending(stat.professionalId));
  }, [statsForDisplay, showPendingOnly, isProfessionalPending]);

  const hasPendingProfessionals = useMemo(() => {
    return statsForDisplay.some(({ base }) => isProfessionalPending(base.professionalId));
  }, [statsForDisplay, isProfessionalPending]);

  const scheduledPayments = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return displayStats
      .map(({ base: stat, filteredAmount, paymentPeriod }) => {
        const context = getCalendarPaymentContext(stat.professionalId);
        if (!context) return null;

        const {
          calendar,
          paymentType,
          paymentDay,
          preferredMethod,
          currentPeriod,
          nextCycleEnd,
          amountForPeriod,
          intervalDays
        } = context;

        const nextDate = normalizeDate(nextCycleEnd) ?? addDays(currentPeriod.end, intervalDays - 1);
        if (!nextDate) return null;

        const periodKeyForRecord = currentPeriod.periodKey;
        const recordStatus = periodKeyForRecord
          ? calendar.payoutRecords?.[periodKeyForRecord]?.status ?? 'pending'
          : 'pending';
        const periodRangeLabel = currentPeriod
          ? formatPeriodRange(currentPeriod)
          : paymentPeriod?.label ?? null;
        const pendingAmount = recordStatus === 'paid'
          ? 0
          : typeof amountForPeriod === 'number'
            ? amountForPeriod
            : typeof filteredAmount === 'number'
              ? filteredAmount
              : 0;

        return {
          professionalId: stat.professionalId,
          professionalName: stat.professionalName,
          paymentType,
          paymentDay,
          paymentMethod: preferredMethod,
          nextDate,
          relativeLabel: formatRelativeDate(nextDate, now),
          paymentDayLabel: getPaymentDayDescription(paymentType, paymentDay),
          currency: (stat.currency || 'EUR') as string,
          periodRangeLabel,
          status: recordStatus as 'pending' | 'paid',
          isPending: recordStatus !== 'paid',
          pendingAmount,
          amount: pendingAmount
        };
      })
      .filter((item): item is {
        professionalId: string;
        professionalName: string;
        paymentType: PaymentFrequency;
        paymentDay: number | null | undefined;
        paymentMethod?: PaymentMethod;
        nextDate: Date;
        relativeLabel: string;
        paymentDayLabel: string;
        currency: string;
        periodRangeLabel: string | null;
        status: 'pending' | 'paid';
        isPending: boolean;
        pendingAmount: number;
        amount: number;
      } => Boolean(item))
      .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
  }, [displayStats, getCalendarPaymentContext]);

  const totalPendingAmount = useMemo(() => {
    return statsForDisplay.reduce((sum, { base: stat, filteredAmount }) => {
      const context = getCalendarPaymentContext(stat.professionalId);
      if (!context) return sum;

      const periodKeyForRecord = context.currentPeriod.periodKey;
      const recordStatus = context.calendar?.payoutRecords?.[periodKeyForRecord]?.status ?? 'pending';
      if (recordStatus === 'paid') {
        return sum;
      }

      const amount = typeof context.amountForPeriod === 'number'
        ? context.amountForPeriod
        : typeof filteredAmount === 'number'
          ? filteredAmount
          : 0;

      return sum + Math.max(amount, 0);
    }, 0);
  }, [statsForDisplay, getCalendarPaymentContext]);

  const upcomingWithinWeek = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDays = 7 * DAY_IN_MS;
    return scheduledPayments.filter(item => {
      if (!item.isPending) return false;
      const diff = item.nextDate.getTime() - today.getTime();
      return diff >= 0 && diff <= sevenDays;
    }).length;
  }, [scheduledPayments]);

  const pendingProfessionalsCount = useMemo(() => {
    return statsForDisplay.filter(({ base }) => isProfessionalPending(base.professionalId)).length;
  }, [statsForDisplay, isProfessionalPending]);

  const withdrawalSummary = useMemo(() => {
    const totalGross = withdrawals.reduce((sum, item) => sum + item.grossAmount, 0);
    const totalCommission = withdrawals.reduce((sum, item) => sum + item.commission, 0);
    const totalNet = withdrawals.reduce((sum, item) => sum + item.netAmount, 0);
    return { totalGross, totalCommission, totalNet };
  }, [withdrawals]);

  const invoiceSummary = useMemo(() => {
    const totals = invoices.reduce(
      (acc, invoice) => {
        acc.total += invoice.amount;
        acc.byStatus[invoice.status] = (acc.byStatus[invoice.status] || 0) + invoice.amount;
        return acc;
      },
      { total: 0, byStatus: {} as Record<InvoiceStatus, number> }
    );
    return totals;
  }, [invoices]);

  // ✅ NUEVO: Resumen de clientes externos (CRM)
  const externalClientsSummary = useMemo(() => {
    const totalAmount = externalClients.reduce((sum, client) => sum + (client.totalAmount || 0), 0);
    const totalHours = externalClients.reduce((sum, client) => sum + (client.totalHours || 0), 0);
    return {
      totalAmount,
      totalHours,
      clientsCount: externalClients.length
    };
  }, [externalClients]);

  const totalInvoicePaid = invoiceSummary.byStatus['paid'] ?? 0;
  const totalIncome = withdrawalSummary.totalNet + totalInvoicePaid + externalClientsSummary.totalAmount;
  const payrollPaid = currentTotalAmount;
  const netProfit = totalIncome - payrollPaid;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
  const summaryMetrics = useMemo(() => [
    {
      label: 'Nómina actual',
      value: formatCurrency(payrollPaid, primaryCurrency),
      helper: `${statsForDisplay.length} profesionales`,
      icon: Wallet
    },
    {
      label: 'Ingresos totales',
      value: formatCurrency(totalIncome, primaryCurrency),
      helper: `Netos ${formatCurrency(withdrawalSummary.totalNet, primaryCurrency)}`,
      icon: TrendingUp
    },
    {
      label: 'Pendiente por pagar',
      value: formatCurrency(totalPendingAmount, primaryCurrency),
      helper: `${pendingProfessionalsCount} profesionales`,
      icon: Clock
    },
    {
      label: 'Margen neto',
      value: `${Number.isFinite(profitMargin) ? profitMargin.toFixed(1) : '0.0'}%`,
      helper: `${netProfit >= 0 ? '+' : ''}${formatCurrency(netProfit, primaryCurrency)}`,
      icon: BarChart3
    }
  ], [
    payrollPaid,
    primaryCurrency,
    statsForDisplay.length,
    totalIncome,
    withdrawalSummary.totalNet,
    totalPendingAmount,
    pendingProfessionalsCount,
    profitMargin,
    netProfit
  ]);

  const withdrawalNetPreview = useMemo(() => {
    const gross = Number(withdrawalForm.grossAmount || 0);
    const commission = Number(withdrawalForm.commission || 0);
    if (Number.isNaN(gross) || Number.isNaN(commission)) return 0;
    return gross - commission;
  }, [withdrawalForm.grossAmount, withdrawalForm.commission]);
  const paymentTypeDistribution = useMemo(() => {
    const counts: Record<PaymentFrequency, number> = { daily: 0, weekly: 0, biweekly: 0, monthly: 0 };
    calendars.forEach(calendar => {
      const type = (calendar.payoutDetails?.paymentType ?? 'monthly') as PaymentFrequency;
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [calendars]);

  const paymentTypeStats = useMemo(() => {
    const total = Object.values(paymentTypeDistribution).reduce((sum, value) => sum + value, 0);
    return PAYMENT_TYPE_OPTIONS.map(option => {
      const count = paymentTypeDistribution[option.value] ?? 0;
      const percent = total ? Math.round((count / total) * 100) : 0;
      return { label: option.label, value: option.value, count, percent };
    });
  }, [paymentTypeDistribution]);

  const activePaymentActionContext = paymentActionState.open && paymentActionState.calendarId
    ? getCalendarPaymentContext(paymentActionState.calendarId)
    : null;
  const actionDueDate = activePaymentActionContext
    ? getExpectedPaymentDate(activePaymentActionContext.currentPeriod)
    : null;
  const actionDueLabel = formatDateLabel(actionDueDate);
  const actionAmountLabel = typeof paymentActionState.amount === 'number'
    ? formatCurrency(
        paymentActionState.amount,
        activePaymentActionContext?.calendar?.hourlyRateCurrency || 'EUR'
      )
    : null;
  const actionPaymentMethodLabel = paymentActionState.method
    ? getPaymentMethodLabel(paymentActionState.method)
    : null;
  const actionPeriodLabel = paymentActionState.summary ?? activePaymentActionContext?.currentPeriod?.label;
  const todayLabel = formatDateLabel(new Date());
  const maintainedNextStart = actionDueDate ? addDays(actionDueDate, 1) : null;
  const paymentReferenceDate = customPaymentDate
    ? normalizeDate(new Date(customPaymentDate)) ?? new Date(customPaymentDate)
    : normalizeDate(new Date()) ?? new Date();
  const adjustedNextStart = addDays(paymentReferenceDate, 1);
  const maintainedNextStartLabel = maintainedNextStart ? formatDateLabel(maintainedNextStart) : null;
  const adjustedNextStartLabel = formatDateLabel(adjustedNextStart);

  const invoiceStatusStats = useMemo(() => {
    return INVOICE_STATUS_OPTIONS.map(option => ({
      value: option.value,
      label: option.label,
      amount: invoiceSummary.byStatus[option.value] ?? 0
    }));
  }, [invoiceSummary]);


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

  const selectedProfessional = useMemo(() => {
    if (!displayStats.length || !selectedProfessionalId) {
      return null;
    }
    return displayStats.find(({ base }) => base.professionalId === selectedProfessionalId) ?? null;
  }, [displayStats, selectedProfessionalId]);

  const handlePayoutFieldChange = useCallback((
    calendarId: string,
    field: keyof PayoutDraft,
    value: string | number | null
  ) => {
    setPayoutDrafts(prev => {
      const calendar = calendarMap.get(calendarId);
      const details = (calendar as any)?.payoutDetails ?? {};
      const base: PayoutDraft = prev[calendarId] ?? {
        iban: details.iban || '',
        bank: details.bank || '',
        notes: details.notes || '',
        paypalEmail: details.paypalEmail || '',
        paymentType: details.paymentType,
        paymentDay: typeof details.paymentDay === 'number' ? details.paymentDay : null,
        paymentMethod: details.paymentMethod
      };

      let nextValue: PayoutDraft[keyof PayoutDraft];

      if (field === 'paymentDay') {
        if (value === null || value === '') {
          nextValue = null;
        } else {
          const numeric = typeof value === 'number' ? value : Number(value);
          nextValue = Number.isNaN(numeric) ? null : numeric;
        }
      } else if (field === 'paymentType') {
        nextValue = (value as PaymentFrequency) ?? undefined;
      } else if (field === 'paymentMethod') {
        nextValue = (value as PaymentMethod) ?? undefined;
      } else {
        nextValue = (value as string) ?? '';
      }

      const nextDraft: PayoutDraft = {
        ...base,
        [field]: nextValue
      };

      if (field === 'paymentType') {
        const selectedType = (nextValue as PaymentFrequency) ?? 'monthly';
        if (selectedType === 'daily') {
          nextDraft.paymentDay = null;
        } else if (selectedType === 'weekly') {
          const weekday = typeof base.paymentDay === 'number' ? base.paymentDay : 5;
          nextDraft.paymentDay = weekday % 7;
        } else {
          nextDraft.paymentDay = typeof base.paymentDay === 'number' ? base.paymentDay : 1;
        }
      }

      return {
        ...prev,
        [calendarId]: nextDraft
      };
    });
  }, [calendarMap]);

  const handlePayoutRecordChange = useCallback((
    calendarId: string,
    field: keyof PayoutRecordDraft,
    value: string | number
  ) => {
    setPayoutRecordDrafts(prev => {
      const calendar = calendarMap.get(calendarId);
      const context = getCalendarPaymentContext(calendarId);
      const periodForRecord = context?.currentPeriod.periodKey ?? periodKey;
      const existingRecord = calendar?.payoutRecords?.[periodForRecord];
      const currentRecord: PayoutRecordDraft = prev[calendarId] ?? {
        status: (existingRecord?.status ?? 'pending') as 'pending' | 'paid',
        lastPaymentDate: existingRecord?.lastPaymentDate || '',
        lastPaymentBy: existingRecord?.lastPaymentBy || '',
        note: existingRecord?.note || '',
        paymentMethod: existingRecord?.paymentMethod,
        amountPaid: typeof existingRecord?.amountPaid === 'number' ? existingRecord?.amountPaid : undefined
      };

      let nextValue: PayoutRecordDraft[keyof PayoutRecordDraft];
      if (field === 'status') {
        nextValue = value as 'pending' | 'paid';
      } else if (field === 'amountPaid') {
        if (typeof value === 'string' && value.trim() === '') {
          nextValue = undefined;
        } else {
          const numeric = typeof value === 'number' ? value : Number(value);
          nextValue = Number.isNaN(numeric) ? undefined : numeric;
        }
      } else if (field === 'paymentMethod') {
        nextValue = value as PaymentMethod;
      } else {
        nextValue = value as string;
      }

      return {
        ...prev,
        [calendarId]: {
          ...currentRecord,
          [field]: nextValue
        }
      };
    });
  }, [calendarMap, getCalendarPaymentContext, periodKey]);

  const handleQuickMarkAsPaid = useCallback(async (
    calendarId: string,
    options?: { amount?: number; paymentMethod?: PaymentMethod; preserveScheduledDate?: boolean }
  ): Promise<boolean> => {
    const context = getCalendarPaymentContext(calendarId);
    if (!context) {
      toast.error('No encontramos el profesional a actualizar');
      return false;
    }

    const { calendar, currentPeriod, preferredMethod, intervalDays } = context;
    // ✅ CAMBIO CLAVE: Usar periodKey del contexto directamente (ya está bien calculado)
    // currentPeriod.periodKey es el correcto: W42 para 17-23 oct
    const targetPeriodKey = currentPeriod.periodKey;
    const existingRecord = calendar.payoutRecords?.[targetPeriodKey];
    const today = new Date().toISOString().split('T')[0];

    logger.log('💳 HANDLEQUICKMARKASPAID - Usando periodKey del contexto:', {
      calendar: calendar.name,
      paymentType: calendar.payoutDetails?.paymentType ?? 'monthly',
      periodStart: currentPeriod.start.toISOString().split('T')[0],
      periodLabel: currentPeriod.label,
      periodKey: targetPeriodKey,
      expectedKey: currentPeriod.periodKey,
      match: '✅'
    });

    const draftRecord = payoutRecordDrafts[calendarId];
    const draftDetails = payoutDrafts[calendarId];

    const paymentMethod = options?.paymentMethod
      ?? draftRecord?.paymentMethod
      ?? existingRecord?.paymentMethod
      ?? preferredMethod;
    const amountValue = options?.amount;
    const hasAmount = typeof amountValue === 'number' && !Number.isNaN(amountValue);
    const normalizedAmount = hasAmount
      ? Number(amountValue.toFixed(2))
      : typeof draftRecord?.amountPaid === 'number'
        ? draftRecord.amountPaid
        : existingRecord?.amountPaid;

    const cycleStartDate = normalizeDate(currentPeriod.start) ?? new Date(today);
    const paymentDateObj = normalizeDate(new Date(today)) ?? new Date(today);
    const expectedPaymentDate = normalizeDate(currentPeriod.end);
    const cycleEndDate = expectedPaymentDate ?? addDays(cycleStartDate, intervalDays - 1);
    const preserveScheduleRequest = options?.preserveScheduledDate ?? false;
    const paymentBeforeExpected = paymentDateObj.getTime() <= cycleEndDate.getTime();
    const shouldPreserveSchedule = preserveScheduleRequest && paymentBeforeExpected;
    const nextCycleStartDate = shouldPreserveSchedule
      ? addDays(cycleEndDate, 1)
      : addDays(paymentDateObj, 1);
    const nextCycleEndDate = addDays(nextCycleStartDate, intervalDays - 1);
    const scheduledDate = cycleEndDate.toISOString().split('T')[0];

    const earlyPaymentDays = expectedPaymentDate
      ? Math.floor((expectedPaymentDate.getTime() - paymentDateObj.getTime()) / DAY_IN_MS)
      : 0;

    const normalizedRecord: PayoutRecordDraft = {
      status: 'paid',
      actualPaymentDate: today,        // Cuándo se pagó realmente
      scheduledPaymentDate: scheduledDate, // Cuándo debería haberse pagado
      lastPaymentDate: today,          // Mantener para compatibilidad
      lastPaymentBy: user?.displayName || user?.email || 'Equipo',
      note: draftRecord?.note ?? existingRecord?.note,
      paymentMethod,
      amountPaid: typeof normalizedAmount === 'number' ? normalizedAmount : undefined,
      earlyPaymentDays: earlyPaymentDays > 0 ? earlyPaymentDays : undefined,
      cycleStart: cycleStartDate.toISOString().split('T')[0],
      cycleEnd: cycleEndDate.toISOString().split('T')[0],
      nextCycleStart: nextCycleStartDate.toISOString().split('T')[0],
      nextCycleEnd: nextCycleEndDate.toISOString().split('T')[0],
      preserveScheduledDate: shouldPreserveSchedule,
      intervalDays
    };

    const details = (calendar as any)?.payoutDetails ?? {};
    const normalizedDetails = {
      iban: (draftDetails?.iban ?? details?.iban) || undefined,
      bank: (draftDetails?.bank ?? details?.bank) || undefined,
      notes: (draftDetails?.notes ?? details?.notes) || undefined,
      paypalEmail: (draftDetails?.paypalEmail ?? details?.paypalEmail) || undefined,
      paymentType: draftDetails?.paymentType ?? details?.paymentType ?? undefined,
      paymentDay: typeof draftDetails?.paymentDay === 'number'
        ? draftDetails.paymentDay
        : typeof details?.paymentDay === 'number'
          ? details.paymentDay
          : undefined,
      paymentMethod: draftDetails?.paymentMethod ?? details?.paymentMethod ?? undefined
    };

    try {
      setMarkingPayout(prev => ({ ...prev, [calendarId]: true }));

      logger.log('💳 INICIANDO FLUJO DE PAGO:', {
        calendario: calendar.name,
        calendarId,
        periodKey: targetPeriodKey,
        paymentType: normalizedDetails.paymentType,
        amount: normalizedRecord.amountPaid,
        status: normalizedRecord.status,
        fechaPago: normalizedRecord.actualPaymentDate,
        fechaProgramada: normalizedRecord.scheduledPaymentDate
      });

      await updatePayoutMutation.mutateAsync({
        calendarId,
        periodKey: targetPeriodKey,
        payoutDetails: normalizedDetails,
        payoutRecord: normalizedRecord
      });

      logger.log('✅ PAGO GUARDADO EN FIRESTORE - Esperando invalidación de caché...');
      toast.success('Pago registrado correctamente');
      setPayoutRecordDrafts(prev => ({
        ...prev,
        [calendarId]: {
          ...normalizedRecord
        }
      }));
      const nextPaymentType = draftDetails?.paymentType ?? details?.paymentType ?? 'monthly';
      const nextPaymentDayValue = typeof draftDetails?.paymentDay === 'number'
        ? draftDetails.paymentDay
        : typeof details?.paymentDay === 'number'
          ? details.paymentDay
          : null;
      const nextPaymentMethod = draftDetails?.paymentMethod ?? details?.paymentMethod ?? preferredMethod;

      setPayoutDrafts(prev => ({
        ...prev,
        [calendarId]: {
          iban: normalizedDetails.iban || '',
          bank: normalizedDetails.bank || '',
          notes: normalizedDetails.notes || '',
          paypalEmail: normalizedDetails.paypalEmail || '',
          paymentType: nextPaymentType,
          paymentDay: nextPaymentDayValue,
          paymentMethod: nextPaymentMethod
        }
      }));
      setEditingPayout(prev => ({ ...prev, [calendarId]: false }));
      return true;
    } catch (error) {
      console.error('Error registrando pago', error);
      toast.error('No pudimos registrar el pago');
      return false;
    } finally {
      setMarkingPayout(prev => ({ ...prev, [calendarId]: false }));
    }
  }, [getCalendarPaymentContext, payoutRecordDrafts, payoutDrafts, updatePayoutMutation, user?.displayName, user?.email]);

  const handleSchedulePayment = useCallback(async (
    calendarId: string,
    scheduledDateISO: string
  ): Promise<boolean> => {
    const context = getCalendarPaymentContext(calendarId);
    if (!context) {
      toast.error('No encontramos el profesional a actualizar');
      return false;
    }

    if (!scheduledDateISO) {
      toast.error('Selecciona una fecha para programar el pago');
      return false;
    }

    const { calendar, currentPeriod, preferredMethod, intervalDays } = context;
    const targetPeriodKey = currentPeriod.periodKey;
    const existingRecord = calendar.payoutRecords?.[targetPeriodKey];
    const recordDraft = payoutRecordDrafts[calendarId];
    const draftDetails = payoutDrafts[calendarId];
    const details = (calendar as any)?.payoutDetails ?? {};

    const normalizedRecord: PayoutRecordDraft = {
      status: 'pending',
      scheduledPaymentDate: scheduledDateISO,
      actualPaymentDate: null,
      lastPaymentDate: null,
      lastPaymentBy: null,
      note: recordDraft?.note ?? existingRecord?.note,
      paymentMethod: recordDraft?.paymentMethod ?? existingRecord?.paymentMethod ?? preferredMethod,
      amountPaid: recordDraft?.amountPaid ?? existingRecord?.amountPaid,
      earlyPaymentDays: null,
      cycleStart: currentPeriod.start.toISOString().split('T')[0],
      cycleEnd: null,
      intervalDays
    };

    const normalizedDetails = {
      iban: (draftDetails?.iban ?? details?.iban) || undefined,
      bank: (draftDetails?.bank ?? details?.bank) || undefined,
      notes: (draftDetails?.notes ?? details?.notes) || undefined,
      paypalEmail: (draftDetails?.paypalEmail ?? details?.paypalEmail) || undefined,
      paymentType: draftDetails?.paymentType ?? details?.paymentType ?? undefined,
      paymentDay: typeof draftDetails?.paymentDay === 'number'
        ? draftDetails.paymentDay
        : typeof details?.paymentDay === 'number'
          ? details.paymentDay
          : undefined,
      paymentMethod: draftDetails?.paymentMethod ?? details?.paymentMethod ?? undefined
    };

    try {
      setSavingPayout(prev => ({ ...prev, [calendarId]: true }));
      await updatePayoutMutation.mutateAsync({
        calendarId,
        periodKey: targetPeriodKey,
        payoutDetails: normalizedDetails,
        payoutRecord: normalizedRecord
      });
      toast.success(`Pago programado para ${new Date(scheduledDateISO).toLocaleDateString('es-ES')}`);
      setPayoutRecordDrafts(prev => ({
        ...prev,
        [calendarId]: {
          status: 'pending',
          scheduledPaymentDate: scheduledDateISO,
          note: normalizedRecord.note,
          paymentMethod: normalizedRecord.paymentMethod,
          amountPaid: normalizedRecord.amountPaid,
          cycleStart: normalizedRecord.cycleStart,
          intervalDays: normalizedRecord.intervalDays
        }
      }));
      return true;
    } catch (error) {
      console.error('Error programando pago', error);
      toast.error('No pudimos programar el pago');
      return false;
    } finally {
      setSavingPayout(prev => ({ ...prev, [calendarId]: false }));
    }
  }, [getCalendarPaymentContext, payoutRecordDrafts, payoutDrafts, updatePayoutMutation]);

  const closePaymentActionModal = useCallback(() => {
    setPaymentActionState({ open: false, calendarId: null });
    setCustomPaymentDate('');
    setPreserveScheduledDate(false);
    setModalLoading(false);
  }, []);

  const openPaymentActionModal = useCallback((
    calendarId: string,
    payload?: { amount?: number; method?: PaymentMethod; summary?: string }
  ) => {
    const context = getCalendarPaymentContext(calendarId);
    const defaultDate = context ? getExpectedPaymentDate(context.currentPeriod) : null;
    setCustomPaymentDate(toInputDateValue(defaultDate));
    setPreserveScheduledDate(false);
    setPaymentActionState({
      open: true,
      calendarId,
      amount: payload?.amount ?? (context?.amountForPeriod ?? undefined),
      method: payload?.method ?? context?.preferredMethod,
      summary: payload?.summary ?? context?.currentPeriod?.label ?? undefined
    });
  }, [getCalendarPaymentContext]);

  const handleConfirmPaymentNow = useCallback(async () => {
    if (!paymentActionState.calendarId) return;
    setModalLoading(true);
    const success = await handleQuickMarkAsPaid(paymentActionState.calendarId, {
      amount: typeof paymentActionState.amount === 'number' ? paymentActionState.amount : undefined,
      paymentMethod: paymentActionState.method,
      preserveScheduledDate: preserveScheduledDate
    });
    setModalLoading(false);
    if (success) {
      closePaymentActionModal();
    }
  }, [
    closePaymentActionModal,
    handleQuickMarkAsPaid,
    paymentActionState.calendarId,
    paymentActionState.amount,
    paymentActionState.method,
    preserveScheduledDate
  ]);

  const handleConfirmScheduledPayment = useCallback(async () => {
    if (!paymentActionState.calendarId) return;
    if (!customPaymentDate) {
      toast.error('Selecciona una fecha para programar el pago');
      return;
    }
    setModalLoading(true);
    const success = await handleSchedulePayment(paymentActionState.calendarId, customPaymentDate);
    setModalLoading(false);
    if (success) {
      closePaymentActionModal();
    }
  }, [closePaymentActionModal, customPaymentDate, handleSchedulePayment, paymentActionState.calendarId]);

  const handleCreateWithdrawal = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!withdrawalForm.date || !withdrawalForm.grossAmount) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    const gross = Number(withdrawalForm.grossAmount);
    const commission = Number(withdrawalForm.commission || 0);
    if (Number.isNaN(gross) || Number.isNaN(commission)) {
      toast.error('Importes inválidos');
      return;
    }
    try {
      await createWithdrawal.mutateAsync({
        date: new Date(withdrawalForm.date),
        grossAmount: gross,
        commission,
        note: withdrawalForm.note || undefined
      });
      toast.success('Retiro registrado');
      setWithdrawalForm({
        date: new Date().toISOString().split('T')[0],
        grossAmount: '',
        commission: '',
        note: ''
      });
    } catch (error) {
      console.error(error);
      toast.error('No pudimos registrar el retiro');
    }
  }, [withdrawalForm, createWithdrawal]);

  const handleCreateInvoice = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!invoiceForm.clientName || !invoiceForm.amount) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    const amount = Number(invoiceForm.amount);
    if (Number.isNaN(amount)) {
      toast.error('Monto inválido');
      return;
    }
    try {
      await createInvoice.mutateAsync({
        clientName: invoiceForm.clientName,
        amount,
        currency: invoiceForm.currency || 'EUR',
        status: invoiceForm.status,
        issueDate: new Date(invoiceForm.issueDate),
        dueDate: invoiceForm.dueDate ? new Date(invoiceForm.dueDate) : undefined,
        reference: invoiceForm.reference || undefined,
        notes: invoiceForm.notes || undefined
      });
      toast.success('Factura registrada');
      setInvoiceForm({
        clientName: '',
        amount: '',
        currency: invoiceForm.currency,
        status: 'draft',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        reference: '',
        notes: ''
      });
    } catch (error) {
      console.error(error);
      toast.error('No pudimos registrar la factura');
    }
  }, [invoiceForm, createInvoice]);

  const handleDeleteWithdrawal = useCallback(async (withdrawalId: string) => {
    try {
      await deleteWithdrawal.mutateAsync(withdrawalId);
      toast.success('Retiro eliminado');
    } catch (error) {
      console.error(error);
      toast.error('No pudimos eliminar el retiro');
    }
  }, [deleteWithdrawal]);

  const handleInvoiceStatusChange = useCallback(async (invoiceId: string, status: InvoiceStatus) => {
    try {
      await updateInvoiceStatus.mutateAsync({ invoiceId, status });
      toast.success('Estado actualizado');
    } catch (error) {
      console.error(error);
      toast.error('No pudimos actualizar el estado');
    }
  }, [updateInvoiceStatus]);

  const handleDeleteInvoiceRecord = useCallback(async (invoiceId: string) => {
    try {
      await deleteInvoice.mutateAsync(invoiceId);
      toast.success('Factura eliminada');
    } catch (error) {
      console.error(error);
      toast.error('No pudimos eliminar la factura');
    }
  }, [deleteInvoice]);

  const handleTogglePayoutEdit = useCallback((calendarId: string) => {
    setEditingPayout(prev => {
      const next = !prev[calendarId];
      if (next) {
        setPayoutDrafts(drafts => {
          if (drafts[calendarId]) return drafts;
          const calendar = calendarMap.get(calendarId);
          const details = (calendar as any)?.payoutDetails ?? {};
          return {
            ...drafts,
            [calendarId]: {
              iban: details?.iban || '',
              bank: details?.bank || '',
              notes: details?.notes || '',
              paypalEmail: details?.paypalEmail || '',
              paymentType: details?.paymentType ?? 'monthly',
              paymentDay: typeof details?.paymentDay === 'number' ? details.paymentDay : null,
              paymentMethod: details?.paymentMethod ?? 'transfer'
            }
          };
        });
        setPayoutRecordDrafts(drafts => {
          if (drafts[calendarId]) return drafts;
          const calendar = calendarMap.get(calendarId);
          // ✅ Obtener periodKey del contexto (ya está bien calculado)
          const context = getCalendarPaymentContext(calendarId);
          const periodForRecord = context?.currentPeriod?.periodKey ?? 'unknown';
          const record = calendar?.payoutRecords?.[periodForRecord];
          return {
            ...drafts,
            [calendarId]: {
              status: (record?.status ?? 'pending') as 'pending' | 'paid',
              lastPaymentDate: record?.lastPaymentDate || '',
              lastPaymentBy: record?.lastPaymentBy || '',
              note: record?.note || '',
              paymentMethod: record?.paymentMethod,
              amountPaid: typeof record?.amountPaid === 'number' ? record?.amountPaid : undefined
            }
          };
        });
      }
      return { ...prev, [calendarId]: next };
    });
  }, [calendarMap]);

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
  const handleSavePayout = useCallback(async (calendarId: string) => {
    const calendar = calendarMap.get(calendarId);
    if (!calendar) {
      toast.error('No encontramos el profesional a actualizar');
      return;
    }

    // ✅ Usar periodKey del contexto (ya está bien calculado en getCalendarPaymentContext)
    const context = getCalendarPaymentContext(calendarId);
    const targetPeriodKey = context?.currentPeriod?.periodKey ?? 'unknown';

    const draft =
      payoutDrafts[calendarId] ?? {
        iban: calendar.payoutDetails?.iban || '',
        bank: calendar.payoutDetails?.bank || '',
        notes: calendar.payoutDetails?.notes || '',
        paypalEmail: calendar.payoutDetails?.paypalEmail || '',
        paymentType: calendar.payoutDetails?.paymentType ?? 'monthly',
        paymentDay: typeof calendar.payoutDetails?.paymentDay === 'number' ? calendar.payoutDetails.paymentDay : null,
        paymentMethod: calendar.payoutDetails?.paymentMethod ?? 'transfer'
      };

    const existingRecord = calendar.payoutRecords?.[targetPeriodKey];
    const recordDraft = payoutRecordDrafts[calendarId] ?? {
      status: (existingRecord?.status ?? 'pending') as 'pending' | 'paid',
      lastPaymentDate: existingRecord?.lastPaymentDate || '',
      lastPaymentBy: existingRecord?.lastPaymentBy || '',
      note: existingRecord?.note || '',
      paymentMethod: existingRecord?.paymentMethod,
      amountPaid: typeof existingRecord?.amountPaid === 'number' ? existingRecord.amountPaid : undefined
    };
    const normalizedRecord = {
      status: recordDraft.status,
      lastPaymentDate: recordDraft.lastPaymentDate || undefined,
      lastPaymentBy: recordDraft.lastPaymentBy || undefined,
      note: recordDraft.note || undefined,
      paymentMethod: recordDraft.paymentMethod || undefined,
      amountPaid: typeof recordDraft.amountPaid === 'number' ? recordDraft.amountPaid : undefined
    };
    const normalizedDetails = {
      iban: draft.iban || undefined,
      bank: draft.bank || undefined,
      notes: draft.notes || undefined,
      paypalEmail: draft.paypalEmail || undefined,
      paymentType: draft.paymentType || undefined,
      paymentDay: draft.paymentDay ?? undefined,
      paymentMethod: draft.paymentMethod || undefined
    };

    try {
      setSavingPayout(prev => ({ ...prev, [calendarId]: true }));

      // ✅ Usar mutación de React Query (actualiza caché automáticamente)
      await updatePayoutMutation.mutateAsync({
        calendarId,
        periodKey: targetPeriodKey,
        payoutDetails: normalizedDetails,
        payoutRecord: normalizedRecord
      });

      toast.success('Detalles de pago actualizados');
      setPayoutDrafts(prev => ({ ...prev, [calendarId]: draft }));
      setPayoutRecordDrafts(prev => ({ ...prev, [calendarId]: {
        status: normalizedRecord.status,
        lastPaymentDate: normalizedRecord.lastPaymentDate,
        lastPaymentBy: normalizedRecord.lastPaymentBy,
        note: normalizedRecord.note,
        paymentMethod: normalizedRecord.paymentMethod,
        amountPaid: normalizedRecord.amountPaid
      } }));
      setEditingPayout(prev => ({ ...prev, [calendarId]: false }));
    } catch (error) {
      console.error('Error guardando detalles de pago', error);
      toast.error('No pudimos guardar los detalles de pago');
    } finally {
      setSavingPayout(prev => ({ ...prev, [calendarId]: false }));
    }
  }, [calendarMap, getCalendarPaymentContext, payoutDrafts, payoutRecordDrafts, periodKey, updatePayoutMutation]);

  /**
   * Cancelar un pago registrado - vuelve el estado a "pendiente"
   * Elimina todas las fechas de pago y vuelve a estado "pending"
   */
  const handleCancelPayment = useCallback(async (calendarId: string, periodKey: string) => {
    const calendar = calendarMap.get(calendarId);
    if (!calendar) {
      toast.error('No encontramos el profesional');
      return;
    }

    const currentRecord = calendar.payoutRecords?.[periodKey];

    // Confirmar acción
    if (!window.confirm(`¿Estás seguro de que quieres cancelar este pago?\n\nSe eliminará el registro y volvará al estado "Pendiente".\nEsto afectará también a los cálculos de períodos futuros.`)) {
      return;
    }

    try {
      setMarkingPayout(prev => ({ ...prev, [calendarId]: true }));

      // Crear un registro vacío (pending) - elimina toda la info del pago
      const cancelledRecord = {
        status: 'pending' as const,
        // NO incluir: actualPaymentDate, scheduledPaymentDate, lastPaymentDate, amountPaid, etc.
        // Esto efectivamente "borra" el registro de pago anterior
      };

      await updatePayoutMutation.mutateAsync({
        calendarId,
        periodKey,
        payoutDetails: (calendar as any)?.payoutDetails || {},
        payoutRecord: cancelledRecord
      });

      // Limpiar todos los drafts relacionados
      setPayoutRecordDrafts(prev => {
        const { [calendarId]: _discarded, ...rest } = prev;
        return rest;
      });

      toast.success('Pago cancelado ✓. Estado vuelto a "Pendiente"');
    } catch (error) {
      console.error('Error cancelando pago', error);
      toast.error('No pudimos cancelar el pago. Intenta de nuevo.');
    } finally {
      setMarkingPayout(prev => ({ ...prev, [calendarId]: false }));
    }
  }, [calendarMap, updatePayoutMutation]);

  const renderProfessionalDetail = useCallback((statContainer: typeof statsForDisplay[number]) => {
    const { base: stat, filteredMonths, filteredAmount, filteredHours, filteredEvents, paymentPeriod } = statContainer as typeof statsForDisplay[number] & { paymentPeriod?: any };
    const relatedCalendar = calendarMap.get(stat.professionalId);
    const owner = relatedCalendar?.members?.find(member => member.role === 'owner') ?? relatedCalendar?.members?.[0];
    const paymentContext = getCalendarPaymentContext(stat.professionalId);

    const payoutDetails = (() => {
      const calAny = relatedCalendar as any;
      return calAny?.payoutDetails || calAny?.billing || calAny?.settings?.payout || {};
    })() as {
      iban?: string;
      bank?: string;
      notes?: string;
      paypalEmail?: string;
      paymentType?: PaymentFrequency;
      paymentDay?: number;
      paymentMethod?: PaymentMethod;
    };

    // ✅ Construir serie de 12 meses para el gráfico
    // IMPORTANTE: El gráfico necesita SIEMPRE los 12 meses del año
    // Usar 'annualStats' (hook useWorkHoursStats) que SIEMPRE devuelve año completo
    const chartData = annualStats && annualStats.length > 0
      ? annualStats.find(s => s.professionalId === stat.professionalId)
      : null;

    // ✅ FALLBACK: Si annualStats aún no está cargado, usar stat.monthlyBreakdown
    // (que ahora siempre tiene 12 meses tras nuestro fix)
    const dataForChart = chartData || stat;

    const monthlySeries = Array.from({ length: 12 }, (_, index) => {
      const monthNumber = (index + 1).toString().padStart(2, '0');
      const key = `${selectedYear}-${monthNumber}`;

      // Usar datos del chart (ya sea annualStats o fallback a stat)
      const entry = dataForChart?.monthlyBreakdown?.find(item => item.month === key);
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

    const periodKeyForRecord = paymentContext?.currentPeriod.periodKey ?? periodKey;
    const amountForCurrentPeriod = typeof paymentContext?.amountForPeriod === 'number'
      ? paymentContext.amountForPeriod
      : undefined;
    const isMarking = Boolean(markingPayout[stat.professionalId]);
    const isSaving = savingPayout[stat.professionalId];
    const quickPayDisabled = isMarking || isSaving;

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
        paypalEmail: payoutDetails.paypalEmail || '',
        paymentType: payoutDetails.paymentType ?? 'monthly',
        paymentDay: typeof payoutDetails.paymentDay === 'number' ? payoutDetails.paymentDay : null,
        paymentMethod: payoutDetails.paymentMethod ?? 'transfer'
      };
    const editing = editingPayout[stat.professionalId] ?? false;
    const formValues = editing
      ? draft
      : {
          iban: payoutDetails.iban || draft.iban || '',
          bank: payoutDetails.bank || draft.bank || '',
          notes: payoutDetails.notes || draft.notes || '',
          paypalEmail: payoutDetails.paypalEmail || draft.paypalEmail || ''
        };

    const paymentType: PaymentFrequency = draft.paymentType ?? payoutDetails.paymentType ?? 'monthly';
    const paymentDay = typeof draft.paymentDay === 'number'
      ? draft.paymentDay
      : typeof payoutDetails.paymentDay === 'number'
        ? payoutDetails.paymentDay
        : null;
    const payoutCustomRate = typeof (relatedCalendar as any)?.payoutDetails?.customHourlyRate === 'number'
      ? (relatedCalendar as any).payoutDetails.customHourlyRate
      : null;
    const preferredMethod: PaymentMethod = draft.paymentMethod
      ?? payoutDetails.paymentMethod
      ?? 'transfer';
    const effectiveRate = payoutCustomRate ?? (
      stat.hourlyRate > 0
        ? stat.hourlyRate
        : typeof relatedCalendar?.hourlyRate === 'number'
          ? relatedCalendar.hourlyRate
          : null
    );
    const hasCustomRate = typeof payoutCustomRate === 'number';

    const latestPaymentRecord = paymentContext?.latestRecord ?? getLatestPaymentRecord(relatedCalendar?.payoutRecords);
    const currentPeriod = paymentContext?.currentPeriod ?? (() => {
      const startFallback = paymentContext?.nextCycleStart
        ? addDays(paymentContext.nextCycleStart, -((paymentContext.intervalDays ?? intervalDays)))
        : normalizeDate(new Date()) ?? new Date();
      const endFallback = paymentContext?.nextCycleEnd
        ? normalizeDate(paymentContext.nextCycleEnd) ?? addDays(startFallback, intervalDays - 1)
        : addDays(startFallback, intervalDays - 1);

      return {
        start: startFallback,
        end: endFallback,
        label: `${startFallback.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${endFallback.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`,
        periodKey: startFallback.toISOString().split('T')[0]
      } as PaymentPeriod;
    })();
    const intervalDays = paymentContext?.intervalDays ?? getIntervalDays(paymentType);
    const nextCycleEnd = paymentContext?.nextCycleEnd
      ?? (latestPaymentRecord?.scheduledPaymentDate ? normalizeDate(new Date(latestPaymentRecord.scheduledPaymentDate)) : null);
    const nextPaymentDate = nextCycleEnd
      ? normalizeDate(nextCycleEnd)
      : addDays(paymentContext?.currentPeriod.end ?? new Date(), intervalDays - 1);

    const nextPaymentLabel = nextPaymentDate ? formatRelativeDate(nextPaymentDate) : 'Sin programar';

    const paymentDayLabel = getPaymentDayDescription(paymentType, paymentDay);

    const currentRecord = (relatedCalendar as any)?.payoutRecords?.[periodKeyForRecord];
    const recordDraft = payoutRecordDrafts[stat.professionalId];
    const defaultRecord: PayoutRecordDraft = {
      status: (currentRecord?.status ?? 'pending') as 'pending' | 'paid',
      lastPaymentDate: currentRecord?.lastPaymentDate || '',
      lastPaymentBy: currentRecord?.lastPaymentBy || '',
      note: currentRecord?.note || '',
      paymentMethod: currentRecord?.paymentMethod,
      amountPaid: typeof currentRecord?.amountPaid === 'number' ? currentRecord.amountPaid : undefined,
      cycleStart: currentRecord?.cycleStart || undefined,
      cycleEnd: currentRecord?.cycleEnd || undefined,
      intervalDays: typeof currentRecord?.intervalDays === 'number' ? currentRecord.intervalDays : undefined
    };
    const displayRecord = editing
      ? recordDraft ?? defaultRecord
      : recordDraft ?? currentRecord ?? null;
    const recordStatus = displayRecord?.status ?? currentRecord?.status ?? 'pending';
    const periodRangeLabel = paymentContext?.currentPeriod
      ? formatPeriodRange(paymentContext.currentPeriod)
      : paymentPeriod?.label ?? null;
    const pendingAmount = recordStatus === 'paid'
      ? 0
      : typeof amountForCurrentPeriod === 'number'
        ? amountForCurrentPeriod
        : typeof filteredAmount === 'number'
          ? filteredAmount
          : 0;
    const markAmount = pendingAmount > 0 ? pendingAmount : undefined;
    const lastPaymentAmountLabel = typeof displayRecord?.amountPaid === 'number'
      ? formatCurrency(displayRecord.amountPaid, stat.currency || 'EUR')
      : null;
    const lastPaymentMethodLabel = displayRecord?.paymentMethod
      ? getPaymentMethodLabel(displayRecord.paymentMethod)
      : null;

    const upcomingPaymentPeriods = getUpcomingPaymentPeriods(
      paymentType,
      paymentDay,
      (currentRecord?.status === 'paid' && currentRecord?.cycleEnd)
        ? currentRecord.cycleEnd
        : currentPeriod.end.toISOString().split('T')[0],
      4
    );
    const statusVariant = calculateStatusVariant(recordStatus, nextPaymentDate);
    const periodSummaryLabel = paymentContext?.currentPeriod?.label ?? paymentPeriod?.label ?? null;
    const dueDateLabel = formatDateLabel(nextPaymentDate);
    const statusTimelineDescription = recordStatus === 'paid'
      ? (() => {
          const paymentDate = displayRecord?.lastPaymentDate
            ? new Date(displayRecord.lastPaymentDate)
            : null;
          const formattedPaymentDate = paymentDate
            ? paymentDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
            : 'Fecha no registrada';
          const amountLabel = lastPaymentAmountLabel ? ` · ${lastPaymentAmountLabel}` : '';
          if (typeof displayRecord?.earlyPaymentDays === 'number' && displayRecord.earlyPaymentDays > 0) {
            return `Pagado ${formattedPaymentDate}${amountLabel} · ${displayRecord.earlyPaymentDays} día${displayRecord.earlyPaymentDays > 1 ? 's' : ''} antes`;
          }
          return `Pagado ${formattedPaymentDate}${amountLabel}`;
        })()
      : `${formatCurrency(pendingAmount, stat.currency || 'EUR')} · ${describeDueState(nextPaymentDate)}`;
    const summaryDueText = recordStatus === 'paid'
      ? (nextPaymentDate ? `Siguiente pago: ${dueDateLabel}` : 'Siguiente pago sin programar')
      : (nextPaymentDate ? `Debes pagar el ${dueDateLabel}` : 'Fecha de pago sin programar');

    const pendingServicesCount = pendingServices[stat.professionalId]?.count ?? 0;
    const pendingServicesExamples = pendingServices[stat.professionalId]?.examples ?? [];
    const activeMonthKeys = filteredMonths.length
      ? new Set(filteredMonths.map(month => month.month))
      : new Set(monthlySeries.map(month => month.monthKey));
    const projectedNextAmount = getNextPaymentPeriodAmount(stat.professionalId) ?? 0;
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const currentHoursValue = paymentContext?.hoursForPeriod ?? filteredHours ?? 0;
    const currentServicesCount = filteredEvents ?? 0;
    const zeroBalance = recordStatus !== 'paid' && pendingAmount <= 0.009 && currentServicesCount === 0 && pendingServicesCount === 0;
    const dueDate = nextPaymentDate;
    const dueDiff = dueDate ? Math.round((dueDate.getTime() - todayMidnight.getTime()) / DAY_IN_MS) : null;
    let currentStatusVariant: 'paid' | 'clear' | 'overdue' | 'upcoming' | 'pending';
    let currentStatusLabel: string;

    if (recordStatus === 'paid') {
      currentStatusVariant = 'paid';
      currentStatusLabel = 'Pagado';
    } else if (zeroBalance) {
      currentStatusVariant = 'clear';
      currentStatusLabel = 'Sin saldo';
    } else if (dueDate && dueDate.getTime() < todayMidnight.getTime()) {
      currentStatusVariant = 'overdue';
      currentStatusLabel = 'Atrasado';
    } else if (dueDiff !== null && dueDiff <= 7) {
      currentStatusVariant = 'upcoming';
      currentStatusLabel = 'Próximo';
    } else {
      currentStatusVariant = 'pending';
      currentStatusLabel = 'Pendiente';
    }

    const formattedPaymentDate = displayRecord?.actualPaymentDate
      ? formatDisplayDate(displayRecord.actualPaymentDate)
      : displayRecord?.lastPaymentDate
        ? formatDisplayDate(displayRecord.lastPaymentDate)
        : null;

    let currentStatusMessage: string;
    if (recordStatus === 'paid') {
      currentStatusMessage = `Pago registrado ${formattedPaymentDate ?? ''}${lastPaymentAmountLabel ? ` · ${lastPaymentAmountLabel}` : ''}. El siguiente ciclo comienza el ${paymentContext?.nextPeriod ? paymentContext.nextPeriod.start.toLocaleDateString('es-ES') : dueDate ? dueDate.toLocaleDateString('es-ES') : '—'}.`;
    } else if (zeroBalance) {
      currentStatusMessage = 'Sin saldo pendiente: todavía no se han cerrado servicios en este período.';
    } else if (pendingServicesCount > 0) {
      currentStatusMessage = `Debes liquidar ${formatCurrency(Math.max(pendingAmount, 0), stat.currency || 'EUR')} antes del ${dueDate ? dueDate.toLocaleDateString('es-ES') : '—'}. ${pendingServicesCount} servicio${pendingServicesCount !== 1 ? 's' : ''} en curso.`;
    } else {
      currentStatusMessage = `Debes liquidar ${formatCurrency(Math.max(pendingAmount, 0), stat.currency || 'EUR')} antes del ${dueDate ? dueDate.toLocaleDateString('es-ES') : '—'}.`;
    }

    const servicesDetailMessage = pendingServicesCount > 0 && pendingServicesExamples.length > 0
      ? `Ejemplos: ${pendingServicesExamples.slice(0, 3).join(', ')}${pendingServicesExamples.length > 3 ? '…' : ''}`
      : '';

    const nextPeriod = paymentContext?.nextPeriod;
    const nextPeriodMessage = nextPeriod
      ? `Preparado para ${nextPeriod.end.toLocaleDateString('es-ES')}. El ciclo cubrirá ${createPeriodLabel(nextPeriod.start, nextPeriod.end)}.`
      : 'El próximo ciclo se generará automáticamente cuando existan servicios posteriores.';

    type TimelineEntry = {
      key: string;
      status: 'paid' | 'pending' | 'upcoming' | 'overdue' | 'clear';
      period: PaymentPeriod;
      amount: number;
      method?: PaymentMethod | null;
      paymentDate?: string | null;
      scheduledDate?: string | null;
      note?: string | null;
      isCurrent?: boolean;
      zeroBalance?: boolean;
    };

    const timelineEntries: TimelineEntry[] = (() => {
      const entries: TimelineEntry[] = [];
      const records = relatedCalendar?.payoutRecords ?? {};

      if (paymentContext?.nextPeriod) {
        entries.push({
          key: `${paymentContext.nextPeriod.periodKey}-upcoming`,
          status: 'upcoming',
          period: paymentContext.nextPeriod,
          amount: projectedNextAmount,
          method: preferredMethod,
          paymentDate: null,
          scheduledDate: paymentContext.nextPeriod.end.toISOString().split('T')[0],
          note: null,
          isCurrent: false,
          zeroBalance: projectedNextAmount <= 0.009
        });
      }

      entries.push({
        key: currentPeriod.periodKey,
        status: recordStatus === 'paid' ? 'paid' : zeroBalance ? 'clear' : currentStatusVariant === 'overdue' ? 'overdue' : 'pending',
        period: currentPeriod,
        amount: recordStatus === 'paid'
          ? (displayRecord?.amountPaid ?? amountForCurrentPeriod ?? 0)
          : Math.max(pendingAmount, 0),
        method: displayRecord?.paymentMethod ?? preferredMethod,
        paymentDate: displayRecord?.actualPaymentDate ?? displayRecord?.lastPaymentDate ?? null,
        scheduledDate: nextPaymentDate ? nextPaymentDate.toISOString().split('T')[0] : currentRecord?.scheduledPaymentDate ?? null,
        note: displayRecord?.note ?? null,
        isCurrent: true,
        zeroBalance
      });

      const sortedRecords = Object.entries(records)
        .filter(([key]) => key !== currentPeriod.periodKey)
        .map(([key, record]) => {
          const periodFromRecord = buildPeriodFromRecord(key, record, paymentType, paymentDay, intervalDays);
          if (
            !periodFromRecord ||
            Number.isNaN(periodFromRecord.start.getTime()) ||
            Number.isNaN(periodFromRecord.end.getTime())
          ) {
            return null;
          }
          const amount = record.status === 'paid'
            ? record.amountPaid ?? 0
            : record.pendingAmount ?? 0;
          const status: TimelineEntry['status'] = record.status === 'paid'
            ? 'paid'
            : amount <= 0.009
              ? 'clear'
              : record.scheduledPaymentDate && new Date(record.scheduledPaymentDate).getTime() < todayMidnight.getTime()
                ? 'overdue'
                : 'pending';

          return {
            key,
            status,
            period: periodFromRecord,
            amount,
            method: record.paymentMethod ?? null,
            paymentDate: record.actualPaymentDate ?? record.lastPaymentDate ?? null,
            scheduledDate: record.scheduledPaymentDate ?? null,
            note: record.note ?? null,
            isCurrent: false,
            zeroBalance: amount <= 0.009
          } as TimelineEntry | null;
        })
        .filter((entry): entry is TimelineEntry => Boolean(entry))
        .sort((a, b) => b.period.start.getTime() - a.period.start.getTime());

      entries.push(...sortedRecords.slice(0, 5));

      const seenPeriodKeys = new Set<string>();
      const deduped: TimelineEntry[] = [];
      entries.forEach(entry => {
        const dedupeKey = entry.status === 'upcoming'
          ? `upcoming-${entry.period?.periodKey ?? entry.key}`
          : entry.period?.periodKey ?? entry.key;
        if (entry.status !== 'upcoming' && entry.period?.periodKey) {
          if (seenPeriodKeys.has(entry.period.periodKey)) {
            return;
          }
          seenPeriodKeys.add(entry.period.periodKey);
        }
        deduped.push(entry);
      });

      return deduped;
    })();

    type CalendarDayMarker = 'start' | 'end' | 'paid' | 'pending' | 'overdue' | 'upcoming' | 'clear';
    const periodStartNormalized = normalizeDate(currentPeriod.start) ?? currentPeriod.start;
    const periodEndNormalized = normalizeDate(currentPeriod.end) ?? currentPeriod.end;
    const calendarDisplayStart = (() => {
      const weekDay = (periodStartNormalized.getDay() + 6) % 7;
      return addDays(periodStartNormalized, -weekDay);
    })();
    const calendarDisplayEnd = (() => {
      const weekDay = (periodEndNormalized.getDay() + 6) % 7;
      return addDays(periodEndNormalized, 6 - weekDay);
    })();
    const totalCalendarDays = Math.max(
      1,
      Math.round((calendarDisplayEnd.getTime() - calendarDisplayStart.getTime()) / DAY_IN_MS) + 1
    );
    type MarkerDescriptor = { statuses: Set<CalendarDayMarker>; notes: string[] };
    const dayMarkers = new Map<string, MarkerDescriptor>();
    const registerMarker = (value: string | Date | null | undefined, status: CalendarDayMarker, note: string) => {
      if (!value) return;
      const date = typeof value === 'string' ? new Date(value) : value;
      const normalized = normalizeDate(date);
      if (!normalized) return;
      const iso = normalized.toISOString().split('T')[0];
      const descriptor = dayMarkers.get(iso) ?? { statuses: new Set<CalendarDayMarker>(), notes: [] };
      descriptor.statuses.add(status);
      if (note && !descriptor.notes.includes(note)) {
        descriptor.notes.push(note);
      }
      dayMarkers.set(iso, descriptor);
    };

    registerMarker(periodStartNormalized, 'start', 'Inicio del período actual');
    registerMarker(periodEndNormalized, 'end', 'Fin del período actual · Fecha de corte');

    timelineEntries.forEach(entry => {
      const periodLabel = createPeriodLabel(entry.period.start, entry.period.end);
      if (entry.paymentDate) {
        const paymentNote = `Pago registrado (${periodLabel})${entry.amount ? ` · ${formatCurrency(entry.amount, stat.currency || 'EUR')}` : ''}`;
        registerMarker(entry.paymentDate, 'paid', paymentNote);
      }
      if (entry.scheduledDate) {
        let statusNote = 'Pago registrado';
        if (entry.status === 'pending') {
          statusNote = entry.zeroBalance ? 'Sin saldo pendiente' : 'Pago pendiente';
        } else if (entry.status === 'overdue') {
          statusNote = 'Pago atrasado';
        } else if (entry.status === 'upcoming') {
          statusNote = 'Pago programado';
        } else if (entry.status === 'paid') {
          statusNote = 'Pago liquidado';
        } else if (entry.status === 'clear') {
          statusNote = 'Saldo en cero';
        }
        registerMarker(entry.scheduledDate, entry.zeroBalance ? 'clear' : entry.status, `${statusNote} (${periodLabel})`);
      }
    });

    if (paymentContext?.nextPeriod) {
      registerMarker(paymentContext.nextPeriod.start, 'upcoming', `Inicio del siguiente ciclo (${paymentContext.nextPeriod.label})`);
      registerMarker(paymentContext.nextPeriod.end, 'upcoming', `Fin estimado del siguiente ciclo (${paymentContext.nextPeriod.label})`);
    }

    const calendarDays = Array.from({ length: totalCalendarDays }, (_, index) => {
      const date = addDays(calendarDisplayStart, index);
      const iso = date.toISOString().split('T')[0];
      const descriptor = dayMarkers.get(iso);
      const inPeriod = date >= periodStartNormalized && date <= periodEndNormalized;
      const statuses = descriptor ? Array.from(descriptor.statuses) : [];
      const tooltip = descriptor
        ? descriptor.notes.join(' · ')
        : inPeriod
          ? 'Día dentro del período actual'
          : 'Fuera del período actual';
      const classNames = ['financial-cycle-calendar__day'];
      if (inPeriod) {
        classNames.push('financial-cycle-calendar__day--in-period');
      } else {
        classNames.push('financial-cycle-calendar__day--outside');
      }
      if (statuses.includes('start')) classNames.push('financial-cycle-calendar__day--start');
      if (statuses.includes('end')) classNames.push('financial-cycle-calendar__day--end');
      if (statuses.includes('paid')) classNames.push('financial-cycle-calendar__day--paid');
      if (statuses.includes('pending')) classNames.push('financial-cycle-calendar__day--due');
      if (statuses.includes('overdue')) classNames.push('financial-cycle-calendar__day--overdue');
      if (statuses.includes('upcoming')) classNames.push('financial-cycle-calendar__day--upcoming');
      if (statuses.includes('clear')) classNames.push('financial-cycle-calendar__day--clear');
      if (date.toDateString() === todayMidnight.toDateString()) {
        classNames.push('financial-cycle-calendar__day--today');
      }
      return {
        date,
        iso,
        tooltip,
        className: classNames.join(' ')
      };
    });
    const calendarHeaderLabel = (() => {
      const sameMonth =
        periodStartNormalized.getMonth() === periodEndNormalized.getMonth() &&
        periodStartNormalized.getFullYear() === periodEndNormalized.getFullYear();
      if (sameMonth) {
        const label = periodStartNormalized.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        return label.charAt(0).toUpperCase() + label.slice(1);
      }
      const startLabel = periodStartNormalized.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      const endLabel = periodEndNormalized.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      return `${startLabel} – ${endLabel}`;
    })();

    return (
      <article className="financial-professional-card" key={stat.professionalId}>
        <div className="financial-professional-card__header">
          <div className="financial-professional-card__identity">
            <div className="financial-professional-card__avatar">
              {owner?.avatar ? (
                <img src={owner.avatar} alt={owner.name} />
              ) : (
                <span>{(stat.professionalName || 'P').charAt(0)}</span>
              )}
            </div>
            <div className="financial-professional-card__identity-info">
              <h4>{stat.professionalName}</h4>
              <span>{owner?.email || relatedCalendar?.linkedEmail || 'Sin email vinculado'}</span>
              <div className="financial-professional-card__badge-row">
                <span className={`financial-payment-badge ${PAYMENT_TYPE_BADGE_CLASS[paymentType]}`}>
                  {getPaymentTypeLabel(paymentType)}
                </span>
                <span className="financial-payment-badge financial-payment-badge--method">
                  {getPaymentMethodLabel(preferredMethod)}
                </span>
                {(paymentContext?.currentPeriod || paymentPeriod) && (
                  <span className="financial-payment-badge financial-payment-badge--period" style={{ backgroundColor: '#10b981', color: 'white' }}>
                    📅 {paymentContext?.currentPeriod?.label ?? paymentPeriod.label}
                  </span>
                )}
                {/* Próximos pagos - badges compactos */}
                {upcomingPaymentPeriods.slice(0, 3).map((period, index) => {
                  const relatedRecord = relatedCalendar?.payoutRecords?.[
                    Object.keys(relatedCalendar?.payoutRecords || {}).find(key => {
                      const record = relatedCalendar?.payoutRecords?.[key];
                      const referenceDateIso = record?.cycleEnd ?? record?.scheduledPaymentDate;
                      if (!referenceDateIso) return false;
                      const recordDate = new Date(referenceDateIso);
                      return recordDate.toDateString() === period.date.toDateString();
                    }) ?? ''
                  ];
                  const isPaid = relatedRecord?.status === 'paid';
                  const isCurrentPeriod = index === 0;

                  let bgColor = '#f3f4f6'; // gris por defecto
                  let textColor = '#6e6e73';

                  if (isPaid) {
                    bgColor = '#0a8047'; // verde
                    textColor = 'white';
                  } else if (isCurrentPeriod) {
                    bgColor = '#007aff'; // azul actual
                    textColor = 'white';
                  }

                  return (
                    <span
                      key={`next-${stat.professionalId}-${period.date.toISOString().split('T')[0]}`}
                      className="financial-payment-badge"
                      style={{ backgroundColor: bgColor, color: textColor }}
                    >
                      {isPaid ? '✓' : ''} {period.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="financial-professional-card__close-btn"
            onClick={() => setSelectedProfessionalId(null)}
            aria-label="Cerrar detalles"
          >
            <X size={20} />
          </button>
        <div className={`financial-detail-summary financial-detail-summary--${statusVariant}`}>
          <p className="financial-detail-summary__title">
            {getPaymentTypeLabel(paymentType)}
            {periodSummaryLabel ? ` · ${periodSummaryLabel}` : ''}
          </p>
          <div className="financial-detail-summary__chip-row">
            {editing ? (
              <select
                className="financial-detail-summary__select"
                value={(recordDraft?.status ?? displayRecord?.status ?? 'pending')}
                onChange={(event) => handlePayoutRecordChange(stat.professionalId, 'status', event.target.value)}
              >
                <option value="pending">Pendiente</option>
                <option value="paid">Pagado</option>
              </select>
            ) : (
              <span className={`financial-detail-summary__chip financial-detail-summary__chip--${statusVariant}`}>
                {recordStatus === 'paid' ? 'Pagado' : 'Pendiente'}
              </span>
            )}
          </div>
          <p className="financial-detail-summary__due">{summaryDueText}</p>
          <p className="financial-detail-summary__status">
            {statusTimelineDescription}
          </p>
        </div>
          <div className="financial-professional-card__metrics">
            <div className="financial-metric">
              <span>Estado período de pago</span>
              <strong>
                {recordStatus === 'paid'
                  ? '✓ Pagado'
                  : `⏳ Pendiente${pendingAmount > 0 ? ` ${formatCurrency(pendingAmount, stat.currency || 'EUR')}` : ''}`}
              </strong>
              <small>
                {recordStatus === 'paid'
                  ? `Pagado ${lastPaymentAmountLabel ? `con ${lastPaymentAmountLabel}` : ''} el ${displayRecord?.lastPaymentDate ? new Date(displayRecord.lastPaymentDate).toLocaleDateString('es-ES') : 'fecha no registrada'}`
                  : periodRangeLabel
                    ? `${periodRangeLabel}${paymentContext?.paymentType ? ` (${getPaymentTypeLabel(paymentContext.paymentType)})` : ''}`
                    : 'Sin período activo'}
              </small>
            </div>
            <div className="financial-metric financial-metric--schedule">
              <span>Próximo pago</span>
              <strong>
                {nextPaymentDate
                  ? nextPaymentDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                  : 'Sin programar'}
              </strong>
              <small>{paymentDayLabel} · {nextPaymentLabel}</small>
            </div>
            <div className="financial-metric financial-metric--hover">
              <span>Horas trabajadas</span>
              <strong>{WorkHoursAnalyticsService.formatHours(filteredHours || 0)}</strong>
              <small>Incluye servicios completados y en curso según filtros</small>
            </div>
          </div>

          {/* Tarifa vigente - métrica adicional */}
          <div className="financial-professional-card__metrics">
            <div className="financial-metric">
              <span>Tarifa vigente</span>
              <strong>
                {typeof effectiveRate === 'number'
                  ? `${formatCurrency(effectiveRate, stat.currency || 'EUR')}/h`
                  : 'Tarifa no definida'}
              </strong>
              <small>
                {hasCustomRate
                  ? 'Tarifa personalizada para este profesional'
                  : typeof effectiveRate === 'number'
                    ? `Configurada en el calendario (${(stat.currency || 'EUR').toUpperCase()})`
                    : 'Edita el calendario para asignar una tarifa'}
              </small>
            </div>
            {pendingLoading ? (
              <div className="financial-metric">
                <span>Servicios pendientes</span>
                <strong>Calculando...</strong>
                <small>Revisa en unos segundos</small>
              </div>
            ) : (
              <div className={`financial-metric ${pendingServices[stat.professionalId]?.count ? 'financial-metric--alert' : ''}`}>
                <span>Servicios pendientes</span>
                <strong>{pendingServices[stat.professionalId]?.count ?? 0}</strong>
                <small>
                  {pendingServices[stat.professionalId]?.count
                    ? `Ejemplos: ${pendingServices[stat.professionalId]?.examples.join(', ')}`
                    : 'Todo completado en este período'}
                </small>
              </div>
            )}
            <div className="financial-metric">
              <span>Último mes</span>
              <strong>{formatCurrency(lastFilteredDisplay?.amount || 0, stat.currency || 'EUR')}</strong>
              <small>
                {(lastFilteredDisplay?.label ?? 'Sin datos')} ·{' '}
                {lastFilteredDisplay?.events ?? 0} servicios
              </small>
            </div>
          </div>
        </div>

        <div className="financial-professional-card__chart">
          <div className="financial-chart">
            {monthlySeries.map(month => {
              let height = 8;
              if (maxValue > 0) {
                const calculatedHeight = (month.valueForChart / maxValue) * 100;
                // Si hay datos, mínimo 50%; si no hay datos, mínimo 6%
                height = month.valueForChart > 0 ? Math.max(50, calculatedHeight) : 6;
              }
              const amountLabel = formatCurrency(month.amount, stat.currency || 'EUR');
              return (
                <div
                  key={`${stat.professionalId}-${month.label}`}
                  className={`financial-chart__column ${activeMonthKeys.has(month.monthKey) ? 'financial-chart__column--active' : ''}`}
                >
                  <div
                    className="financial-chart__bar"
                    style={{ height: `${height}%` }}
                    data-amount={amountLabel}
                    data-hours={month.hours.toFixed(2)}
                  />
                  <span className="financial-chart__label">{month.label}</span>
                </div>
              );
            })}
          </div>
          <div className="financial-professional-card__legend">
            <div>
              <span className="legend-dot legend-dot--amount" />
              <span>Importe mensual</span>
            </div>
            <div>
              <span className="legend-dot legend-dot--hours" />
              <span>Horas registradas</span>
            </div>
          </div>
          <div className="financial-history">
            <h5>Histórico del período</h5>
            {filteredMonths.length === 0 ? (
              <p className="financial-history__empty">Sin movimientos registrados dentro del rango seleccionado.</p>
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

        <div className="financial-professional-card__payout">
          <div className="financial-payout-config">
            <div className="financial-payout-config__header">
              <h5>Configuración de pago</h5>
              {!editing && nextPaymentDate && (
                <span className="financial-payout-config__header-chip">
                  Próximo: {nextPaymentDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </span>
              )}
            </div>
            {editing ? (
              <div className="financial-payout-config__grid">
                <div className="financial-payout-config__field">
                  <label>Frecuencia</label>
                  <select
                    value={paymentType}
                    onChange={(event) => handlePayoutFieldChange(stat.professionalId, 'paymentType', event.target.value as PaymentFrequency)}
                  >
                    {PAYMENT_TYPE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="financial-payout-config__field">
                  <label>Día de pago</label>
                  {paymentType === 'weekly' ? (
                    <select
                      value={paymentDay ?? 5}
                      onChange={(event) => handlePayoutFieldChange(stat.professionalId, 'paymentDay', Number(event.target.value))}
                    >
                      {WEEKDAY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : paymentType === 'daily' ? (
                    <input value="Cada día" readOnly disabled />
                  ) : (
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={paymentDay ?? ''}
                      onChange={(event) => handlePayoutFieldChange(
                        stat.professionalId,
                        'paymentDay',
                        event.target.value === '' ? null : Number(event.target.value)
                      )}
                    />
                  )}
                </div>
                <div className="financial-payout-config__field">
                  <label>Método preferido</label>
                  <select
                    value={preferredMethod}
                    onChange={(event) => handlePayoutFieldChange(stat.professionalId, 'paymentMethod', event.target.value as PaymentMethod)}
                  >
                    {PAYMENT_METHOD_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="financial-payout-config__field">
                  <label>Tarifa vigente</label>
                  <input
                    value={typeof effectiveRate === 'number'
                      ? `${formatCurrency(effectiveRate, stat.currency || 'EUR')}/h`
                      : 'Sin definir'}
                    readOnly
                    disabled
                  />
                  <small>Gestiona la tarifa desde el perfil del profesional.</small>
                </div>
              </div>
            ) : (
              <ul className="financial-payout-config__summary">
                <li>
                  <span>Frecuencia</span>
                  <strong>{getPaymentTypeLabel(paymentType)}</strong>
                </li>
                <li>
                  <span>Calendario</span>
                  <strong>{paymentDayLabel}</strong>
                </li>
                <li>
                  <span>Método preferido</span>
                  <strong>{getPaymentMethodLabel(preferredMethod)}</strong>
                </li>
                <li>
                  <span>Tarifa vigente</span>
                  <strong>
                    {typeof effectiveRate === 'number'
                      ? `${formatCurrency(effectiveRate, stat.currency || 'EUR')}/h`
                      : 'Sin definir'}
                  </strong>
                </li>
              </ul>
            )}
          </div>
          <div className="financial-payout-divider" />
          <div className="financial-payout-field">
            <label htmlFor={`iban-${stat.professionalId}`}>IBAN</label>
            <div className={`financial-payout-field__control ${editing ? '' : 'financial-payout-field__control--readonly'}`}>
              <input
                id={`iban-${stat.professionalId}`}
                value={formValues.iban || ''}
                onChange={(event) => handlePayoutFieldChange(stat.professionalId, 'iban', event.target.value)}
                placeholder="ES00 0000 0000 0000 0000 0000"
                readOnly={!editing}
              />
              <button
                type="button"
                className="financial-copy-button"
                onClick={() => handleCopyValue(formValues.iban, 'IBAN')}
                aria-label="Copiar IBAN"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
          <div className="financial-payout-field">
            <label htmlFor={`bank-${stat.professionalId}`}>Banco / Método</label>
            <div className={`financial-payout-field__control ${editing ? '' : 'financial-payout-field__control--readonly'}`}>
              <input
                id={`bank-${stat.professionalId}`}
                value={formValues.bank || ''}
                onChange={(event) => handlePayoutFieldChange(stat.professionalId, 'bank', event.target.value)}
                placeholder="Banco o plataforma de pago"
                readOnly={!editing}
              />
              <button
                type="button"
                className="financial-copy-button"
                onClick={() => handleCopyValue(formValues.bank, 'Banco')}
                aria-label="Copiar Banco"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
          <div className="financial-payout-field">
            <label htmlFor={`paypal-${stat.professionalId}`}>PayPal / Email</label>
            <div className={`financial-payout-field__control ${editing ? '' : 'financial-payout-field__control--readonly'}`}>
              <input
                id={`paypal-${stat.professionalId}`}
                value={formValues.paypalEmail || ''}
                onChange={(event) => handlePayoutFieldChange(stat.professionalId, 'paypalEmail', event.target.value)}
                placeholder="correo@paypal.com"
                readOnly={!editing}
              />
              <button
                type="button"
                className="financial-copy-button"
                onClick={() => handleCopyValue(formValues.paypalEmail, 'Email de pago')}
                aria-label="Copiar email de pago"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
          <div className="financial-payout-field">
            <label>Fecha último pago</label>
            <p className="financial-readonly-value">
              {displayRecord?.lastPaymentDate ? formatDisplayDate(displayRecord.lastPaymentDate) : 'Sin registrar'}
            </p>
          </div>
          <div className="financial-payout-field">
            <label>Responsable</label>
            <p className="financial-readonly-value">
              {displayRecord?.lastPaymentBy || 'Sin asignar'}
            </p>
          </div>
          <div className="financial-payout-field">
            <label htmlFor={`payment-method-${stat.professionalId}`}>Método registrado</label>
            {editing ? (
              <select
                id={`payment-method-${stat.professionalId}`}
                value={(recordDraft?.paymentMethod ?? displayRecord?.paymentMethod ?? preferredMethod)}
                onChange={(event) => handlePayoutRecordChange(stat.professionalId, 'paymentMethod', event.target.value as PaymentMethod)}
              >
                {PAYMENT_METHOD_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : (
              <p className="financial-readonly-value">
                {displayRecord?.paymentMethod ? getPaymentMethodLabel(displayRecord.paymentMethod) : 'Sin registrar'}
              </p>
            )}
          </div>
          <div className="financial-payout-field">
            <label>Monto registrado</label>
            <p className="financial-readonly-value">
              {typeof displayRecord?.amountPaid === 'number'
                ? formatCurrency(displayRecord.amountPaid, stat.currency || 'EUR')
                : 'Sin registrar'}
            </p>
          </div>
          <div className="financial-payout-field financial-payout-field--textarea">
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
          <div className="financial-payout-field financial-payout-field--textarea">
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
              <p className="financial-readonly-value">
                {displayRecord?.note || 'Sin notas adicionales'}
              </p>
            )}
          </div>
          <div className="financial-cycle-overview">
            <div className="financial-cycle-overview__column">
              <div className="financial-cycle-timeline">
                <h5>Estado de pagos</h5>
                {timelineEntries.length ? (
                  <ul className="financial-cycle-timeline__list">
                    {timelineEntries.map(entry => {
                      const periodLabel = createPeriodLabel(entry.period.start, entry.period.end);
                      const amountLabel = formatCurrency(Math.max(entry.amount ?? 0, 0), stat.currency || 'EUR');
                      const scheduledDate = entry.scheduledDate ? new Date(entry.scheduledDate) : null;
                      const paymentDate = entry.paymentDate ? new Date(entry.paymentDate) : null;
                      const scheduledLabel = formatDateLabel(scheduledDate);
                      const paymentLabel = formatDateLabel(paymentDate);
                      const methodLabel = entry.method ? getPaymentMethodLabel(entry.method) : getPaymentMethodLabel(preferredMethod);
                      const isCurrentEntry = Boolean(entry.isCurrent);
                      const isPaidEntry = entry.status === 'paid';
                      const isPendingEntry = entry.status === 'pending' || entry.status === 'overdue';
                      const zeroBalanceEntry = entry.status === 'clear' || entry.zeroBalance;
                      const canCancelPayment = isPaidEntry && Boolean(relatedCalendar?.payoutRecords?.[entry.period.periodKey]);
                      const statusLabel = (() => {
                        switch (entry.status) {
                          case 'paid':
                            return 'Pagado';
                          case 'overdue':
                            return 'Atrasado';
                          case 'upcoming':
                            return 'Próximo';
                          case 'clear':
                            return 'Sin saldo';
                          default:
                            return zeroBalanceEntry ? 'Sin saldo' : 'Pendiente';
                        }
                      })();
                      const description = (() => {
                        if (isCurrentEntry) {
                          return currentStatusMessage;
                        }
                        if (entry.status === 'paid') {
                          return paymentDate
                            ? `Pagado el ${paymentLabel}${entry.amount ? ` · ${amountLabel}` : ''}`
                            : 'Pago registrado';
                        }
                        if (entry.status === 'overdue') {
                          return `Atrasado desde ${scheduledLabel}`;
                        }
                        if (entry.status === 'upcoming') {
                          return `Programado para ${scheduledLabel}`;
                        }
                        if (zeroBalanceEntry) {
                          return 'Sin saldo pendiente en este período.';
                        }
                        return `Pendiente · Vence ${scheduledLabel}`;
                      })();
                      const itemClassNames = [
                        'financial-cycle-timeline__item',
                        `financial-cycle-timeline__item--${entry.status}`
                      ];
                      if (isCurrentEntry) itemClassNames.push('financial-cycle-timeline__item--current');
                      if (entry.status === 'clear') itemClassNames.push('financial-cycle-timeline__item--clear');
                      if (zeroBalanceEntry && entry.status !== 'clear') itemClassNames.push('financial-cycle-timeline__item--empty');

                      const badgeClassNames = [
                        'financial-cycle-timeline__badge',
                        `financial-cycle-timeline__badge--${entry.status}`
                      ];
                      if (entry.status === 'clear') badgeClassNames.push('financial-cycle-timeline__badge--clear');
                      if (zeroBalanceEntry && entry.status !== 'clear') badgeClassNames.push('financial-cycle-timeline__badge--empty');

                      const showActions = (isPendingEntry && isCurrentEntry && !zeroBalanceEntry) || canCancelPayment;

                      return (
                        <li
                          key={`${stat.professionalId}-timeline-${entry.key}`}
                          className={itemClassNames.join(' ')}
                        >
                          <div className="financial-cycle-timeline__marker" />
                          <div className="financial-cycle-timeline__content">
                            <div className="financial-cycle-timeline__header">
                              <div>
                                <span className="financial-cycle-timeline__period">{periodLabel}</span>
                                <span className="financial-cycle-timeline__amount">{amountLabel}</span>
                              </div>
                              <span className={badgeClassNames.join(' ')}>
                                {statusLabel}
                              </span>
                            </div>
                            <p className="financial-cycle-timeline__description">
                              {description}
                            </p>
                            <div className="financial-cycle-timeline__meta">
                              <span>{methodLabel}</span>
                              {isPaidEntry && paymentDate ? (
                                <span>Pagado: {paymentLabel}</span>
                              ) : null}
                              {!isPaidEntry && !zeroBalanceEntry ? (
                                <span>{entry.status === 'overdue' ? `Vencido: ${scheduledLabel}` : `Vence: ${scheduledLabel}`}</span>
                              ) : null}
                            </div>
                            {showActions ? (
                              <div className="financial-cycle-timeline__actions">
                                {isPendingEntry && isCurrentEntry && !zeroBalanceEntry ? (
                                  <button
                                    type="button"
                                    className="financial-button financial-button--ghost financial-button--compact"
                                    onClick={() => openPaymentActionModal(stat.professionalId, {
                                      amount: entry.amount ?? markAmount,
                                      method: entry.method ?? preferredMethod,
                                      summary: periodLabel
                                    })}
                                    disabled={quickPayDisabled}
                                  >
                                    Registrar pago
                                  </button>
                                ) : null}
                                {canCancelPayment ? (
                                  <button
                                    type="button"
                                    className="financial-button financial-button--ghost financial-button--compact financial-cycle-timeline__undo"
                                    onClick={() => handleCancelPayment(stat.professionalId, entry.period.periodKey)}
                                    disabled={isMarking}
                                  >
                                    Deshacer pago
                                  </button>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="financial-cycle-timeline__empty">Aún no hay datos de pagos para este profesional.</p>
                )}
                {nextPeriodMessage && (
                  <p className="financial-cycle-timeline__hint">{nextPeriodMessage}</p>
                )}
              </div>
            </div>
            <div className="financial-cycle-overview__column financial-cycle-overview__column--calendar">
              <div className="financial-cycle-calendar">
                <div className="financial-cycle-calendar__header">
                  <h5>Calendario del ciclo</h5>
                  <span>{calendarHeaderLabel}</span>
                </div>
                <div className="financial-cycle-calendar__weekdays">
                  {WEEKDAY_SHORT_LABELS.map(label => (
                    <span key={`${stat.professionalId}-weekday-${label}`} className="financial-cycle-calendar__weekday">
                      {label}
                    </span>
                  ))}
                </div>
                <div className="financial-cycle-calendar__grid">
                  {calendarDays.map(day => (
                    <div
                      key={`${stat.professionalId}-calendar-${day.iso}`}
                      className={day.className}
                      data-tooltip={day.tooltip}
                    >
                      {day.date.getDate()}
                    </div>
                  ))}
                </div>
                <div className="financial-cycle-calendar__legend">
                  <span className="financial-cycle-calendar__legend-item">
                    <span className="financial-cycle-calendar__bullet financial-cycle-calendar__bullet--period" />
                    Ciclo actual
                  </span>
                  <span className="financial-cycle-calendar__legend-item">
                    <span className="financial-cycle-calendar__bullet financial-cycle-calendar__bullet--payment" />
                    Pago realizado
                  </span>
                  <span className="financial-cycle-calendar__legend-item">
                    <span className="financial-cycle-calendar__bullet financial-cycle-calendar__bullet--due" />
                    Pago pendiente
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="financial-professional-card__actions">
          <small>
            Estos datos se guardan en el calendario del profesional. Úsalos al procesar transferencias.
          </small>
          <div className="financial-professional-card__action-buttons">
            <button
              type="button"
              className="financial-button financial-button--primary financial-button--with-icon financial-button--compact"
              onClick={() => openPaymentActionModal(stat.professionalId, {
                amount: markAmount,
                method: preferredMethod,
                summary: periodRangeLabel ?? paymentContext?.currentPeriod?.label ?? undefined
              })}
              disabled={quickPayDisabled}
            >
              <CheckCircle size={16} />
              Registrar pago
            </button>
            {editing ? (
              <>
                <button
                  type="button"
                  className="financial-button financial-button--ghost financial-button--with-icon financial-button--compact"
                  onClick={() => handleCancelPayoutEdit(stat.professionalId)}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="financial-button financial-button--ghost financial-button--with-icon financial-button--compact"
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
                className="financial-button financial-button--ghost financial-button--with-icon financial-button--compact"
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
  }, [calendarMap, selectedYear, payoutDrafts, savingPayout, editingPayout, payoutRecordDrafts, handlePayoutRecordChange, pendingLoading, pendingServices, handlePayoutFieldChange, handleCopyValue, handleCancelPayoutEdit, handleSavePayout, handleTogglePayoutEdit, handleQuickMarkAsPaid, getCalendarPaymentContext, markingPayout, periodKey, stats, annualStats])

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

  const exportWithdrawalsToCSV = useCallback(() => {
    if (!withdrawals.length) {
      toast.info('No hay retiros para exportar');
      return;
    }

    try {
      const headers = ['Fecha', 'Importe Bruto', 'Comisión', 'Importe Neto', 'Notas'];
      const rows = withdrawals.map(w => [
        new Date(w.date).toLocaleDateString('es-ES'),
        w.grossAmount,
        w.commission,
        w.netAmount,
        `"${w.note || ''}"`
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `retiros-plataforma-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Retiros exportados correctamente');
    } catch (error) {
      console.error('Error exportando retiros:', error);
      toast.error('No pudimos exportar los retiros');
    }
  }, [withdrawals]);

  const exportInvoicesToCSV = useCallback(() => {
    if (!invoices.length) {
      toast.info('No hay facturas para exportar');
      return;
    }

    try {
      const headers = ['Cliente', 'Referencia', 'Importe', 'Moneda', 'Estado', 'Fecha Emisión', 'Fecha Vencimiento', 'Notas'];
      const rows = invoices.map(inv => [
        `"${inv.clientName}"`,
        `"${inv.reference || ''}"`,
        inv.amount,
        inv.currency,
        inv.status.toUpperCase(),
        new Date(inv.issueDate).toLocaleDateString('es-ES'),
        inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('es-ES') : '',
        `"${inv.notes || ''}"`
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facturas-externas-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Facturas exportadas correctamente');
    } catch (error) {
      console.error('Error exportando facturas:', error);
      toast.error('No pudimos exportar las facturas');
    }
  }, [invoices]);

  const exportDetailedReport = useCallback(() => {
    if (!stats.length) {
      toast.info('No hay información que exportar todavía');
      return;
    }

    try {
      const headers = ['Profesional', 'Moneda', 'Mes', 'Importe', 'Horas', 'Eventos', 'Tarifa/Hora'];
      const rows: string[] = [];

      stats.forEach(stat => {
        stat.monthlyBreakdown.forEach(month => {
          rows.push([
            `"${stat.professionalName}"`,
            stat.currency,
            MONTH_LABELS[month.month - 1] || month.month,
            month.amount,
            month.hours,
            month.events,
            stat.hourlyRate
          ].join(','));
        });
      });

      const csvContent = [
        headers.join(','),
        ...rows
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-detallado-${selectedYear}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Reporte detallado exportado correctamente');
    } catch (error) {
      console.error('Error exportando reporte:', error);
      toast.error('No pudimos exportar el reporte');
    }
  }, [selectedYear, stats]);

  if (planLoading || loadingCalendars) {
    return (
      <div className="financial-page">
        <div className="financial-container financial-container--center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!paymentsEnabled) {
    return (
      <div className="financial-page">
        <div className="financial-container financial-container--center">
          <div className="financial-card financial-card--compact">
            <div className="financial-card__icon financial-card__icon--gradient">
              <Wallet size={26} />
            </div>
            <h2 className="financial-card__title">Consola económica disponible en planes PRO y BUSINESS</h2>
            <p className="financial-card__subtitle">
              Visualiza lo que debes pagar a cada profesional, su acumulado por mes y exporta reportes listos para contabilidad.
            </p>
            <Link to="/dashboard/settings" className="financial-button financial-button--primary">
              Ver planes disponibles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (calendars.length === 0) {
    return (
      <div className="financial-page">
        <div className="financial-container financial-container--center">
          <div className="financial-card financial-card--compact">
            <div className="financial-card__icon financial-card__icon--warning">
              <AlertCircle size={26} />
            </div>
            <h2 className="financial-card__title">No encontramos profesionales asignados</h2>
            <p className="financial-card__subtitle">
              Crea calendarios profesionales desde el panel de horarios para empezar a calcular el acumulado de pagos.
            </p>
            <Link to="/dashboard/horas" className="financial-button financial-button--primary financial-button--with-icon">
              Ir a horarios
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`financial-dashboard ${selectedProfessional ? 'financial-dashboard--drawer-open' : ''}`}>
      <section className="financial-hero">
        <div className="financial-hero__top">
          <div className="financial-hero__copy">
            <span className="financial-hero__eyebrow">Gestor financiero</span>
            <h1>Gestor financiero</h1>
            <p>Centraliza nómina, ingresos y obligaciones del equipo con una vista clara y accionable.</p>
            <div className="financial-hero__meta">
              <span>{statsForDisplay.length} profesionales activos</span>
              <span>{upcomingWithinWeek} pagos en los próximos 7 días</span>
            </div>
          </div>
          <div className="financial-hero__actions">
            <button
              type="button"
              className="financial-button financial-button--ghost"
              onClick={exportPendingToCSV}
              disabled={!hasPendingProfessionals}
            >
              <Download size={16} />
              Pendientes CSV
            </button>
            <button
              type="button"
              className="financial-button financial-button--ghost"
              onClick={exportToCSV}
              disabled={!stats.length}
            >
              <Download size={16} />
              Resumen CSV
            </button>
            <button
              type="button"
              className="financial-button financial-button--primary"
              onClick={exportDetailedReport}
              disabled={!stats.length}
            >
              <BarChart3 size={16} />
              Reporte detallado
            </button>
          </div>
        </div>
        <div className="financial-hero__controls">
          <div className="financial-control">
            <label>Ejercicio</label>
            <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="financial-control financial-control--segmented">
            <label>Periodo</label>
            <div className="financial-segmented">
              {[{ value: 'year', label: 'Año' }, { value: 'quarter', label: 'Trimestre' }, { value: 'month', label: 'Mes' }, { value: 'payment', label: 'Ciclo' }].map(option => (
                <button
                  type="button"
                  key={option.value}
                  className={`financial-segmented__option ${period === option.value ? 'is-active' : ''}`}
                  onClick={() => setPeriod(option.value as typeof period)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {period === 'quarter' && (
            <div className="financial-control">
              <label>Trimestre</label>
              <select value={selectedQuarter} onChange={(event) => setSelectedQuarter(Number(event.target.value))}>
                {[1, 2, 3, 4].map(quarter => (
                  <option key={quarter} value={quarter}>{`T${quarter}`}</option>
                ))}
              </select>
            </div>
          )}
          {period === 'month' && (
            <div className="financial-control">
              <label>Mes</label>
              <select value={selectedMonth} onChange={(event) => setSelectedMonth(Number(event.target.value))}>
                {MONTH_LABELS.map((label, index) => (
                  <option key={label} value={index}>{label}</option>
                ))}
              </select>
            </div>
          )}
          <label className="financial-switch">
            <input
              type="checkbox"
              checked={onlyCompleted}
              onChange={(event) => setOnlyCompleted(event.target.checked)}
            />
            <span>Solo servicios completados</span>
          </label>
          <label className="financial-switch">
            <input
              type="checkbox"
              checked={showPendingOnly}
              onChange={(event) => setShowPendingOnly(event.target.checked)}
            />
            <span>Mostrar sólo pendientes</span>
          </label>
        </div>
      </section>

      <section className="financial-summary">
        <div className="financial-summary__grid">
          {summaryMetrics.map(metric => {
            const Icon = metric.icon;
            return (
              <article key={metric.label} className="financial-summary__card">
                <div className="financial-summary__icon">
                  <Icon size={18} />
                </div>
                <div>
                  <span className="financial-summary__label">{metric.label}</span>
                  <strong className="financial-summary__value">{metric.value}</strong>
                  <small className="financial-summary__helper">{metric.helper}</small>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className={`financial-layout ${selectedProfessional ? 'financial-layout--drawer-open' : ''}`}>
        <div className="financial-layout__main">
          <section className="financial-card financial-card--table">
            <header className="financial-card__header">
              <div>
                <h2>Pagos del equipo</h2>
                <p>Estado del ciclo actual para cada profesional.</p>
              </div>
            </header>
            {displayStats.length ? (
              <div className="financial-table">
                <div className="financial-table__head">
                  <span>Profesional</span>
                  <span>Periodo</span>
                  <span>Estado</span>
                  <span>Importe</span>
                  <span>Próximo pago</span>
                  <span></span>
                </div>
                {displayStats.map(statContainer => {
                  const { base: stat, filteredAmount, paymentPeriod } = statContainer;
                  const context = getCalendarPaymentContext(stat.professionalId);
                  if (!context) {
                    return null;
                  }
                  const recordDraft = payoutRecordDrafts[stat.professionalId];
                  const periodKeyForRecord = context.currentPeriod.periodKey;
                  const currentRecord = context.calendar?.payoutRecords?.[periodKeyForRecord];
                  const recordStatus = recordDraft?.status ?? currentRecord?.status ?? 'pending';
                  const rawAmount = recordStatus === 'paid'
                    ? 0
                    : typeof context.amountForPeriod === 'number'
                      ? context.amountForPeriod
                      : typeof filteredAmount === 'number'
                        ? filteredAmount
                        : 0;
                  const pendingAmount = Math.max(rawAmount, 0);
                  const nextPaymentDate = context.nextCycleEnd
                    ? normalizeDate(context.nextCycleEnd)
                    : addDays(context.currentPeriod.end, (context.intervalDays ?? getIntervalDays(context.paymentType)) - 1);
                  let statusVariant: 'pending' | 'paid' | 'overdue' | 'upcoming' | 'clear' = calculateStatusVariant(recordStatus, nextPaymentDate);
                  if (pendingAmount <= 0.009 && recordStatus !== 'paid') {
                    statusVariant = 'clear';
                  }
                  const statusLabel = statusVariant === 'paid'
                    ? 'Pagado'
                    : statusVariant === 'overdue'
                      ? 'Atrasado'
                      : statusVariant === 'upcoming'
                        ? 'Próximo'
                        : statusVariant === 'clear'
                          ? 'Sin saldo'
                          : 'Pendiente';
                  const dueLabel = nextPaymentDate ? nextPaymentDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'Sin fecha';
                  const relativeDue = nextPaymentDate ? formatRelativeDate(nextPaymentDate) : 'Sin programación';
                  const owner = calendarMap.get(stat.professionalId)?.members?.find(member => member.role === 'owner');
                  return (
                    <div
                      key={stat.professionalId}
                      className={`financial-table__row ${selectedProfessionalId === stat.professionalId ? 'is-active' : ''}`}
                      onClick={() => setSelectedProfessionalId(stat.professionalId)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="financial-table__cell financial-table__cell--name">
                        <strong>{stat.professionalName || 'Profesional'}</strong>
                        <small>{owner?.email || stat.professionalEmail || 'Sin email'}</small>
                      </div>
                      <div className="financial-table__cell">
                        <span>{context.currentPeriod?.label ?? paymentPeriod?.label ?? 'Sin período'}</span>
                      </div>
                      <div className="financial-table__cell">
                        <span className={`financial-status financial-status--${statusVariant}`}>{statusLabel}</span>
                      </div>
                      <div className="financial-table__cell">
                        <strong>{formatCurrency(pendingAmount, stat.currency || 'EUR')}</strong>
                        <small>{Math.max(context.hoursForPeriod ?? 0, 0).toFixed(1)} h</small>
                      </div>
                      <div className="financial-table__cell">
                        <strong>{dueLabel}</strong>
                        <small>{relativeDue}</small>
                      </div>
                      <div className="financial-table__cell financial-table__cell--actions">
                        {recordStatus !== 'paid' && (
                          <button
                            type="button"
                            className="financial-link"
                            onClick={(event) => {
                              event.stopPropagation();
                              openPaymentActionModal(stat.professionalId, {
                                amount: pendingAmount,
                                method: context.preferredMethod,
                                summary: context.currentPeriod?.label ?? paymentPeriod?.label ?? undefined
                              });
                            }}
                          >
                            Registrar pago
                          </button>
                        )}
                        <button
                          type="button"
                          className="financial-link financial-link--ghost"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedProfessionalId(stat.professionalId);
                          }}
                        >
                          Ver detalle
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="financial-empty">No hay profesionales para el filtro seleccionado.</p>
            )}
          </section>

          <section className="financial-card">
            <header className="financial-card__header">
              <div>
                <h2>Próximos desembolsos</h2>
                <p>Pagos calendarizados con método preferido.</p>
              </div>
            </header>
            {scheduledPayments.length ? (
              <ul className="financial-list">
                {scheduledPayments.slice(0, 8).map(item => (
                  <li key={`${item.professionalId}-${item.nextDate.toISOString()}`} className={`financial-list__item ${item.isPending ? 'is-pending' : 'is-paid'}`}>
                    <div>
                      <strong>{item.professionalName}</strong>
                      <small>{item.paymentDayLabel}</small>
                    </div>
                    <div>
                      <span>{item.nextDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                      <small>{item.relativeLabel}</small>
                    </div>
                    <div className="financial-list__meta">
                      <strong>{formatCurrency(item.pendingAmount, item.currency)}</strong>
                      <small>{getPaymentMethodLabel(item.paymentMethod)}</small>
                    </div>
                    {item.isPending && (
                      <button
                        type="button"
                        className="financial-link"
                        onClick={() => openPaymentActionModal(item.professionalId, {
                          amount: item.pendingAmount,
                          method: item.paymentMethod,
                          summary: item.periodRangeLabel ?? undefined
                        })}
                      >
                        Registrar
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="financial-empty">No hay pagos programados para los próximos días.</p>
            )}
          </section>

          <section className="financial-card">
            <header className="financial-card__header">
              <div>
                <h2>Ingresos y facturación</h2>
                <p>Retiros de plataforma y facturas manuales.</p>
              </div>
            </header>
            <div className="financial-income-summary">
              <article className="financial-summary-mini">
                <div className="financial-summary-mini__icon">
                  <DollarSign size={18} />
                </div>
                <div>
                  <span>Netos recibidos</span>
                  <strong>{formatCurrency(withdrawalSummary.totalNet, primaryCurrency)}</strong>
                  <small>{withdrawals.length} retiros registrados</small>
                </div>
              </article>
              <article className="financial-summary-mini">
                <div className="financial-summary-mini__icon">
                  <FileText size={18} />
                </div>
                <div>
                  <span>Facturación externa</span>
                  <strong>{formatCurrency(invoiceSummary.total + externalClientsSummary.totalAmount, invoices[0]?.currency || primaryCurrency)}</strong>
                  <small>{invoices.length} facturas · {externalClientsSummary.clientsCount} clientes CRM</small>
                </div>
              </article>
            </div>
            <div className="financial-segmented financial-segmented--secondary">
              <button
                type="button"
                className={`financial-segmented__option ${incomeTab === 'platform' ? 'is-active' : ''}`}
                onClick={() => setIncomeTab('platform')}
              >
                Plataforma
              </button>
              <button
                type="button"
                className={`financial-segmented__option ${incomeTab === 'external' ? 'is-active' : ''}`}
                onClick={() => setIncomeTab('external')}
              >
                Clientes externos
              </button>
            </div>
            {incomeTab === 'platform' ? (
              <div className="financial-income-grid">
                <form className="financial-form" onSubmit={handleCreateWithdrawal}>
                  <div className="financial-form__header">
                    <h4>Registrar retiro</h4>
                  </div>
                  <div className="financial-form__row">
                    <label>
                      Fecha
                      <input
                        type="date"
                        value={withdrawalForm.date}
                        onChange={(event) => setWithdrawalForm(form => ({ ...form, date: event.target.value }))}
                        required
                      />
                    </label>
                    <label>
                      Monto bruto
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={withdrawalForm.grossAmount}
                        onChange={(event) => setWithdrawalForm(form => ({ ...form, grossAmount: event.target.value }))}
                        required
                      />
                    </label>
                    <label>
                      Comisión
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={withdrawalForm.commission}
                        onChange={(event) => setWithdrawalForm(form => ({ ...form, commission: event.target.value }))}
                      />
                    </label>
                  </div>
                  <div className="financial-form__row">
                    <label className="financial-form__full">
                      Nota interna
                      <input
                        type="text"
                        value={withdrawalForm.note}
                        onChange={(event) => setWithdrawalForm(form => ({ ...form, note: event.target.value }))}
                        placeholder="Banco, referencia o nota de control"
                      />
                    </label>
                  </div>
                  <div className="financial-form__footer">
                    <span>Neto estimado: <strong>{formatCurrency(withdrawalNetPreview, primaryCurrency)}</strong></span>
                    <button
                      type="submit"
                      className="financial-button financial-button--primary"
                      disabled={createWithdrawal.isPending}
                    >
                      <PlusCircle size={16} />
                      {createWithdrawal.isPending ? 'Guardando...' : 'Registrar retiro'}
                    </button>
                  </div>
                </form>
                <div className="financial-list financial-list--vertical">
                  <header className="financial-list__header">
                    <h4>Historial de retiros</h4>
                    <span>{withdrawals.length} registros</span>
                  </header>
                  {withdrawalsLoading ? (
                    <div className="financial-list__loading">
                      <LoadingSpinner />
                    </div>
                  ) : withdrawals.length === 0 ? (
                    <p className="financial-empty">Aún no registras retiros de plataforma.</p>
                  ) : (
                    <ul>
                      {withdrawals.map(withdrawal => (
                        <li key={withdrawal.id} className="financial-list__item">
                          <div>
                            <strong>{formatCurrency(withdrawal.netAmount, primaryCurrency)}</strong>
                            <small>{withdrawal.date.toLocaleDateString('es-ES')}</small>
                          </div>
                          <div className="financial-list__meta">
                            <span>Bruto {formatCurrency(withdrawal.grossAmount, primaryCurrency)}</span>
                            <span>Comisión {formatCurrency(withdrawal.commission, primaryCurrency)}</span>
                          </div>
                          {withdrawal.note && <p>{withdrawal.note}</p>}
                          <button
                            type="button"
                            className="financial-link financial-link--danger"
                            onClick={() => handleDeleteWithdrawal(withdrawal.id)}
                            disabled={deleteWithdrawal.isPending}
                          >
                            <Trash2 size={14} />
                            Eliminar
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <div className="financial-income-grid">
                <div className="financial-list financial-list--vertical">
                  <header className="financial-list__header">
                    <h4>Clientes CRM</h4>
                    <span>{externalClientsSummary.clientsCount} activos</span>
                  </header>
                  {externalClientsLoading ? (
                    <div className="financial-list__loading">
                      <LoadingSpinner />
                    </div>
                  ) : externalClients.length === 0 ? (
                    <p className="financial-empty">Sin clientes externos registrados.</p>
                  ) : (
                    <ul>
                      {externalClients.map(client => (
                        <li key={client.id} className="financial-list__item">
                          <div>
                            <strong>{client.name}</strong>
                            <small>{formatCurrency(client.totalAmount ?? 0, client.currency || primaryCurrency)} · {(client.totalHours ?? 0).toFixed(1)} h</small>
                          </div>
                          <Link className="financial-link financial-link--ghost" to={client.url ?? '/dashboard/clientes'}>
                            Ver cliente
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <form className="financial-form" onSubmit={handleCreateInvoice}>
                  <div className="financial-form__header">
                    <h4>Registrar factura manual</h4>
                  </div>
                  <div className="financial-form__row">
                    <label>
                      Cliente
                      <input
                        type="text"
                        value={invoiceForm.clientName}
                        onChange={(event) => setInvoiceForm(form => ({ ...form, clientName: event.target.value }))}
                        required
                      />
                    </label>
                    <label>
                      Monto
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={invoiceForm.amount}
                        onChange={(event) => setInvoiceForm(form => ({ ...form, amount: event.target.value }))}
                        required
                      />
                    </label>
                  </div>
                  <div className="financial-form__row">
                    <label>
                      Fecha de emisión
                      <input
                        type="date"
                        value={invoiceForm.issueDate}
                        onChange={(event) => setInvoiceForm(form => ({ ...form, issueDate: event.target.value }))}
                        required
                      />
                    </label>
                    <label>
                      Fecha vencimiento
                      <input
                        type="date"
                        value={invoiceForm.dueDate}
                        onChange={(event) => setInvoiceForm(form => ({ ...form, dueDate: event.target.value }))}
                      />
                    </label>
                  </div>
                  <div className="financial-form__row">
                    <label className="financial-form__full">
                      Notas
                      <input
                        type="text"
                        value={invoiceForm.notes}
                        onChange={(event) => setInvoiceForm(form => ({ ...form, notes: event.target.value }))}
                      />
                    </label>
                  </div>
                  <div className="financial-form__footer">
                    <button
                      type="submit"
                      className="financial-button financial-button--primary"
                      disabled={createInvoice.isPending}
                    >
                      <PlusCircle size={16} />
                      {createInvoice.isPending ? 'Guardando...' : 'Registrar factura'}
                    </button>
                  </div>
                </form>
              </div>
          )}
        </section>
      </div>
      <div
        className={`financial-detail-overlay ${selectedProfessional ? 'is-visible' : ''}`}
        onClick={() => setSelectedProfessionalId(null)}
      />

      <aside
        className={`financial-detail-drawer ${selectedProfessional ? 'is-open' : ''}`}
        aria-hidden={!selectedProfessional}
        aria-label="Detalle profesional"
      >
        <button
          type="button"
          className="financial-detail-drawer__tag"
          disabled
        >
          {selectedProfessional ? `Detalle · ${selectedProfessional.base.professionalName}` : 'Detalle profesional'}
        </button>
        <div className="financial-detail-drawer__body">
          {selectedProfessional ? (
            <div className="financial-detail__content">
              {renderProfessionalDetail(selectedProfessional)}
            </div>
          ) : (
            <p className="financial-empty">Selecciona un profesional en la tabla para ver su detalle.</p>
          )}
        </div>
      </aside>
      </div>

      {paymentActionState.open && (
        <div className="financial-action-modal">
          <div
            className="financial-action-modal__backdrop"
            onClick={() => {
              if (!modalLoading) {
                closePaymentActionModal();
              }
            }}
          />
          <div className="financial-action-modal__content">
            <header className="financial-action-modal__header">
              <h3>Registrar pago</h3>
              <p>
                {actionPeriodLabel ? `Período ${actionPeriodLabel}` : 'Período actual'} ·{' '}
                {actionDueDate ? `Día habitual ${actionDueLabel}` : 'Sin fecha programada'}
              </p>
            </header>
            <div className="financial-action-modal__body">
              <div className="financial-action-modal__info">
                <div>
                  <span className="financial-action-modal__label">Monto estimado</span>
                  <strong>{actionAmountLabel ?? 'Calculamos cuando registres el pago'}</strong>
                </div>
                <div>
                  <span className="financial-action-modal__label">Método preferido</span>
                  <strong>{actionPaymentMethodLabel ?? 'Sin registrar'}</strong>
                </div>
              </div>
              <div className="financial-action-modal__option">
                <label className="financial-action-modal__checkbox">
                  <input
                    type="checkbox"
                    checked={preserveScheduledDate}
                    onChange={(event) => setPreserveScheduledDate(event.target.checked)}
                  />
                  <span>
                    Mantener fecha habitual
                    {maintainedNextStartLabel ? ` (próximo ciclo ${maintainedNextStartLabel})` : ''}
                  </span>
                </label>
                <small className="financial-action-modal__hint">
                  Si lo desmarcas, el siguiente ciclo comenzará el {adjustedNextStartLabel}.
                </small>
              </div>
              <div className="financial-action-modal__actions">
                <button
                  type="button"
                  className="financial-button financial-button--primary financial-button--with-icon"
                  onClick={handleConfirmPaymentNow}
                  disabled={modalLoading}
                >
                  <CheckCircle size={16} />
                  {modalLoading ? 'Guardando...' : `Pagar hoy (${todayLabel})`}
                </button>
                <div className="financial-action-modal__schedule">
                  <label htmlFor="financial-schedule-date">Programar para</label>
                  <div className="financial-action-modal__schedule-input">
                    <input
                      id="financial-schedule-date"
                      type="date"
                      value={customPaymentDate}
                      onChange={(event) => setCustomPaymentDate(event.target.value)}
                      disabled={modalLoading}
                    />
                    <button
                      type="button"
                      className="financial-button financial-button--ghost"
                      onClick={handleConfirmScheduledPayment}
                      disabled={modalLoading}
                    >
                      {modalLoading ? 'Guardando...' : 'Guardar programación'}
                    </button>
                  </div>
                  <small>El sistema notificará cuando llegue esta fecha.</small>
                </div>
              </div>
            </div>
            <footer className="financial-action-modal__footer">
              <button
                type="button"
                className="financial-button financial-button--ghost"
                onClick={closePaymentActionModal}
                disabled={modalLoading}
              >
                Cancelar
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardStripe;
