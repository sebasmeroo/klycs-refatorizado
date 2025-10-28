import { PaymentFrequency, PaymentMethod } from '@/types/calendar';
import { getCurrentPaymentPeriod, PaymentPeriod } from '@/utils/paymentPeriods';

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

const toISODate = (date: Date | null | undefined): string | undefined => {
  if (!date) return undefined;
  return date.toISOString().split('T')[0];
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

export const getRecordReferenceDate = (record: any, periodKey: string): Date | null => {
  if (!record) return null;

  const candidates = [
    record.actualPaymentDate,
    record.lastPaymentDate,
    record.scheduledPaymentDate,
    record.cycleEnd,
    record.cycleStart,
    periodKey
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const parsed = new Date(candidate);
    if (Number.isNaN(parsed.getTime())) continue;
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }

  return null;
};

export const getLatestPaymentRecord = (payoutRecords?: Record<string, any>) => {
  if (!payoutRecords) return null;
  let latest: any = null;
  let latestDate: Date | null = null;

  Object.entries(payoutRecords).forEach(([periodKey, record]) => {
    const referenceDate = getRecordReferenceDate(record, periodKey);
    if (!referenceDate) return;

    if (!latest || !latestDate || referenceDate.getTime() > latestDate.getTime()) {
      latest = { periodKey, ...record };
      latestDate = referenceDate;
    }
  });

  return latest;
};

export const getLatestPaidRecord = (payoutRecords?: Record<string, any>) => {
  if (!payoutRecords) return null;
  let latest: any = null;
  let latestDate: Date | null = null;

  Object.entries(payoutRecords).forEach(([periodKey, record]) => {
    if (record?.status !== 'paid') return;
    const referenceDate = getRecordReferenceDate(record, periodKey);
    if (!referenceDate) return;

    if (!latest || !latestDate || referenceDate.getTime() > latestDate.getTime()) {
      latest = { periodKey, ...record };
      latestDate = referenceDate;
    }
  });

  return latest;
};

const resolveCandidateDate = (value: string | null | undefined, today: Date): string | undefined => {
  if (!value) return undefined;
  const parsed = normalizeDate(new Date(value));
  if (!parsed) return undefined;
  if (parsed.getTime() > today.getTime()) return undefined;
  return toISODate(parsed);
};

const resolveStartFromRecord = (record: any, today: Date): string | undefined => {
  if (!record) return undefined;
  return (
    resolveCandidateDate(record.cycleStart, today) ??
    resolveCandidateDate(record.periodKey, today) ??
    resolveCandidateDate(record.scheduledPaymentDate, today)
  );
};

export const buildCurrentCycle = (
  now: Date,
  paymentType: PaymentFrequency,
  paymentDay: number | null | undefined,
  payoutRecords?: Record<string, any>
): {
  period: PaymentPeriod;
  recordKey: string;
  intervalDays: number;
  currentRecord?: any;
  latestRecord?: any;
  latestPaidRecord?: any;
} => {
  const today = normalizeDate(now) ?? new Date(now);
  const latestRecord = getLatestPaymentRecord(payoutRecords);
  const latestPaidRecord = getLatestPaidRecord(payoutRecords);

  const cycleStartOverride = (() => {
    if (latestRecord?.status === 'pending') {
      const candidate = resolveStartFromRecord(latestRecord, today);
      if (candidate) return candidate;
    }

    const nextCycleCandidate = resolveCandidateDate(latestPaidRecord?.nextCycleStart, today);
    if (nextCycleCandidate) {
      return nextCycleCandidate;
    }

    if (latestPaidRecord?.cycleEnd) {
      const endDate = normalizeDate(new Date(latestPaidRecord.cycleEnd));
      if (endDate) {
        const nextStart = addDays(endDate, 1);
        if (nextStart.getTime() <= today.getTime()) {
          return toISODate(nextStart);
        }
      }
    }

    const fallbackFromLatestRecord = resolveStartFromRecord(latestRecord, today);
    if (fallbackFromLatestRecord) {
      return fallbackFromLatestRecord;
    }

    return undefined;
  })();

  const currentPeriodBase = getCurrentPaymentPeriod(
    now,
    paymentType,
    paymentDay,
    latestRecord?.lastPaymentDate ?? latestPaidRecord?.lastPaymentDate,
    cycleStartOverride
  );

  let cycleStart = normalizeDate(currentPeriodBase.start) ?? currentPeriodBase.start;
  let projectedCycleEnd = normalizeDate(currentPeriodBase.end) ?? currentPeriodBase.end;

  const currentRecord = payoutRecords?.[currentPeriodBase.periodKey]
    ?? (latestRecord?.periodKey === currentPeriodBase.periodKey ? latestRecord : undefined);

  if (currentRecord?.cycleStart) {
    const recordStart = normalizeDate(new Date(currentRecord.cycleStart));
    if (recordStart && recordStart.getTime() <= today.getTime()) {
      cycleStart = recordStart;
    }
  }

  if (currentRecord?.status === 'paid' && currentRecord?.cycleEnd) {
    const recordEnd = normalizeDate(new Date(currentRecord.cycleEnd));
    if (recordEnd) {
      projectedCycleEnd = recordEnd;
    }
  } else if (currentRecord?.scheduledPaymentDate) {
    const scheduled = normalizeDate(new Date(currentRecord.scheduledPaymentDate));
    if (scheduled) {
      projectedCycleEnd = scheduled;
    }
  }

  const intervalDays = Math.max(
    1,
    Math.round((projectedCycleEnd.getTime() - cycleStart.getTime()) / DAY_IN_MS) + 1
  );

  return {
    period: {
      start: cycleStart,
      end: projectedCycleEnd,
      label: `${cycleStart.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${projectedCycleEnd.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`,
      periodKey: currentPeriodBase.periodKey
    },
    recordKey: currentPeriodBase.periodKey,
    intervalDays,
    currentRecord,
    latestRecord,
    latestPaidRecord
  };
};

export const buildPeriodFromRecord = (
  key: string,
  record: any,
  paymentType: PaymentFrequency,
  paymentDay: number | null | undefined
): PaymentPeriod => {
  const baseDate = record?.cycleStart ? new Date(record.cycleStart) : new Date(key);
  const recalculated = getCurrentPaymentPeriod(
    baseDate,
    paymentType,
    paymentDay,
    record?.lastPaymentDate,
    record?.cycleStart ?? record?.nextCycleStart ?? record?.scheduledPaymentDate
  );

  let start = record?.cycleStart
    ? normalizeDate(new Date(record.cycleStart)) ?? normalizeDate(recalculated.start) ?? recalculated.start
    : normalizeDate(recalculated.start) ?? recalculated.start;

  let end = record?.cycleEnd
    ? normalizeDate(new Date(record.cycleEnd)) ?? normalizeDate(recalculated.end) ?? recalculated.end
    : record?.scheduledPaymentDate
      ? normalizeDate(new Date(record.scheduledPaymentDate)) ?? normalizeDate(recalculated.end) ?? recalculated.end
      : normalizeDate(recalculated.end) ?? recalculated.end;

  if (record?.status === 'pending' && record?.scheduledPaymentDate) {
    const scheduled = normalizeDate(new Date(record.scheduledPaymentDate));
    if (scheduled) {
      end = scheduled;
    }
  }

  return {
    start,
    end,
    label: `${start.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`,
    periodKey: key
  };
};

export interface PaymentContextOptions {
  today?: Date;
}

export interface PaymentContext {
  paymentType: PaymentFrequency;
  paymentDay: number | null;
  preferredMethod: PaymentMethod;
  currentPeriod: PaymentPeriod;
  nextPeriod: PaymentPeriod;
  intervalDays: number;
  nextCycleStart: Date;
  nextCycleEnd: Date;
  latestRecord?: any;
  latestPaidRecord?: any;
  currentRecord?: any;
  payoutRecords: Record<string, any>;
}

export const buildPaymentContext = (
  calendar: any,
  options: PaymentContextOptions = {}
): PaymentContext | null => {
  if (!calendar) return null;

  const details = (calendar as any)?.payoutDetails ?? {};
  const paymentType: PaymentFrequency = details?.paymentType ?? 'monthly';
  const paymentDay = typeof details?.paymentDay === 'number' ? details.paymentDay : null;
  const preferredMethod: PaymentMethod = details?.paymentMethod ?? 'transfer';
  const payoutRecords = calendar.payoutRecords ?? {};
  const today = normalizeDate(options.today ?? new Date()) ?? new Date();

  const {
    period: currentPeriod,
    recordKey,
    intervalDays,
    currentRecord,
    latestRecord,
    latestPaidRecord
  } = buildCurrentCycle(today, paymentType, paymentDay, payoutRecords);

  const currentPeriodRecord = payoutRecords?.[recordKey] ?? currentRecord;
  const effectiveIntervalDays = Math.max(
    intervalDays,
    Math.round((currentPeriod.end.getTime() - currentPeriod.start.getTime()) / DAY_IN_MS) + 1
  );

  const nextCycleStart = (() => {
    if (currentPeriodRecord?.nextCycleStart) {
      return normalizeDate(new Date(currentPeriodRecord.nextCycleStart)) ?? addDays(currentPeriod.end, 1);
    }
    if (currentPeriodRecord?.status === 'paid' && currentPeriodRecord?.cycleEnd) {
      const paidEnd = normalizeDate(new Date(currentPeriodRecord.cycleEnd));
      if (paidEnd) {
        return addDays(paidEnd, 1);
      }
    }
    if (latestPaidRecord?.nextCycleStart && latestPaidRecord.periodKey === recordKey) {
      return normalizeDate(new Date(latestPaidRecord.nextCycleStart)) ?? addDays(currentPeriod.end, 1);
    }
    return addDays(currentPeriod.end, 1);
  })();

  const nextCycleEnd = (() => {
    if (currentPeriodRecord?.nextCycleEnd) {
      return normalizeDate(new Date(currentPeriodRecord.nextCycleEnd)) ?? addDays(nextCycleStart, effectiveIntervalDays - 1);
    }
    return addDays(nextCycleStart, effectiveIntervalDays - 1);
  })();

  const nextPeriod: PaymentPeriod = {
    start: nextCycleStart,
    end: nextCycleEnd,
    label: `${nextCycleStart.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${nextCycleEnd.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`,
    periodKey: nextCycleStart.toISOString().split('T')[0]
  };

  return {
    paymentType,
    paymentDay,
    preferredMethod,
    currentPeriod,
    nextPeriod,
    intervalDays: effectiveIntervalDays,
    nextCycleStart,
    nextCycleEnd,
    latestRecord,
    latestPaidRecord,
    currentRecord: currentPeriodRecord,
    payoutRecords
  };
};
