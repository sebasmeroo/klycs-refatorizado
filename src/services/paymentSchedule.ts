import { Timestamp, updateDoc, deleteField, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CollaborativeCalendarService } from '@/services/collaborativeCalendar';
import { WorkHoursAnalyticsService } from '@/services/workHoursAnalytics';
import {
  buildPaymentContext,
  buildPeriodFromRecord,
  getLatestPaidRecord,
  getLatestPaymentRecord,
  getRecordReferenceDate
} from '@/utils/paymentCycleContext';
import { PaymentFrequency, PaymentMethod } from '@/types/calendar';

export type SchedulePeriod = {
  periodKey: string;
  label: string;
  start: Date;
  end: Date;
  status: 'pending' | 'paid';
  scheduledPaymentDate?: Date | null;
  actualPaymentDate?: Date | null;
  amountPaid?: number | null;
};

export type ScheduleSummary = {
  current: SchedulePeriod | null;
  next: SchedulePeriod | null;
  previous: SchedulePeriod | null;
  paymentType: PaymentFrequency;
  paymentDay: number | null;
  preferredMethod: PaymentMethod;
  intervalDays: number;
  nextCycleStart: Date | null;
  nextCycleEnd: Date | null;
  currentRecord?: any | null;
  latestRecord?: any | null;
  latestPaidRecord?: any | null;
  payoutRecords: Record<string, any>;
};

