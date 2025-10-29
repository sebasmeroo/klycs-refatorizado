import { PaymentFrequency, PaymentMethod } from '@/types/calendar';
import { getCurrentPaymentPeriod, PaymentPeriod } from '@/utils/paymentPeriods';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const normalizeDate = (value: Date | string | null | undefined): Date | null => {
  if (!value) return null;
  let normalized: Date | null = null;

  if (value instanceof Date) {
    normalized = new Date(value.getTime());
  } else if (typeof value === 'string') {
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const year = Number(isoMatch[1]);
      const month = Number(isoMatch[2]) - 1;
      const day = Number(isoMatch[3]);
      normalized = new Date(year, month, day);
    } else {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        normalized = parsed;
      }
    }
  }

  if (!normalized) {
    return null;
  }

  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const addDays = (date: Date | string, days: number): Date => {
  const base = normalizeDate(date);
  if (!base) {
    const fallback = new Date();
    fallback.setHours(0, 0, 0, 0);
    return fallback;
  }
  const result = new Date(base.getTime());
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

const resolveCandidateDate = (
  value: string | null | undefined,
  today: Date,
  allowFuture: boolean = false
): string | undefined => {
  if (!value) return undefined;
  const parsed = normalizeDate(new Date(value));
  if (!parsed) return undefined;
  if (!allowFuture && parsed.getTime() > today.getTime()) return undefined;
  return toISODate(parsed);
};

const resolveStartFromRecord = (
  record: any,
  today: Date,
  allowFuture: boolean = false
): string | undefined => {
  if (!record) return undefined;
  return (
    resolveCandidateDate(record.cycleStart, today, allowFuture) ??
    resolveCandidateDate(record.periodKey, today, allowFuture) ??
    resolveCandidateDate(record.scheduledPaymentDate, today, allowFuture)
  );
};

export const buildCurrentCycle = (
  now: Date,
  paymentType: PaymentFrequency,
  paymentDay: number | null | undefined,
  payoutRecords?: Record<string, any>,
  options: { allowFutureStart?: boolean } = {}
): {
  period: PaymentPeriod;
  recordKey: string;
  intervalDays: number;
  currentRecord?: any;
  latestRecord?: any;
  latestPaidRecord?: any;
} => {
  const today = normalizeDate(now) ?? new Date(now);
  const baseIntervalDays = getIntervalDays(paymentType);
  const latestRecord = getLatestPaymentRecord(payoutRecords);
  const latestPaidRecord = getLatestPaidRecord(payoutRecords);
  const allowFutureStart = options.allowFutureStart ?? false;

  const cycleStartOverride = (() => {
    if (latestRecord?.status === 'pending') {
      const candidateDate =
        normalizeDate(latestRecord.cycleStart)
        ?? normalizeDate(latestRecord.periodKey)
        ?? normalizeDate(latestRecord.scheduledPaymentDate);
      if (candidateDate) {
        const diffDays = Math.round((candidateDate.getTime() - today.getTime()) / DAY_IN_MS);
        if (
          candidateDate.getTime() <= today.getTime()
          || allowFutureStart
          || (diffDays >= 0 && diffDays <= baseIntervalDays)
        ) {
          return toISODate(candidateDate);
        }
      }
    }

    if (latestPaidRecord?.nextCycleStart) {
      const nextStartDate = normalizeDate(new Date(latestPaidRecord.nextCycleStart));
      if (nextStartDate) {
        const diffDays = Math.round((nextStartDate.getTime() - today.getTime()) / DAY_IN_MS);
        if (nextStartDate.getTime() <= today.getTime() || allowFutureStart || (diffDays > 0 && diffDays <= baseIntervalDays)) {
          return toISODate(nextStartDate);
        }
      }
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

    const fallbackFromLatestRecord = resolveStartFromRecord(
      latestRecord,
      today,
      allowFutureStart || latestRecord?.status === 'pending'
    );
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

  let derivedKey = currentPeriodBase.periodKey;

  let currentRecord = payoutRecords?.[derivedKey]
    ?? (latestRecord?.periodKey === derivedKey ? latestRecord : undefined);

  if (currentRecord?.cycleStart) {
    const recordStart = normalizeDate(new Date(currentRecord.cycleStart));
    if (recordStart) {
      const diffDays = Math.round((recordStart.getTime() - today.getTime()) / DAY_IN_MS);
      if (
        recordStart.getTime() <= today.getTime()
        || allowFutureStart
        || (diffDays >= 0 && diffDays <= baseIntervalDays)
      ) {
        cycleStart = recordStart;
        derivedKey = recordStart.toISOString().split('T')[0];
        currentRecord = payoutRecords?.[derivedKey] ?? currentRecord;
      }
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
      periodKey: derivedKey
    },
    recordKey: derivedKey,
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
  allowFutureStart?: boolean;
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

  const allowFutureStart = options.allowFutureStart ?? true;

  const {
    period: currentPeriod,
    recordKey,
    intervalDays,
    currentRecord,
    latestRecord,
    latestPaidRecord
  } = buildCurrentCycle(today, paymentType, paymentDay, payoutRecords, { allowFutureStart });

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
