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
  X
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
import { useWorkHoursByPeriod, useWorkHoursByPeriodTotals } from '@/hooks/useWorkHoursByPeriod';

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
  daily: 'payments-badge--daily',
  weekly: 'payments-badge--weekly',
  biweekly: 'payments-badge--biweekly',
  monthly: 'payments-badge--monthly'
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
  customHourlyRate?: number | null;
};

type PayoutRecordDraft = {
  status: 'pending' | 'paid';
  lastPaymentDate?: string;
  lastPaymentBy?: string;
  note?: string;
  paymentMethod?: PaymentMethod;
  amountPaid?: number;
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

const getLatestPaymentRecord = (payoutRecords?: Record<string, { lastPaymentDate?: string }>) => {
  if (!payoutRecords) return null;
  let latest: { periodKey: string; lastPaymentDate: string } | null = null;
  Object.entries(payoutRecords).forEach(([periodKey, record]) => {
    if (!record?.lastPaymentDate) return;
    const currentDate = new Date(record.lastPaymentDate);
    if (Number.isNaN(currentDate.getTime())) return;
    if (!latest) {
      latest = { periodKey, lastPaymentDate: record.lastPaymentDate };
      return;
    }
    const latestDate = new Date(latest.lastPaymentDate);
    if (currentDate.getTime() > latestDate.getTime()) {
      latest = { periodKey, lastPaymentDate: record.lastPaymentDate };
    }
  });
  return latest;
};

const getRecentPayments = (
  payoutRecords?: Record<string, {
    lastPaymentDate?: string;
    lastPaymentBy?: string;
    note?: string;
    paymentMethod?: PaymentMethod;
    amountPaid?: number;
  }>
) => {
  if (!payoutRecords) return [];
  return Object.entries(payoutRecords)
    .filter(([, record]) => Boolean(record?.lastPaymentDate))
    .sort((a, b) => {
      const dateA = a[1]?.lastPaymentDate ? new Date(a[1].lastPaymentDate as string).getTime() : 0;
      const dateB = b[1]?.lastPaymentDate ? new Date(b[1].lastPaymentDate as string).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3)
    .map(([periodKey, record]) => ({
      periodKey,
      lastPaymentDate: record?.lastPaymentDate ?? '',
      lastPaymentBy: record?.lastPaymentBy,
      note: record?.note,
      paymentMethod: record?.paymentMethod,
      amountPaid: record?.amountPaid
    }));
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

const getNextPaymentDate = (
  now: Date,
  paymentType: PaymentFrequency,
  paymentDay: number | null | undefined,
  latestPaymentDate?: string
) => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const latestDate = latestPaymentDate ? new Date(latestPaymentDate) : null;
  if (latestDate) {
    latestDate.setHours(0, 0, 0, 0);
  }

  if (paymentType === 'daily') {
    if (latestDate && latestDate.getTime() === today.getTime()) {
      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() + 1);
      return nextDay;
    }
    return today;
  }

  if (paymentType === 'weekly') {
    const targetWeekday = typeof paymentDay === 'number' ? paymentDay : 5; // default Friday
    const currentWeekday = today.getDay();
    let delta = targetWeekday - currentWeekday;
    if (delta < 0) delta += 7;
    const candidate = new Date(today);
    candidate.setDate(today.getDate() + delta);
    if (latestDate && latestDate.getTime() === candidate.getTime()) {
      candidate.setDate(candidate.getDate() + 7);
    }
    return candidate;
  }

  const baseDay = normalizePaymentDay(paymentDay, 1);
  if (paymentType === 'monthly') {
    const candidate = new Date(today.getFullYear(), today.getMonth(), clampDayOfMonth(baseDay, today));
    if (candidate.getTime() < today.getTime()) {
      candidate.setMonth(candidate.getMonth() + 1);
      candidate.setDate(clampDayOfMonth(baseDay, candidate));
    }
    if (latestDate && latestDate.getTime() === candidate.getTime()) {
      candidate.setMonth(candidate.getMonth() + 1);
      candidate.setDate(clampDayOfMonth(baseDay, candidate));
    }
    return candidate;
  }

  // biweekly
  const candidate = new Date(today.getFullYear(), today.getMonth(), clampDayOfMonth(baseDay, today));
  const secondCandidate = new Date(candidate);
  secondCandidate.setDate(candidate.getDate() + 14);

  let nextCandidate = candidate;
  if (nextCandidate.getTime() < today.getTime()) {
    if (secondCandidate.getTime() >= today.getTime()) {
      nextCandidate = secondCandidate;
    } else {
      // move to next month
      nextCandidate = new Date(today.getFullYear(), today.getMonth() + 1, clampDayOfMonth(baseDay, new Date(today.getFullYear(), today.getMonth() + 1, 1)));
    }
  }

  if (latestDate && latestDate.getTime() === nextCandidate.getTime()) {
    nextCandidate = new Date(nextCandidate.getFullYear(), nextCandidate.getMonth(), nextCandidate.getDate() + 14);
  }

  return nextCandidate;
};

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

  const [activeTab, setActiveTab] = useState<'calendar' | 'income' | 'stats' | 'alerts' | 'export'>('calendar');
  const [incomeTab, setIncomeTab] = useState<'platform' | 'external'>('platform');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [onlyCompleted, setOnlyCompleted] = useState(true);
  const [period, setPeriod] = useState<'year' | 'quarter' | 'month' | 'payment'>('year');
  const [selectedQuarter, setSelectedQuarter] = useState(() => Math.floor((new Date().getMonth()) / 3) + 1);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [payoutDrafts, setPayoutDrafts] = useState<Record<string, PayoutDraft>>({});
  const [savingPayout, setSavingPayout] = useState<Record<string, boolean>>({});
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

  // Mini calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Sidebar filter states
  const [sidebarFilters, setSidebarFilters] = useState({
    dateRange: 'all' as 'all' | 'week' | 'month' | 'year',
    status: 'all' as 'all' | 'pending' | 'paid',
    paymentMethod: 'all' as 'all' | PaymentMethod,
    searchTerm: ''
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Collapsible sections state
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [isProfessionalsSidebarCollapsed, setIsProfessionalsSidebarCollapsed] = useState(false);
  const [isHeaderControlsExpanded, setIsHeaderControlsExpanded] = useState(false);

  // ✅ REACT QUERY: Reemplaza loadStats manual con hook optimizado
  const { data: stats = [], isLoading: statsLoading, dataUpdatedAt } = usePaymentStats(
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

  const scheduledPayments = useMemo(() => {
    const now = new Date();
    return displayStats
      .map(({ base: stat }) => {
        const calendar = calendarMap.get(stat.professionalId);
        if (!calendar) return null;
        const details = (calendar as any)?.payoutDetails ?? {};
        const paymentType: PaymentFrequency = details?.paymentType ?? 'monthly';
        const paymentDay = typeof details?.paymentDay === 'number' ? details.paymentDay : null;
        const preferredMethod: PaymentMethod = details?.paymentMethod ?? 'transfer';
        const latestRecord = getLatestPaymentRecord(calendar?.payoutRecords);
        const nextDate = getNextPaymentDate(new Date(now), paymentType, paymentDay, latestRecord?.lastPaymentDate);
        if (!nextDate) return null;

        return {
          professionalId: stat.professionalId,
          professionalName: stat.professionalName,
          paymentType,
          paymentDay,
          paymentMethod: preferredMethod,
          nextDate,
          relativeLabel: formatRelativeDate(nextDate, now),
          paymentDayLabel: getPaymentDayDescription(paymentType, paymentDay)
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
      } => Boolean(item))
      .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
  }, [displayStats, calendarMap]);

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

  const invoiceStatusStats = useMemo(() => {
    return INVOICE_STATUS_OPTIONS.map(option => ({
      value: option.value,
      label: option.label,
      amount: invoiceSummary.byStatus[option.value] ?? 0
    }));
  }, [invoiceSummary]);

  const totalInvoicePaid = invoiceSummary.byStatus['paid'] ?? 0;
  const totalIncome = withdrawalSummary.totalNet + totalInvoicePaid + externalClientsSummary.totalAmount; // ✅ Incluye CRM
  const payrollPaid = currentTotalAmount;
  const netProfit = totalIncome - payrollPaid;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
  const payrollVariation = payrollPaid - previousTotals.totalAmount;


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
        paymentMethod: details.paymentMethod,
        customHourlyRate: typeof details.customHourlyRate === 'number' ? details.customHourlyRate : null
      };

      let nextValue: PayoutDraft[keyof PayoutDraft];

      if (field === 'paymentDay') {
        if (value === null || value === '') {
          nextValue = null;
        } else {
          const numeric = typeof value === 'number' ? value : Number(value);
          nextValue = Number.isNaN(numeric) ? null : numeric;
        }
      } else if (field === 'customHourlyRate') {
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
      const existingRecord = calendar?.payoutRecords?.[periodKey];
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
  }, [calendarMap, periodKey]);

  const handleQuickMarkAsPaid = useCallback((calendarId: string, defaultMethod: PaymentMethod) => {
    const today = new Date();
    const isoDate = today.toISOString().split('T')[0];
    handlePayoutRecordChange(calendarId, 'status', 'paid');
    handlePayoutRecordChange(calendarId, 'lastPaymentDate', isoDate);
    handlePayoutRecordChange(calendarId, 'lastPaymentBy', user?.displayName || user?.email || 'Equipo');
    handlePayoutRecordChange(calendarId, 'paymentMethod', defaultMethod);
  }, [handlePayoutRecordChange, user?.displayName, user?.email]);

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
              paymentMethod: details?.paymentMethod ?? 'transfer',
              customHourlyRate: typeof details?.customHourlyRate === 'number' ? details.customHourlyRate : null
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
              note: record?.note || '',
              paymentMethod: record?.paymentMethod,
              amountPaid: typeof record?.amountPaid === 'number' ? record?.amountPaid : undefined
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
        paypalEmail: calendar.payoutDetails?.paypalEmail || '',
        paymentType: calendar.payoutDetails?.paymentType ?? 'monthly',
        paymentDay: typeof calendar.payoutDetails?.paymentDay === 'number' ? calendar.payoutDetails.paymentDay : null,
        paymentMethod: calendar.payoutDetails?.paymentMethod ?? 'transfer',
        customHourlyRate: typeof calendar.payoutDetails?.customHourlyRate === 'number'
          ? calendar.payoutDetails.customHourlyRate
          : null
      };

    const existingRecord = calendar.payoutRecords?.[periodKey];
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
      paymentMethod: draft.paymentMethod || undefined,
      customHourlyRate: typeof draft.customHourlyRate === 'number' ? draft.customHourlyRate : undefined
    };

    try {
      setSavingPayout(prev => ({ ...prev, [calendarId]: true }));

      // ✅ Usar mutación de React Query (actualiza caché automáticamente)
      await updatePayoutMutation.mutateAsync({
        calendarId,
        periodKey,
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
  }, [calendarMap, payoutDrafts, payoutRecordDrafts, periodKey, updatePayoutMutation]);

  const renderProfessionalDetail = useCallback((statContainer: typeof statsForDisplay[number]) => {
    const { base: stat, filteredMonths, filteredAmount, filteredHours, filteredEvents, paymentPeriod } = statContainer as typeof statsForDisplay[number] & { paymentPeriod?: any };
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
      paymentType?: PaymentFrequency;
      paymentDay?: number;
      paymentMethod?: PaymentMethod;
      customHourlyRate?: number;
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
        paypalEmail: payoutDetails.paypalEmail || '',
        paymentType: payoutDetails.paymentType ?? 'monthly',
        paymentDay: typeof payoutDetails.paymentDay === 'number' ? payoutDetails.paymentDay : null,
        paymentMethod: payoutDetails.paymentMethod ?? 'transfer',
        customHourlyRate: typeof payoutDetails.customHourlyRate === 'number' ? payoutDetails.customHourlyRate : null
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

    const paymentType: PaymentFrequency = draft.paymentType ?? payoutDetails.paymentType ?? 'monthly';
    const paymentDay = typeof draft.paymentDay === 'number'
      ? draft.paymentDay
      : typeof payoutDetails.paymentDay === 'number'
        ? payoutDetails.paymentDay
        : null;
    const preferredMethod: PaymentMethod = draft.paymentMethod
      ?? payoutDetails.paymentMethod
      ?? 'transfer';
    const effectiveRate = draft.customHourlyRate
      ?? payoutDetails.customHourlyRate
      ?? (stat.hourlyRate > 0 ? stat.hourlyRate : null);

    const latestPaymentRecord = getLatestPaymentRecord(relatedCalendar?.payoutRecords);
    const nextPaymentDate = getNextPaymentDate(new Date(), paymentType, paymentDay, latestPaymentRecord?.lastPaymentDate);
    const nextPaymentLabel = nextPaymentDate ? formatRelativeDate(nextPaymentDate) : 'Sin programar';
    const recentPayments = getRecentPayments(relatedCalendar?.payoutRecords);

    const paymentDayLabel = getPaymentDayDescription(paymentType, paymentDay);

    const currentRecord = (relatedCalendar as any)?.payoutRecords?.[periodKey];
    const recordDraft = payoutRecordDrafts[stat.professionalId];
    const displayRecord = editing
      ? recordDraft ?? {
          status: (currentRecord?.status ?? 'pending') as 'pending' | 'paid',
          lastPaymentDate: currentRecord?.lastPaymentDate || '',
          lastPaymentBy: currentRecord?.lastPaymentBy || '',
          note: currentRecord?.note || '',
          paymentMethod: currentRecord?.paymentMethod,
          amountPaid: currentRecord?.amountPaid
        }
      : currentRecord ?? null;
    const recordStatus = displayRecord?.status ?? 'pending';

    const activeMonthKeys = filteredMonths.length
      ? new Set(filteredMonths.map(month => month.month))
      : new Set(monthlySeries.map(month => month.monthKey));

    return (
      <article className="payments-professional-card" key={stat.professionalId}>
        <div className="payments-professional-card__header">
          <div className="payments-professional-card__identity">
            <div className="payments-professional-card__avatar">
              {owner?.avatar ? (
                <img src={owner.avatar} alt={owner.name} />
              ) : (
                <span>{(stat.professionalName || 'P').charAt(0)}</span>
              )}
            </div>
            <div className="payments-professional-card__identity-info">
              <h4>{stat.professionalName}</h4>
              <span>{owner?.email || relatedCalendar?.linkedEmail || 'Sin email vinculado'}</span>
              <div className="payments-professional-card__badge-row">
                <span className={`payments-payment-badge ${PAYMENT_TYPE_BADGE_CLASS[paymentType]}`}>
                  {getPaymentTypeLabel(paymentType)}
                </span>
                <span className="payments-payment-badge payments-payment-badge--method">
                  {getPaymentMethodLabel(preferredMethod)}
                </span>
                {paymentPeriod && (
                  <span className="payments-payment-badge payments-payment-badge--period" style={{ backgroundColor: '#10b981', color: 'white' }}>
                    📅 {paymentPeriod.label}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="payments-professional-card__close-btn"
            onClick={() => setSelectedProfessionalId(null)}
            aria-label="Cerrar detalles"
          >
            <X size={20} />
          </button>
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
            {!editing && nextPaymentDate && (
              <span className="payments-status__meta payments-status__meta--next">
                Próximo pago: {nextPaymentLabel}
              </span>
            )}
          </div>
          <div className="payments-professional-card__metrics">
            <div className="payments-metric">
              <span>Total a pagar</span>
              <strong>{formatCurrency(filteredAmount || 0, stat.currency || 'EUR')}</strong>
              <small>Total servicios registrados: {filteredEvents}</small>
            </div>
            <div className="payments-metric payments-metric--schedule">
              <span>Próximo pago</span>
              <strong>
                {nextPaymentDate
                  ? nextPaymentDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                  : 'Sin programar'}
              </strong>
              <small>{paymentDayLabel} · {nextPaymentLabel}</small>
            </div>
            <div className="payments-metric payments-metric--hover">
              <span>Horas trabajadas</span>
              <strong>{WorkHoursAnalyticsService.formatHours(filteredHours || 0)}</strong>
              <small>Incluye servicios completados y en curso según filtros</small>
            </div>
            <div className="payments-metric">
              <span>Tarifa vigente</span>
              <strong>
                {typeof effectiveRate === 'number'
                  ? `${formatCurrency(effectiveRate, stat.currency || 'EUR')}/h`
                  : stat.hourlyRate > 0
                    ? `${formatCurrency(stat.hourlyRate, stat.currency || 'EUR')}/h`
                    : 'Tarifa no definida'}
              </strong>
              <small>
                {typeof effectiveRate === 'number'
                  ? 'Tarifa personalizada para este profesional'
                  : stat.hourlyRate > 0
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
          <div className="payments-payout-config">
            <div className="payments-payout-config__header">
              <h5>Configuración de pago</h5>
              {!editing && nextPaymentDate && (
                <span className="payments-payout-config__header-chip">
                  Próximo: {nextPaymentDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </span>
              )}
            </div>
            {editing ? (
              <div className="payments-payout-config__grid">
                <div className="payments-payout-config__field">
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
                <div className="payments-payout-config__field">
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
                <div className="payments-payout-config__field">
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
                <div className="payments-payout-config__field">
                  <label>Tarifa personalizada</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={draft.customHourlyRate ?? ''}
                    onChange={(event) => handlePayoutFieldChange(
                      stat.professionalId,
                      'customHourlyRate',
                      event.target.value === '' ? null : Number(event.target.value)
                    )}
                    placeholder="Opcional"
                  />
                  <small>
                    Si lo dejas vacío, usaremos la tarifa del calendario: {stat.hourlyRate > 0 ? `${formatCurrency(stat.hourlyRate, stat.currency || 'EUR')}/h` : 'no definida'}
                  </small>
                </div>
              </div>
            ) : (
              <ul className="payments-payout-config__summary">
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
                      : stat.hourlyRate > 0
                        ? `${formatCurrency(stat.hourlyRate, stat.currency || 'EUR')}/h`
                        : 'Sin definir'}
                  </strong>
                </li>
              </ul>
            )}
          </div>
          <div className="payments-payout-divider" />
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
          <div className="payments-payout-field">
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
              <p className="payments-readonly-value">
                {displayRecord?.paymentMethod ? getPaymentMethodLabel(displayRecord.paymentMethod) : 'Sin registrar'}
              </p>
            )}
          </div>
          <div className="payments-payout-field">
            <label htmlFor={`amount-paid-${stat.professionalId}`}>Monto registrado</label>
            {editing ? (
              <input
                id={`amount-paid-${stat.professionalId}`}
                type="number"
                step="0.01"
                min={0}
                value={recordDraft?.amountPaid ?? displayRecord?.amountPaid ?? ''}
                onChange={(event) => handlePayoutRecordChange(
                  stat.professionalId,
                  'amountPaid',
                  event.target.value
                )}
                placeholder="Ej: 250.00"
              />
            ) : (
              <p className="payments-readonly-value">
                {typeof displayRecord?.amountPaid === 'number'
                  ? formatCurrency(displayRecord.amountPaid, stat.currency || 'EUR')
                  : 'Sin registrar'}
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
          <div className="payments-payment-history">
            <h5>Historial de pagos</h5>
            {recentPayments.length ? (
              <ul>
                {recentPayments.map(item => (
                  <li key={`${stat.professionalId}-recent-${item.periodKey}`}>
                    <span>{formatDisplayDate(item.lastPaymentDate)}</span>
                    <span>{item.amountPaid ? formatCurrency(item.amountPaid, stat.currency || 'EUR') : 'Monto no registrado'}</span>
                    <span>{item.paymentMethod ? getPaymentMethodLabel(item.paymentMethod) : 'Método no registrado'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="payments-history__empty">Aún no hay pagos registrados.</p>
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
                  className="payments-button payments-button--ghost payments-button--with-icon payments-button--compact"
                  onClick={() => handleQuickMarkAsPaid(stat.professionalId, preferredMethod)}
                  disabled={isSaving}
                >
                  <CheckCircle size={16} />
                  Pago realizado
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
  }, [calendarMap, selectedYear, payoutDrafts, savingPayout, editingPayout, payoutRecordDrafts, handlePayoutRecordChange, pendingLoading, pendingServices, handlePayoutFieldChange, handleCopyValue, handleCancelPayoutEdit, handleSavePayout, handleTogglePayoutEdit, handleQuickMarkAsPaid])

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
    <div className={`payments-page ${isProfessionalsSidebarCollapsed ? 'professionals-collapsed' : ''}`}>
      <div className="payments-container payments-layout-two-columns">
        {/* Contenido principal */}
        <div className="payments-main-content">
        <nav className="payments-tabs">
          <button
            type="button"
            className={`payments-tab ${activeTab === 'calendar' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            General
          </button>
          <button
            type="button"
            className={`payments-tab ${activeTab === 'income' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('income')}
          >
            Ingresos
          </button>
          <button
            type="button"
            className={`payments-tab ${activeTab === 'export' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            Exportar
          </button>
        </nav>

        {/* Panel expandible de profesional seleccionado con TODOS los detalles */}
        {selectedProfessional && activeTab === 'calendar' && (
          <div className="payments-professional-detail-wrapper">
            {renderProfessionalDetail(selectedProfessional)}
          </div>
        )}

        {activeTab === 'calendar' && (
          loading ? (
            <div className="payments-card payments-card--loader">
              <LoadingSpinner />
              <p>Calculando acumulado de pagos...</p>
            </div>
          ) : (
            <>
              <section className="payments-card">
                <header className="payments-header">
                  <div className="payments-header__info">
                    <div className="payments-header__icon">
                      <Wallet size={24} />
                    </div>
                    <div>
                      <h1 className="payments-header__title">Gestor financiero</h1>
                      <p className="payments-header__subtitle">
                        Centraliza nómina, ingresos y reportes del equipo
                      </p>
                    </div>
                  </div>
                  <div className="payments-header__actions">
                    <button
                      onClick={() => setIsHeaderControlsExpanded(!isHeaderControlsExpanded)}
                      className="payments-button payments-button--ghost payments-button--with-icon"
                    >
                      <Filter size={16} />
                      Controles
                      <ChevronDown size={16} />
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

                  {isHeaderControlsExpanded && (
                    <div className="payments-header__controls">
                      <div className="payments-filters">
                        <div className="payments-select">
                          <label>Año</label>
                          <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
                            {years.map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                        <div className="payments-select">
                          <label>Período</label>
                          <select value={period} onChange={(event) => setPeriod(event.target.value as typeof period)}>
                            <option value="year">Año completo</option>
                            <option value="quarter">Trimestre</option>
                            <option value="month">Mes</option>
                            <option value="payment">Por Periodo de Pago</option>
                          </select>
                        </div>
                        {period === 'quarter' && (
                          <div className="payments-select">
                            <label>Trimestre</label>
                            <select value={selectedQuarter} onChange={(event) => setSelectedQuarter(Number(event.target.value))}>
                              {[1, 2, 3, 4].map(quarter => (
                                <option key={quarter} value={quarter}>Q{quarter}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {period === 'month' && (
                          <div className="payments-select">
                            <label>Mes</label>
                            <select value={selectedMonth} onChange={(event) => setSelectedMonth(Number(event.target.value))}>
                              {MONTH_LABELS.map((label, index) => (
                                <option key={label} value={index}>{label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setOnlyCompleted(!onlyCompleted)}
                          className={`payments-toggle ${onlyCompleted ? 'payments-toggle--active' : ''}`}
                        >
                          {onlyCompleted ? 'Solo servicios completados' : 'Todos los servicios'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPendingOnly(!showPendingOnly)}
                          className={`payments-toggle ${showPendingOnly ? 'payments-toggle--active' : ''}`}
                        >
                          {showPendingOnly ? 'Solo pendientes' : 'Todos los profesionales'}
                        </button>
                      </div>
                    </div>
                  )}
                </header>

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

                {/* KPIs por profesional */}
                {stats.length > 0 && (
                  <div className="payments-professional-kpis">
                    <h4 className="payments-professional-kpis__title">Vista por profesional</h4>
                    <div className="payments-professional-kpis__grid">
                      {displayStats.slice(0, 12).map(({ base, filteredAmount, filteredHours, filteredEvents }) => {
                        const calendar = calendarMap.get(base.professionalId);
                        const owner = calendar?.members?.find(m => m.role === 'owner') ?? calendar?.members?.[0];
                        const payoutDetails = ((calendar as any)?.payoutDetails ?? {}) as {
                          paymentType?: PaymentFrequency;
                          paymentDay?: number;
                          paymentMethod?: PaymentMethod;
                        };
                        const isPending = isProfessionalPending(base.professionalId);
                        const recordStatus = calendar?.payoutRecords?.[periodKey]?.status ?? 'pending';
                        const paymentType = payoutDetails.paymentType ?? 'monthly';
                        const paymentDay = typeof payoutDetails.paymentDay === 'number' ? payoutDetails.paymentDay : null;
                        const latestRecord = getLatestPaymentRecord(calendar?.payoutRecords);
                        const nextPaymentDate = getNextPaymentDate(new Date(), paymentType, paymentDay, latestRecord?.lastPaymentDate);

                        // Determinar la alerta más importante
                        let alertIcon = '';
                        let alertText = '';
                        let alertType = '';

                        if (recordStatus === 'pending' && filteredAmount > 0) {
                          alertIcon = '💰';
                          alertText = `Pendiente: ${formatCurrency(filteredAmount, base.currency)}`;
                          alertType = 'error';
                        } else if (nextPaymentDate) {
                          const daysUntil = Math.ceil((nextPaymentDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          if (daysUntil >= 0 && daysUntil <= 7) {
                            alertIcon = '⚠️';
                            alertText = `Próximo pago: ${daysUntil === 0 ? 'Hoy' : daysUntil === 1 ? 'Mañana' : `${daysUntil}d`}`;
                            alertType = 'warning';
                          } else {
                            alertIcon = '✓';
                            alertText = 'Al día';
                            alertType = 'success';
                          }
                        } else {
                          alertIcon = 'ℹ️';
                          alertText = 'Sin configurar';
                          alertType = 'info';
                        }

                        return (
                          <article
                            key={base.professionalId}
                            className={`payments-professional-kpi ${isPending ? 'payments-professional-kpi--pending' : ''}`}
                            onClick={() => setSelectedProfessionalId(base.professionalId)}
                          >
                            <div className="payments-professional-kpi__header">
                              <div className="payments-professional-kpi__avatar">
                                {owner?.avatar ? (
                                  <img src={owner.avatar} alt={base.professionalName} />
                                ) : (
                                  <span>{(base.professionalName || 'P').charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div className="payments-professional-kpi__info">
                                <h5>{base.professionalName || 'Profesional'}</h5>
                                <span className="payments-professional-kpi__email">{owner?.email || base.professionalEmail || '—'}</span>
                              </div>
                            </div>
                            <div className="payments-professional-kpi__metrics">
                              <div className="payments-professional-kpi__metric">
                                <span className="payments-professional-kpi__metric-label">Total</span>
                                <strong className="payments-professional-kpi__metric-value">
                                  {formatCurrency(filteredAmount, base.currency)}
                                </strong>
                              </div>
                              <div className="payments-professional-kpi__metric">
                                <span className="payments-professional-kpi__metric-label">Horas</span>
                                <strong className="payments-professional-kpi__metric-value">
                                  {(filteredHours || 0).toFixed(1)}h
                                </strong>
                              </div>
                              <div className="payments-professional-kpi__metric">
                                <span className="payments-professional-kpi__metric-label">Servicios</span>
                                <strong className="payments-professional-kpi__metric-value">
                                  {filteredEvents || 0}
                                </strong>
                              </div>
                            </div>
                            <div className={`payments-professional-kpi__alert payments-professional-kpi__alert--${alertType}`}>
                              <span className="payments-professional-kpi__alert-icon">{alertIcon}</span>
                              <span className="payments-professional-kpi__alert-text">{alertText}</span>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                    {displayStats.length > 12 && (
                      <p className="payments-professional-kpis__more">
                        Mostrando 12 de {displayStats.length} profesionales. Usa la lista lateral para ver todos.
                      </p>
                    )}
                  </div>
                )}
              </section>

              {scheduledPayments.length > 0 && (
                <section className="payments-scheduled">
                  <div className="payments-scheduled__header">
                    <div>
                      <h3>Pagos programados</h3>
                      <p>Próximos desembolsos según el tipo de pago configurado para cada profesional.</p>
                    </div>
                  </div>
                  <div className="payments-scheduled__list">
                    {scheduledPayments.slice(0, 8).map(item => (
                      <article key={item.professionalId} className="payments-scheduled__item">
                        <div className="payments-scheduled__top">
                          <span className={`payments-payment-badge ${PAYMENT_TYPE_BADGE_CLASS[item.paymentType]}`}>
                            {getPaymentTypeLabel(item.paymentType)}
                          </span>
                          <span className="payments-scheduled__date">
                            {item.nextDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                        <h5>{item.professionalName}</h5>
                        <p>{item.paymentDayLabel}</p>
                        <div className="payments-scheduled__footer">
                          <span>{item.relativeLabel}</span>
                          <span>{getPaymentMethodLabel(item.paymentMethod)}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* Alertas y conciliación */}
              <section className="payments-card">
                <div className="payments-card__section-header">
                  <div>
                    <h3 className="payments-card__section-title">Alertas y conciliación</h3>
                    <p className="payments-card__subtitle">
                      Revisión de pagos pendientes, servicios sin completar y estado financiero general
                    </p>
                  </div>
                </div>

                {/* Semáforo financiero */}
                <div className="payments-alerts-traffic-light">
                  <div className={`payments-traffic-light ${
                    netProfit >= totalIncome * 0.2 ? 'payments-traffic-light--green' :
                    netProfit >= 0 ? 'payments-traffic-light--yellow' :
                    'payments-traffic-light--red'
                  }`}>
                    <div className="payments-traffic-light__indicator">
                      {netProfit >= totalIncome * 0.2 ? '🟢' : netProfit >= 0 ? '🟡' : '🔴'}
                    </div>
                    <div>
                      <h4>Estado financiero</h4>
                      <p>
                        {netProfit >= totalIncome * 0.2
                          ? 'Excelente - Margen saludable superior al 20%'
                          : netProfit >= 0
                            ? 'Aceptable - Margen positivo pero ajustado'
                            : 'Alerta - Costes superan ingresos'}
                      </p>
                      <strong>
                        Margen: {Number.isFinite(profitMargin) ? `${profitMargin.toFixed(1)}%` : '—'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Alertas de pagos próximos */}
                <div className="payments-alerts-section">
                  <h4>Pagos próximos (7 días)</h4>
                  {(() => {
                    const upcomingPayments = scheduledPayments.filter(payment => {
                      const daysUntil = Math.ceil((payment.nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      return daysUntil >= 0 && daysUntil <= 7;
                    });

                    return upcomingPayments.length > 0 ? (
                      <ul className="payments-alerts-list">
                        {upcomingPayments.map(payment => {
                          const daysUntil = Math.ceil((payment.nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          const professional = displayStats.find(s => s.base.professionalId === payment.professionalId);
                          return (
                            <li key={payment.professionalId} className="payments-alert-item payments-alert-item--warning">
                              <div className="payments-alert-item__icon">⚠️</div>
                              <div className="payments-alert-item__content">
                                <strong>{payment.professionalName}</strong>
                                <span>Pago {payment.paymentType} programado {payment.relativeLabel.toLowerCase()}</span>
                                {professional && (
                                  <span className="text-sm">Monto pendiente: {formatCurrency(professional.filteredAmount, professional.base.currency)}</span>
                                )}
                              </div>
                              <div className="payments-alert-item__badge">
                                {daysUntil === 0 ? 'Hoy' : daysUntil === 1 ? 'Mañana' : `${daysUntil} días`}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="payments-alerts-empty">No hay pagos programados en los próximos 7 días</p>
                    );
                  })()}
                </div>

                {/* Servicios pendientes de completar */}
                <div className="payments-alerts-section">
                  <h4>Servicios pendientes de completar</h4>
                  {(() => {
                    const professionalsWithPending = Object.entries(pendingServices)
                      .filter(([_, data]) => data.count > 0)
                      .map(([professionalId, data]) => {
                        const professional = displayStats.find(s => s.base.professionalId === professionalId);
                        return { professionalId, data, professional };
                      });

                    return professionalsWithPending.length > 0 ? (
                      <ul className="payments-alerts-list">
                        {professionalsWithPending.map(({ professionalId, data, professional }) => (
                          <li key={professionalId} className="payments-alert-item payments-alert-item--info">
                            <div className="payments-alert-item__icon">📋</div>
                            <div className="payments-alert-item__content">
                              <strong>{professional?.base.professionalName || 'Profesional'}</strong>
                              <span>{data.count} servicios sin completar en el período actual</span>
                              <span className="text-sm">Ejemplos: {data.examples.slice(0, 2).join(', ')}</span>
                            </div>
                            <div className="payments-alert-item__badge payments-alert-item__badge--count">
                              {data.count}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="payments-alerts-empty">✅ Todos los servicios están completados</p>
                    );
                  })()}
                </div>

                {/* Profesionales sin pagar */}
                <div className="payments-alerts-section">
                  <h4>Profesionales pendientes de pago</h4>
                  {(() => {
                    const unpaidProfessionals = displayStats.filter(({ base }) => {
                      const calendar = calendarMap.get(base.professionalId);
                      const recordStatus = calendar?.payoutRecords?.[periodKey]?.status ?? 'pending';
                      return recordStatus === 'pending' && base.filteredAmount > 0;
                    });

                    return unpaidProfessionals.length > 0 ? (
                      <ul className="payments-alerts-list">
                        {unpaidProfessionals.map(({ base }) => (
                          <li key={base.professionalId} className="payments-alert-item payments-alert-item--error">
                            <div className="payments-alert-item__icon">💰</div>
                            <div className="payments-alert-item__content">
                              <strong>{base.professionalName}</strong>
                              <span>Pago pendiente del período {periodKey}</span>
                              <span className="text-sm">Total adeudado: {formatCurrency(base.filteredAmount, base.currency)}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="payments-alerts-empty">✅ Todos los profesionales están al día</p>
                    );
                  })()}
                </div>

                {/* Facturas vencidas */}
                {invoices.some(inv => inv.status === 'overdue') && (
                  <div className="payments-alerts-section">
                    <h4>Facturas vencidas</h4>
                    <ul className="payments-alerts-list">
                      {invoices
                        .filter(inv => inv.status === 'overdue')
                        .map(invoice => (
                          <li key={invoice.id} className="payments-alert-item payments-alert-item--error">
                            <div className="payments-alert-item__icon">🚨</div>
                            <div className="payments-alert-item__content">
                              <strong>{invoice.clientName}</strong>
                              <span>Factura vencida - {formatCurrency(invoice.amount, invoice.currency)}</span>
                              {invoice.dueDate && (
                                <span className="text-sm">Vencimiento: {invoice.dueDate.toLocaleDateString('es-ES')}</span>
                              )}
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {/* Resumen de conciliación */}
                <div className="payments-alerts-summary">
                  <h4>Resumen de conciliación</h4>
                  <div className="payments-alerts-summary-grid">
                    <div>
                      <span>Total a pagar este período</span>
                      <strong>{formatCurrency(currentTotalAmount, primaryCurrency)}</strong>
                    </div>
                    <div>
                      <span>Profesionales pendientes</span>
                      <strong>{displayStats.filter(({ base }) => {
                        const calendar = calendarMap.get(base.professionalId);
                        return (calendar?.payoutRecords?.[periodKey]?.status ?? 'pending') === 'pending';
                      }).length}</strong>
                    </div>
                    <div>
                      <span>Servicios sin completar</span>
                      <strong>{Object.values(pendingServices).reduce((sum, data) => sum + data.count, 0)}</strong>
                    </div>
                    <div>
                      <span>Pagos en 7 días</span>
                      <strong>{scheduledPayments.filter(p => {
                        const days = Math.ceil((p.nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return days >= 0 && days <= 7;
                      }).length}</strong>
                    </div>
                  </div>
                </div>
              </section>

              {/* Panel de estadísticas */}
              <section className="payments-card payments-card--stats">
                <div className="payments-card__section-header">
                  <div>
                    <h3 className="payments-card__section-title">Estadísticas</h3>
                    <p className="payments-card__subtitle">Visión consolidada de ingresos, nómina y salud financiera.</p>
                  </div>
                </div>
                <div className="payments-stats-grid">
                  <article className="payments-stats-card">
                    <span>Ingresos totales</span>
                    <strong>{formatCurrency(totalIncome, primaryCurrency)}</strong>
                    <small>Netos plataforma + facturas cobradas</small>
                  </article>
                  <article className="payments-stats-card">
                    <span>Nómina pagada</span>
                    <strong>{formatCurrency(payrollPaid, primaryCurrency)}</strong>
                    <small>Acumulado del período actual</small>
                  </article>
                  <article className="payments-stats-card">
                    <span>Ganancia neta</span>
                    <strong>{formatCurrency(netProfit, primaryCurrency)}</strong>
                    <small>Diferencia entre ingresos y nómina</small>
                  </article>
                  <article className="payments-stats-card">
                    <span>Margen</span>
                    <strong>{Number.isFinite(profitMargin) ? `${profitMargin.toFixed(1)}%` : '—'}</strong>
                    <small>{netProfit >= 0 ? 'Rentabilidad positiva' : 'Rentabilidad negativa'}</small>
                  </article>
                </div>
                <div className="payments-stats-columns">
                  <div className="payments-stats-column">
                    <h4>Ingresos vs Nómina</h4>
                    <ul className="payments-stats-list">
                      <li>
                        <span>Ingresos totales</span>
                        <strong>{formatCurrency(totalIncome, primaryCurrency)}</strong>
                      </li>
                      <li>
                        <span>Nómina actual</span>
                        <strong>{formatCurrency(payrollPaid, primaryCurrency)}</strong>
                      </li>
                      <li>
                        <span>Ganancia neta</span>
                        <strong>{formatCurrency(netProfit, primaryCurrency)}</strong>
                      </li>
                      <li>
                        <span>Variación nómina</span>
                        <strong>{formatCurrency(payrollVariation, primaryCurrency)}</strong>
                      </li>
                    </ul>
                  </div>
                  <div className="payments-stats-column">
                    <h4>Tipos de pago</h4>
                    <ul className="payments-stats-list">
                      {paymentTypeStats.map(item => (
                        <li key={item.value}>
                          <div className="payments-stats-list__row">
                            <span>{item.label}</span>
                            <strong>{item.count}</strong>
                          </div>
                          <div className="payments-stats-bar">
                            <span style={{ width: `${item.percent}%` }} />
                          </div>
                          <small>{item.percent}% del equipo</small>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="payments-stats-column">
                    <h4>Estado de facturas</h4>
                    <ul className="payments-stats-list">
                      {invoiceStatusStats.map(item => (
                        <li key={item.value}>
                          <div className="payments-stats-list__row">
                            <span>{item.label}</span>
                            <strong>{formatCurrency(item.amount, invoices[0]?.currency || primaryCurrency)}</strong>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

            </>
          )
        )}

        {activeTab === 'income' && (
          <section className="payments-card payments-card--income">
            <div className="payments-card__section-header">
              <div>
                <h3 className="payments-card__section-title">Ingresos y facturación</h3>
                <p className="payments-card__subtitle">
                  Controla retiros de plataforma y facturas de clientes externos.
                </p>
              </div>
            </div>
            <div className="payments-income-summary">
              <article className="payments-summary-card">
                <div className="payments-summary-card__icon">
                  <DollarSign size={18} />
                </div>
                <div className="payments-summary-card__content">
                  <span className="payments-summary-card__label">Netos recibidos</span>
                  <strong className="payments-summary-card__value">
                    {formatCurrency(withdrawalSummary.totalNet, primaryCurrency)}
                  </strong>
                  <span className="payments-summary-card__meta">{withdrawals.length} retiros registrados</span>
                </div>
              </article>
              <article className="payments-summary-card">
                <div className="payments-summary-card__icon">
                  <FileText size={18} />
                </div>
                <div className="payments-summary-card__content">
                  <span className="payments-summary-card__label">Facturación externa</span>
                  <strong className="payments-summary-card__value">
                    {formatCurrency(invoiceSummary.total + externalClientsSummary.totalAmount, (invoices[0]?.currency || primaryCurrency))}
                  </strong>
                  <span className="payments-summary-card__meta">
                    {invoices.length} facturas manuales · {externalClientsSummary.clientsCount} clientes CRM · {formatCurrency(invoiceSummary.byStatus['paid'] || 0, (invoices[0]?.currency || primaryCurrency))} cobradas
                  </span>
                </div>
              </article>
            </div>

            <div className="payments-subtabs">
              <button
                type="button"
                className={`payments-subtab ${incomeTab === 'platform' ? 'is-active' : ''}`}
                onClick={() => setIncomeTab('platform')}
              >
                Plataforma
              </button>
              <button
                type="button"
                className={`payments-subtab ${incomeTab === 'external' ? 'is-active' : ''}`}
                onClick={() => setIncomeTab('external')}
              >
                Clientes externos
              </button>
            </div>

            {incomeTab === 'platform' ? (
              <div className="payments-income-grid">
                <form className="payments-income-form" onSubmit={handleCreateWithdrawal}>
                  <h4>Registrar retiro</h4>
                  <div className="payments-income-form__row">
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
                  <div className="payments-income-form__row">
                    <label className="payments-income-form__wide">
                      Nota interna
                      <input
                        type="text"
                        value={withdrawalForm.note}
                        onChange={(event) => setWithdrawalForm(form => ({ ...form, note: event.target.value }))}
                        placeholder="Banco, referencia o nota de control"
                      />
                    </label>
                  </div>
                  <div className="payments-income-form__footer">
                    <span className="payments-income-form__preview">
                      Neto estimado: <strong>{formatCurrency(withdrawalNetPreview, primaryCurrency)}</strong>
                    </span>
                    <button
                      type="submit"
                      className="payments-button payments-button--primary payments-button--with-icon"
                      disabled={createWithdrawal.isPending}
                    >
                      <PlusCircle size={16} />
                      {createWithdrawal.isPending ? 'Guardando...' : 'Registrar retiro'}
                    </button>
                  </div>
                </form>

                <div className="payments-income-list">
                  <header className="payments-income-list__header">
                    <h4>Historial de retiros</h4>
                    <span>{withdrawals.length} registros</span>
                  </header>
                  {withdrawalsLoading ? (
                    <div className="payments-income-list__loader">
                      <LoadingSpinner />
                    </div>
                  ) : withdrawals.length === 0 ? (
                    <p className="payments-history__empty">Aún no has registrado retiros de plataforma.</p>
                  ) : (
                    <ul>
                      {withdrawals.map(withdrawal => (
                        <li key={withdrawal.id} className="payments-income-list__item">
                          <div>
                            <strong>{formatCurrency(withdrawal.netAmount, primaryCurrency)}</strong>
                            <span>{withdrawal.date.toLocaleDateString('es-ES')}</span>
                          </div>
                          <div>
                            <small>Bruto {formatCurrency(withdrawal.grossAmount, primaryCurrency)}</small>
                            <small>Comisión {formatCurrency(withdrawal.commission, primaryCurrency)}</small>
                          </div>
                          {withdrawal.note && <p>{withdrawal.note}</p>}
                          <button
                            type="button"
                            className="payments-income-list__delete"
                            onClick={() => handleDeleteWithdrawal(withdrawal.id)}
                            disabled={deleteWithdrawal.isPending}
                          >
                            <Trash2 size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <div className="payments-income-external">
                {/* ✅ NUEVA SECCIÓN: Clientes CRM */}
                <div className="payments-external-clients">
                  <header className="payments-income-list__header">
                    <div>
                      <h4>Clientes CRM</h4>
                      <p className="text-sm text-gray-600">Tracking automático de servicios completados</p>
                    </div>
                    <Link
                      to="/dashboard/clientes"
                      className="payments-button payments-button--ghost payments-button--with-icon payments-button--compact"
                    >
                      <Building2 size={14} />
                      Gestionar clientes
                      <ExternalLink size={12} />
                    </Link>
                  </header>
                  {externalClientsLoading ? (
                    <div className="payments-income-list__loader">
                      <LoadingSpinner />
                    </div>
                  ) : externalClients.length === 0 ? (
                    <div className="payments-empty-state">
                      <Building2 size={32} className="text-gray-400" />
                      <p>No tienes clientes externos registrados</p>
                      <Link to="/dashboard/clientes" className="payments-button payments-button--primary payments-button--compact">
                        Crear primer cliente
                      </Link>
                    </div>
                  ) : (
                    <div className="payments-clients-grid">
                      {externalClients.map(client => (
                        <article key={client.id} className="payments-client-card">
                          <div className="payments-client-card__header">
                            <div>
                              <h5>{client.name}</h5>
                              {client.company && <span className="text-sm text-gray-600">{client.company}</span>}
                            </div>
                            <Link
                              to={`/dashboard/clientes/${client.id}`}
                              className="payments-client-card__link"
                            >
                              <ExternalLink size={14} />
                            </Link>
                          </div>
                          <div className="payments-client-card__stats">
                            <div>
                              <span>Total facturado</span>
                              <strong>{formatCurrency(client.totalAmount || 0, client.currency)}</strong>
                            </div>
                            <div>
                              <span>Horas trabajadas</span>
                              <strong>{(client.totalHours || 0).toFixed(2)} h</strong>
                            </div>
                            <div>
                              <span>Tarifa horaria</span>
                              <strong>{formatCurrency(client.hourlyRate || 0, client.currency)}/h</strong>
                            </div>
                          </div>
                          {client.lastServiceDate && (
                            <div className="payments-client-card__footer">
                              <span className="text-xs text-gray-500">
                                Último servicio: {client.lastServiceDate instanceof Date
                                  ? client.lastServiceDate.toLocaleDateString('es-ES')
                                  : new Date((client.lastServiceDate as any).toDate()).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </div>

                {/* Separador */}
                <div className="payments-divider"></div>

                {/* Facturas manuales (original) */}
                <div className="payments-income-grid">
                <form className="payments-income-form" onSubmit={handleCreateInvoice}>
                  <h4>Registrar factura manual</h4>
                  <p className="text-sm text-gray-600 mb-3">Para clientes externos sin tracking automático</p>
                  <div className="payments-income-form__row">
                    <label>
                      Cliente
                      <input
                        type="text"
                        value={invoiceForm.clientName}
                        onChange={(event) => setInvoiceForm(form => ({ ...form, clientName: event.target.value }))}
                        placeholder="Nombre o empresa"
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
                    <label>
                      Moneda
                      <input
                        type="text"
                        value={invoiceForm.currency}
                        onChange={(event) => setInvoiceForm(form => ({ ...form, currency: event.target.value.toUpperCase() }))}
                        maxLength={3}
                        required
                      />
                    </label>
                  </div>
                  <div className="payments-income-form__row">
                    <label>
                      Estado
                      <select
                        value={invoiceForm.status}
                        onChange={(event) => setInvoiceForm(form => ({ ...form, status: event.target.value as InvoiceStatus }))}
                      >
                        {INVOICE_STATUS_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Fecha emisión
                      <input
                        type="date"
                        value={invoiceForm.issueDate}
                        onChange={(event) => setInvoiceForm(form => ({ ...form, issueDate: event.target.value }))}
                        required
                      />
                    </label>
                    <label>
                      Vencimiento
                      <input
                        type="date"
                        value={invoiceForm.dueDate}
                        onChange={(event) => setInvoiceForm(form => ({ ...form, dueDate: event.target.value }))}
                      />
                    </label>
                  </div>
                  <div className="payments-income-form__row">
                    <label>
                      Referencia
                      <input
                        type="text"
                        value={invoiceForm.reference}
                        onChange={(event) => setInvoiceForm(form => ({ ...form, reference: event.target.value }))}
                        placeholder="Ej. FAC-2025-001"
                      />
                    </label>
                    <label className="payments-income-form__wide">
                      Notas
                      <input
                        type="text"
                        value={invoiceForm.notes}
                        onChange={(event) => setInvoiceForm(form => ({ ...form, notes: event.target.value }))}
                        placeholder="Comentario interno opcional"
                      />
                    </label>
                  </div>
                  <div className="payments-income-form__footer">
                    <button
                      type="submit"
                      className="payments-button payments-button--primary payments-button--with-icon"
                      disabled={createInvoice.isPending}
                    >
                      <PlusCircle size={16} />
                      {createInvoice.isPending ? 'Guardando...' : 'Registrar factura'}
                    </button>
                  </div>
                </form>

                <div className="payments-income-list">
                  <header className="payments-income-list__header">
                    <h4>Facturas externas</h4>
                    <span>{invoices.length} registros</span>
                  </header>
                  {invoicesLoading ? (
                    <div className="payments-income-list__loader">
                      <LoadingSpinner />
                    </div>
                  ) : invoices.length === 0 ? (
                    <p className="payments-history__empty">Aún no registraste facturas de clientes externos.</p>
                  ) : (
                    <ul className="payments-invoices">
                      {invoices.map(invoice => (
                        <li key={invoice.id} className="payments-invoices__item">
                          <div className="payments-invoices__top">
                            <strong>{invoice.clientName}</strong>
                            <span>{formatCurrency(invoice.amount, invoice.currency)}</span>
                          </div>
                          <div className="payments-invoices__meta">
                            <span>Emitida: {invoice.issueDate.toLocaleDateString('es-ES')}</span>
                            {invoice.dueDate && <span>Vence: {invoice.dueDate.toLocaleDateString('es-ES')}</span>}
                            {invoice.reference && <span>Ref: {invoice.reference}</span>}
                          </div>
                          {invoice.notes && <p>{invoice.notes}</p>}
                          <div className="payments-invoices__footer">
                            <select
                              value={invoice.status}
                              onChange={(event) => handleInvoiceStatusChange(invoice.id, event.target.value as InvoiceStatus)}
                              disabled={updateInvoiceStatus.isPending}
                            >
                              {INVOICE_STATUS_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="payments-income-list__delete"
                              onClick={() => handleDeleteInvoiceRecord(invoice.id)}
                              disabled={deleteInvoice.isPending}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'export' && (
          <section className="payments-card payments-card--placeholder">
            <div className="payments-card__section-header">
              <div>
                <h3 className="payments-card__section-title">Exportaciones</h3>
                <p className="payments-card__subtitle">
                  Próximamente podrás descargar reportes completos y automatizar copias de seguridad desde esta sección.
                </p>
              </div>
            </div>
          </section>
        )}
        </div>

        {/* Sidebar unificado con dos columnas */}
        <aside className={`payments-unified-sidebar ${isProfessionalsSidebarCollapsed ? 'professionals-collapsed' : ''}`}>
          {/* Columna izquierda: Profesionales */}
          <div className="payments-unified-sidebar__professionals">
            <button
              type="button"
              className="payments-unified-sidebar__toggle"
              onClick={() => setIsProfessionalsSidebarCollapsed(!isProfessionalsSidebarCollapsed)}
              aria-label={isProfessionalsSidebarCollapsed ? 'Expandir profesionales' : 'Contraer profesionales'}
            >
              {isProfessionalsSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>

            <div className="payments-unified-sidebar__professionals-content">
            {activeTab !== 'calendar' ? (
              <div className="payments-professionals-sidebar__empty">
                Selecciona la pestaña General para ver profesionales.
              </div>
            ) : !stats.length ? (
              <div className="payments-professionals-sidebar__empty">
                Aún no hay movimientos registrados en {selectedYear}.
              </div>
            ) : !displayStats.length ? (
              <div className="payments-professionals-sidebar__empty">
                No hay profesionales que coincidan con los filtros seleccionados.
              </div>
            ) : (
              <>
                <div className="payments-professionals-sidebar__header">
                  <h3>Profesionales</h3>
                  <span>{displayStats.length}</span>
                </div>
                <div className="payments-professionals-list">
                  {displayStats.map(statContainer => {
                    const { base, filteredAmount, filteredHours } = statContainer;
                    const isActive = selectedProfessional?.base.professionalId === base.professionalId;
                    const pending = isProfessionalPending(base.professionalId);
                    const calendar = calendarMap.get(base.professionalId);
                    const payoutDetails = ((calendar as any)?.payoutDetails ?? {}) as {
                      paymentType?: PaymentFrequency;
                      paymentDay?: number;
                      paymentMethod?: PaymentMethod;
                    };
                    const paymentType: PaymentFrequency = payoutDetails.paymentType ?? 'monthly';
                    const paymentDay = typeof payoutDetails.paymentDay === 'number' ? payoutDetails.paymentDay : null;
                    const paymentMethod: PaymentMethod = payoutDetails.paymentMethod ?? 'transfer';
                    const latestRecord = getLatestPaymentRecord(calendar?.payoutRecords);
                    const nextPaymentDate = getNextPaymentDate(
                      new Date(),
                      paymentType,
                      paymentDay,
                      latestRecord?.lastPaymentDate
                    );
                    const nextPaymentLabel = nextPaymentDate ? formatRelativeDate(nextPaymentDate) : 'Sin programar';
                    const currency = (base.currency || 'EUR').toUpperCase();
                    const amountLabel = formatCurrency(filteredAmount ?? 0, currency);
                    const hoursValue = typeof filteredHours === 'number' ? filteredHours : 0;
                    const owner = calendar?.members?.find(member => member.role === 'owner') ?? calendar?.members?.[0];

                    return (
                      <button
                        type="button"
                        key={base.professionalId}
                        className={[
                          'payments-professionals-list__item',
                          isActive ? 'is-active' : '',
                          pending ? 'is-pending' : ''
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => setSelectedProfessionalId(base.professionalId)}
                        aria-pressed={isActive}
                      >
                        <div className="payments-professionals-list__avatar">
                          {owner?.avatar ? (
                            <img src={owner.avatar} alt={base.professionalName || 'Profesional'} />
                          ) : (
                            <span>{(base.professionalName || 'P').charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        {!isProfessionalsSidebarCollapsed && (
                          <>
                            <div className="payments-professionals-list__content">
                              <div className="payments-professionals-list__header">
                                <span className="payments-professionals-list__name">
                                  {base.professionalName || 'Profesional sin nombre'}
                                </span>
                                {pending && (
                                  <span className="payments-professionals-list__badge payments-professionals-list__badge--pending">
                                    Pendiente
                                  </span>
                                )}
                              </div>
                              {base.professionalEmail && (
                                <span className="payments-professionals-list__email">{base.professionalEmail}</span>
                              )}
                              <div className="payments-professionals-list__meta">
                                <span>{amountLabel}</span>
                                <span>{hoursValue.toFixed(2)} h</span>
                              </div>
                              <div className="payments-professionals-list__footer">
                                <span>Próximo pago · {nextPaymentLabel}</span>
                                <span>{getPaymentMethodLabel(paymentMethod)}</span>
                              </div>
                            </div>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            </div>
          </div>

          {/* Columna derecha: Filtros, calendario, notificaciones */}
          <div className="payments-unified-sidebar__main">
          {/* Botón de actualizar */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`payments-sidebar-refresh ${isRefreshing ? 'payments-sidebar-refresh--loading' : ''}`}
          >
            <RefreshCw size={18} />
            {isRefreshing ? 'Actualizando...' : 'Actualizar datos'}
          </button>

          {/* Filtros */}
          <div className="payments-sidebar-card">
            <button
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              className={`payments-collapsible-trigger ${isFiltersExpanded ? 'payments-collapsible-trigger--expanded' : ''}`}
            >
              <h3 className="payments-sidebar-card__title">
                <Filter size={18} />
                Filtros
              </h3>
              <ChevronDown size={18} />
            </button>

            <div className={`payments-collapsible-content ${!isFiltersExpanded ? 'payments-collapsible-content--collapsed' : ''}`}>
            <div className="payments-sidebar-filters">
              <div className="payments-sidebar-filter">
                <label>Rango de fecha</label>
                <select
                  value={sidebarFilters.dateRange}
                  onChange={(e) => setSidebarFilters({ ...sidebarFilters, dateRange: e.target.value as any })}
                >
                  <option value="all">Todos</option>
                  <option value="week">Última semana</option>
                  <option value="month">Último mes</option>
                  <option value="year">Este año</option>
                </select>
              </div>

              <div className="payments-sidebar-filter">
                <label>Estado</label>
                <select
                  value={sidebarFilters.status}
                  onChange={(e) => setSidebarFilters({ ...sidebarFilters, status: e.target.value as any })}
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendientes</option>
                  <option value="paid">Pagados</option>
                </select>
              </div>

              <div className="payments-sidebar-filter">
                <label>Método de pago</label>
                <select
                  value={sidebarFilters.paymentMethod}
                  onChange={(e) => setSidebarFilters({ ...sidebarFilters, paymentMethod: e.target.value as any })}
                >
                  <option value="all">Todos</option>
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="bizum">Bizum</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div className="payments-sidebar-filter">
                <label>Buscar profesional</label>
                <input
                  type="text"
                  placeholder="Nombre del profesional..."
                  value={sidebarFilters.searchTerm}
                  onChange={(e) => setSidebarFilters({ ...sidebarFilters, searchTerm: e.target.value })}
                />
              </div>
            </div>
            </div>
          </div>

          {/* Mini calendario */}
          <div className="payments-sidebar-card">
            <div className="payments-sidebar-card__header">
              <h3 className="payments-sidebar-card__title">
                <Calendar size={18} />
                Calendario
              </h3>
            </div>

            <div className="payments-mini-calendar">
              <div className="payments-mini-calendar__header">
                <button
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))}
                  className="payments-mini-calendar__nav"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="payments-mini-calendar__month">
                  {MONTH_LABELS[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                </div>
                <button
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}
                  className="payments-mini-calendar__nav"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="payments-mini-calendar__weekdays">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
                  <div key={i} className="payments-mini-calendar__weekday">{day}</div>
                ))}
              </div>

              <div className="payments-mini-calendar__days">
                {(() => {
                  const year = calendarDate.getFullYear();
                  const month = calendarDate.getMonth();
                  const firstDay = new Date(year, month, 1).getDay();
                  const daysCount = new Date(year, month + 1, 0).getDate();
                  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Lunes = 0
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  const days = [];

                  // Días vacíos antes del primer día
                  for (let i = 0; i < adjustedFirstDay; i++) {
                    days.push(<div key={`empty-${i}`} className="payments-mini-calendar__day payments-mini-calendar__day--empty"></div>);
                  }

                  // Días del mes
                  for (let day = 1; day <= daysCount; day++) {
                    const date = new Date(year, month, day);
                    date.setHours(0, 0, 0, 0);
                    const isToday = date.getTime() === today.getTime();
                    const hasPayment = scheduledPayments.some(p => {
                      const pDate = new Date(p.nextDate);
                      pDate.setHours(0, 0, 0, 0);
                      return pDate.getTime() === date.getTime();
                    });

                    days.push(
                      <div
                        key={day}
                        className={`payments-mini-calendar__day ${isToday ? 'payments-mini-calendar__day--today' : ''} ${hasPayment ? 'payments-mini-calendar__day--payment' : ''}`}
                      >
                        {day}
                      </div>
                    );
                  }

                  return days;
                })()}
              </div>
            </div>
          </div>

          {/* Notificaciones importantes */}
          <div className="payments-sidebar-card">
            <div className="payments-sidebar-card__header">
              <h3 className="payments-sidebar-card__title">
                <Bell size={18} />
                Notificaciones
              </h3>
            </div>

            <div className="payments-notifications">
              {/* Próximos pagos (7 días) */}
              {(() => {
                const upcomingPayments = scheduledPayments.filter(p => {
                  const daysUntil = Math.ceil((p.nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return daysUntil >= 0 && daysUntil <= 7;
                }).slice(0, 3);

                return upcomingPayments.length > 0 ? (
                  <div className="payments-notification-group">
                    <h4 className="payments-notification-group__title">Próximos pagos</h4>
                    {upcomingPayments.map(payment => (
                      <div key={payment.professionalId} className="payments-notification-item payments-notification-item--warning">
                        <div className="payments-notification-item__icon">⏰</div>
                        <div className="payments-notification-item__content">
                          <strong>{payment.professionalName}</strong>
                          <span>{formatRelativeDate(payment.nextDate)} • {formatCurrency(payment.amount, 'EUR')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}

              {/* Profesionales sin pagar */}
              {(() => {
                const unpaidCount = statsForDisplay.filter(stat => isProfessionalPending(stat.professionalId)).length;
                return unpaidCount > 0 ? (
                  <div className="payments-notification-group">
                    <h4 className="payments-notification-group__title">Pendientes de pago</h4>
                    <div className="payments-notification-item payments-notification-item--error">
                      <div className="payments-notification-item__icon">⚠️</div>
                      <div className="payments-notification-item__content">
                        <strong>{unpaidCount} profesionales</strong>
                        <span>Con pagos pendientes este periodo</span>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Servicios sin completar */}
              {(() => {
                const pendingCount = Object.values(pendingServices).reduce((sum, data) => sum + data.count, 0);
                return pendingCount > 0 ? (
                  <div className="payments-notification-group">
                    <h4 className="payments-notification-group__title">Servicios pendientes</h4>
                    <div className="payments-notification-item payments-notification-item--info">
                      <div className="payments-notification-item__icon">📋</div>
                      <div className="payments-notification-item__content">
                        <strong>{pendingCount} servicios</strong>
                        <span>Esperando ser completados</span>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Estado financiero general */}
              <div className="payments-notification-group">
                <h4 className="payments-notification-group__title">Resumen financiero</h4>
                <div className="payments-notification-item">
                  <div className="payments-notification-item__icon">💰</div>
                  <div className="payments-notification-item__content">
                    <strong>Ingresos totales</strong>
                    <span>{formatCurrency(totalIncome, 'EUR')}</span>
                  </div>
                </div>
                <div className="payments-notification-item">
                  <div className="payments-notification-item__icon">💸</div>
                  <div className="payments-notification-item__content">
                    <strong>Nóminas pendientes</strong>
                    <span>{formatCurrency(statsForDisplay.filter(s => isProfessionalPending(s.professionalId)).reduce((sum, s) => sum + s.totalAmount, 0), 'EUR')}</span>
                  </div>
                </div>
              </div>

              {/* Si no hay notificaciones */}
              {scheduledPayments.filter(p => {
                const daysUntil = Math.ceil((p.nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                return daysUntil >= 0 && daysUntil <= 7;
              }).length === 0 &&
              statsForDisplay.filter(stat => isProfessionalPending(stat.professionalId)).length === 0 &&
              Object.values(pendingServices).reduce((sum, data) => sum + data.count, 0) === 0 && (
                <div className="payments-notifications-empty">
                  <CheckCircle size={32} style={{ opacity: 0.3 }} />
                  <p>Todo al día</p>
                  <span>No hay notificaciones importantes</span>
                </div>
              )}
            </div>
          </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DashboardStripe;