const normalizeDate = (value?: string | Date | null) => {
  if (!value) return null;
  const parsed = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const toSchedulePeriod = (
  period: { periodKey: string; label: string; start: Date; end: Date },
  record?: any | null
): SchedulePeriod => {
  const scheduledPaymentDate = normalizeDate(record?.scheduledPaymentDate);
  const actualPaymentDate = normalizeDate(record?.actualPaymentDate);

  return {
    periodKey: period.periodKey,
    label: period.label,
    start: period.start,
    end: period.end,
    status: (record?.status as 'pending' | 'paid') ?? 'pending',
    scheduledPaymentDate,
    actualPaymentDate,
    amountPaid: typeof record?.amountPaid === 'number' ? record.amountPaid : null
  };
};

export const computeScheduleFromCalendar = (
  calendar: any,
  options: { referenceDate?: Date; allowFutureStart?: boolean } = {}
): ScheduleSummary | null => {
  const context = buildPaymentContext(calendar, {
    today: options.referenceDate,
    allowFutureStart: options.allowFutureStart
  });
  const payoutRecords = calendar.payoutRecords ?? {};

  if (!context) {
    return {
      current: null,
      next: null,
      previous: null,
      paymentType: calendar.payoutDetails?.paymentType ?? 'monthly',
      paymentDay: typeof calendar.payoutDetails?.paymentDay === 'number'
        ? calendar.payoutDetails.paymentDay
        : null,
      preferredMethod: calendar.payoutDetails?.paymentMethod ?? 'transfer',
      intervalDays: 0,
      nextCycleStart: null,
      nextCycleEnd: null,
      currentRecord: null,
      latestRecord: getLatestPaymentRecord(payoutRecords),
      latestPaidRecord: getLatestPaidRecord(payoutRecords),
      payoutRecords
    };
  }

  const currentRecord = context.currentPeriod
    ? payoutRecords?.[context.currentPeriod.periodKey]
    : null;
  const nextRecord = context.nextPeriod
    ? payoutRecords?.[context.nextPeriod.periodKey]
    : null;

  const latestPaid = getLatestPaidRecord(payoutRecords);
  const previousPeriod = latestPaid
    ? buildPeriodFromRecord(
        latestPaid.periodKey,
        latestPaid,
        calendar.payoutDetails?.paymentType ?? 'monthly',
        typeof calendar.payoutDetails?.paymentDay === 'number'
          ? calendar.payoutDetails.paymentDay
          : null
      )
    : null;

  return {
    current: context.currentPeriod ? toSchedulePeriod(context.currentPeriod, currentRecord) : null,
    next: context.nextPeriod ? toSchedulePeriod(context.nextPeriod, nextRecord) : null,
    previous: previousPeriod
      ? toSchedulePeriod(previousPeriod, payoutRecords?.[previousPeriod.periodKey])
      : null,
    paymentType: context.paymentType,
    paymentDay: context.paymentDay,
    preferredMethod: context.preferredMethod,
    intervalDays: context.intervalDays,
    nextCycleStart: normalizeDate(context.nextCycleStart),
    nextCycleEnd: normalizeDate(context.nextCycleEnd),
    currentRecord: context.currentRecord ?? currentRecord ?? null,
    latestRecord: context.latestRecord ?? getLatestPaymentRecord(payoutRecords),
    latestPaidRecord: context.latestPaidRecord ?? latestPaid,
    payoutRecords
  };
};

export const getSchedule = async (
  calendarId: string,
  options: { referenceDate?: Date } = {}
): Promise<ScheduleSummary | null> => {
  const calendar = await CollaborativeCalendarService.getCalendarById(calendarId);
  if (!calendar) return null;
  return computeScheduleFromCalendar(calendar, options);
};

export const aggregateHoursForPeriod = async (
  calendarId: string,
  period: SchedulePeriod,
  onlyCompleted = true
) => {
  return WorkHoursAnalyticsService.calculateWorkHours(
    calendarId,
    period.start,
    period.end,
    onlyCompleted
  );
};

export type MarkPaymentOptions = {
  calendarId: string;
  periodKey: string;
  amount?: number;
  paymentMethod?: PaymentMethod;
  maintainSchedule?: boolean;
  note?: string | null;
  payoutDetails?: {
    iban?: string;
    bank?: string;
    notes?: string;
    paypalEmail?: string;
    paymentType?: PaymentFrequency;
    paymentDay?: number;
    paymentMethod?: PaymentMethod;
    customHourlyRate?: number;
  };
};

export const markPaymentPaid = async ({
  calendarId,
  periodKey,
  amount,
  paymentMethod,
  maintainSchedule = false,
  note,
  payoutDetails
}: MarkPaymentOptions): Promise<ScheduleSummary | null> => {
  const calendar = await CollaborativeCalendarService.getCalendarById(calendarId);
  if (!calendar) return null;

  const context = buildPaymentContext(calendar, { allowFutureStart: maintainSchedule });
  if (!context) return null;

  const targetPeriod = context.currentPeriod.periodKey === periodKey
    ? context.currentPeriod
    : buildPeriodFromRecord(
        periodKey,
        calendar.payoutRecords?.[periodKey],
        context.paymentType,
        context.paymentDay
      );

  const cycleStart = normalizeDate(targetPeriod.start);
  const cycleEnd = normalizeDate(targetPeriod.end);

  const today = normalizeDate(new Date()) ?? new Date();

  const intervalDays = Math.max(
    1,
    Math.round(((cycleEnd?.getTime() ?? today.getTime()) - (cycleStart?.getTime() ?? today.getTime())) / (24 * 60 * 60 * 1000)) + 1
  );

  const nextCycleStart = maintainSchedule
    ? normalizeDate(context.nextCycleStart)
    : new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const nextCycleEnd = normalizeDate(context.nextCycleEnd)
    ?? (nextCycleStart ? new Date(nextCycleStart.getTime() + (intervalDays - 1) * 24 * 60 * 60 * 1000) : null);

  const recordPayload: {
    status: 'pending' | 'paid';
    actualPaymentDate?: string;
    scheduledPaymentDate?: string;
    lastPaymentDate?: string;
    lastPaymentBy?: string;
    note?: string;
    paymentMethod?: PaymentMethod;
    amountPaid?: number;
    cycleStart?: string;
    cycleEnd?: string;
    nextCycleStart?: string;
    nextCycleEnd?: string;
  } = {
    status: 'paid'
  };

  const actualPaymentISO = today.toISOString().split('T')[0];
  recordPayload.actualPaymentDate = actualPaymentISO;
  recordPayload.lastPaymentDate = actualPaymentISO;
  if (calendar.ownerId) {
    recordPayload.lastPaymentBy = calendar.ownerId;
  }

  const scheduledPaymentISO = cycleEnd?.toISOString().split('T')[0];
  if (scheduledPaymentISO) {
    recordPayload.scheduledPaymentDate = scheduledPaymentISO;
  }

  if (note && note.trim().length > 0) {
    recordPayload.note = note.trim();
  }

  recordPayload.paymentMethod =
    paymentMethod
    ?? payoutDetails?.paymentMethod
    ?? calendar.payoutDetails?.paymentMethod
    ?? 'transfer';

  if (typeof amount === 'number') {
    recordPayload.amountPaid = Number(amount.toFixed(2));
  }

  const cycleStartISO = cycleStart?.toISOString().split('T')[0];
  if (cycleStartISO) {
    recordPayload.cycleStart = cycleStartISO;
  }

  if (scheduledPaymentISO) {
    recordPayload.cycleEnd = scheduledPaymentISO;
  } else if (cycleEnd) {
    recordPayload.cycleEnd = cycleEnd.toISOString().split('T')[0];
  }

  const nextCycleStartISO = nextCycleStart?.toISOString().split('T')[0];
  if (nextCycleStartISO) {
    recordPayload.nextCycleStart = nextCycleStartISO;
  }

  const nextCycleEndISO = nextCycleEnd?.toISOString().split('T')[0];
  if (nextCycleEndISO) {
    recordPayload.nextCycleEnd = nextCycleEndISO;
  }

  await CollaborativeCalendarService.updatePayoutDetailsAndRecord(
    calendarId,
    periodKey,
    {
      ...payoutDetails,
      paymentMethod:
        paymentMethod
        ?? payoutDetails?.paymentMethod
        ?? calendar.payoutDetails?.paymentMethod
        ?? 'transfer'
    },
    recordPayload
  );

  if (nextCycleStart && nextCycleEnd) {
    await CollaborativeCalendarService.updatePayoutRecord(calendarId, nextCycleStart.toISOString().split('T')[0], {
      status: 'pending',
      scheduledPaymentDate: nextCycleEnd.toISOString().split('T')[0],
      cycleStart: nextCycleStart.toISOString().split('T')[0],
      cycleEnd: nextCycleEnd.toISOString().split('T')[0],
      paymentMethod: paymentMethod ?? calendar.payoutDetails?.paymentMethod ?? 'transfer'
    });
  }

  return getSchedule(calendarId, { referenceDate: today });
};
