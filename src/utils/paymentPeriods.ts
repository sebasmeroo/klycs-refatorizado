import { PaymentFrequency } from '@/types/calendar';

/**
 * Utilidades para calcular periodos de pago basados en frecuencia de pago
 */

export interface PaymentPeriod {
  start: Date;
  end: Date;
  label: string;
  periodKey: string;
}

/**
 * Normalizar día de pago (evitar valores null/undefined/NaN)
 */
export const normalizePaymentDay = (paymentDay: number | null | undefined, fallback = 1): number => {
  if (paymentDay === null || paymentDay === undefined || Number.isNaN(paymentDay)) {
    return fallback;
  }
  return paymentDay;
};

/**
 * Ajustar día del mes al máximo disponible (ej: 31 en febrero → 28/29)
 */
const clampDayOfMonth = (day: number, year: number, month: number): number => {
  const maxDay = new Date(year, month + 1, 0).getDate();
  return Math.min(Math.max(day, 1), maxDay);
};

/**
 * Calcular el periodo de pago actual basado en la frecuencia y configuración
 *
 * @param referenceDate - Fecha de referencia (normalmente hoy)
 * @param paymentType - Tipo de frecuencia de pago
 * @param paymentDay - Día de pago configurado
 * @param lastPaymentDate - Última fecha de pago registrada (opcional) - DEPRECATED
 * @param scheduledPaymentDate - Fecha programada del último pago (usa esto en lugar de lastPaymentDate)
 * @returns Periodo de pago actual { start, end, label, periodKey }
 */
/**
 * ✅ Calcular el período de pago que está "EN EJECUCIÓN" hoy
 * Esto diferencia entre:
 * - El período que ya fue pagado (historical)
 * - El período actual que está en curso (running period)
 * - El período futuro
 */
export const getCurrentPaymentPeriod = (
  referenceDate: Date,
  paymentType: PaymentFrequency,
  paymentDay: number | null | undefined,
  lastPaymentDate?: string,
  scheduledPaymentDate?: string
): PaymentPeriod => {
  // ✅ LÓGICA MEJORADA:
  // - Si hay scheduledPaymentDate (inicio del nuevo ciclo), usarlo
  // - Esto detecta automáticamente cuándo pasamos a un nuevo ciclo
  // - Sin scheduledPaymentDate, caer back a lastPaymentDate para compatibilidad
  const effectiveStartDate = scheduledPaymentDate || lastPaymentDate;
  const now = new Date(referenceDate);
  now.setHours(0, 0, 0, 0);

  let start: Date;
  let end: Date;
  let label: string;
  let periodKey: string;

  switch (paymentType) {
    case 'daily': {
      // Periodo diario: desde inicio del día hasta fin del día
      start = new Date(now);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      label = start.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      periodKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      break;
    }

    case 'weekly': {
      // Periodo semanal: 7 días dinámicos desde el día de pago configurado
      // ✅ UNIFICADO: Misma lógica que biweekly y monthly
      // Si hay pago registrado, usarlo como punto de inicio. Si no, calcular desde hoy.

      let paymentStartDate: Date;

      if (effectiveStartDate) {
        // ✅ Hay pago registrado: usar esa fecha como inicio del período actual
        paymentStartDate = new Date(effectiveStartDate);
        paymentStartDate.setHours(0, 0, 0, 0);

        // El período actual empieza desde el pago
        start = new Date(paymentStartDate);
      } else {
        // Sin pago registrado: calcular dinámicamente desde hoy
        const normalizedDay = normalizePaymentDay(paymentDay, 5); // Por defecto viernes (5)
        const dayOfWeek = now.getDay(); // 0=domingo, 1=lunes, etc.

        // Calcular días desde el último día de pago (hacia atrás)
        let daysSincePayday = (dayOfWeek - normalizedDay + 7) % 7;

        start = new Date(now);
        start.setDate(start.getDate() - daysSincePayday);
      }

      // El período termina 6 días después (7 días totales)
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      label = `${start.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`;
      // ✅ CLAVE: Usar YYYY-MM-DD como biweekly y monthly, NO ISO week number
      periodKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      break;
    }

    case 'biweekly': {
      // Periodo quincenal: 15 días dinámicos desde el día de pago configurado
      // ✅ IDÉNTICO A WEEKLY Y MONTHLY: Misma lógica, solo cambia intervalo de días
      // Si hay pago registrado, usarlo como punto de inicio. Si no, calcular desde hoy.

      let daysSincePay: number;
      let paymentStartDate: Date;

      if (effectiveStartDate) {
        // ✅ Hay pago registrado: usar esa fecha como inicio del período actual
        paymentStartDate = new Date(effectiveStartDate);
        paymentStartDate.setHours(0, 0, 0, 0);

        // El período actual empieza desde el pago
        start = new Date(paymentStartDate);
      } else {
        // Sin pago registrado: calcular dinámicamente desde hoy
        const normalizedDay = normalizePaymentDay(paymentDay, 1);
        const currentDay = now.getDate();
        daysSincePay = currentDay - normalizedDay;

        if (daysSincePay < 0) {
          // Aún no llegamos al día configurado, retroceder al mes anterior
          const prevMonth = now.getMonth() - 1;
          const prevYear = prevMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
          const adjMonth = prevMonth < 0 ? 11 : prevMonth;
          const clampedDay = clampDayOfMonth(normalizedDay, prevYear, adjMonth);
          start = new Date(prevYear, adjMonth, clampedDay);
        } else {
          // Ya pasó el día configurado
          const clampedDay = clampDayOfMonth(normalizedDay, now.getFullYear(), now.getMonth());
          start = new Date(now.getFullYear(), now.getMonth(), clampedDay);
        }
      }

      // El período termina 14 días después (15 días totales)
      end = new Date(start);
      end.setDate(end.getDate() + 14);
      end.setHours(23, 59, 59, 999);

      label = `${start.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`;
      // ✅ CLAVE: Usar fecha de inicio del período como periodKey, idéntico al semanal
      periodKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      break;
    }

    case 'monthly':
    default: {
      // Periodo mensual: 30 días dinámicos desde el día de pago configurado
      // ✅ IDÉNTICO A WEEKLY Y BIWEEKLY: Misma lógica, solo cambia intervalo de días
      // Si hay pago registrado, usarlo como punto de inicio. Si no, calcular desde hoy.

      let daysSincePay: number;
      let paymentStartDate: Date;

      if (effectiveStartDate) {
        // ✅ Hay pago registrado: usar esa fecha como inicio del período actual
        paymentStartDate = new Date(effectiveStartDate);
        paymentStartDate.setHours(0, 0, 0, 0);

        // El período actual empieza desde el pago
        start = new Date(paymentStartDate);
      } else {
        // Sin pago registrado: calcular dinámicamente desde hoy
        const normalizedDay = normalizePaymentDay(paymentDay, 1);
        const currentDay = now.getDate();
        daysSincePay = currentDay - normalizedDay;

        if (daysSincePay < 0) {
          // Aún no llegamos al día configurado, retroceder al mes anterior
          const prevMonth = now.getMonth() - 1;
          const prevYear = prevMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
          const adjMonth = prevMonth < 0 ? 11 : prevMonth;
          const clampedDay = clampDayOfMonth(normalizedDay, prevYear, adjMonth);
          start = new Date(prevYear, adjMonth, clampedDay);
        } else {
          // Ya pasó el día configurado
          const clampedDay = clampDayOfMonth(normalizedDay, now.getFullYear(), now.getMonth());
          start = new Date(now.getFullYear(), now.getMonth(), clampedDay);
        }
      }

      // El período termina 29 días después (30 días totales)
      end = new Date(start);
      end.setDate(end.getDate() + 29);
      end.setHours(23, 59, 59, 999);

      label = `${start.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`;
      // ✅ CLAVE: Usar fecha de inicio del período como periodKey, idéntico al semanal
      periodKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      break;
    }
  }

  return {
    start,
    end,
    label,
    periodKey
  };
};

/**
 * Calcular el número de semana del año (ISO 8601)
 */
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

/**
 * Verificar si una fecha está dentro de un periodo de pago
 */
export const isDateInPaymentPeriod = (date: Date, period: PaymentPeriod): boolean => {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate >= period.start && checkDate <= period.end;
};

/**
 * Obtener todos los periodos de pago para un año dado
 */
export const getPaymentPeriodsForYear = (
  year: number,
  paymentType: PaymentFrequency,
  paymentDay: number | null | undefined
): PaymentPeriod[] => {
  const periods: PaymentPeriod[] = [];
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31);

  let currentDate = new Date(startOfYear);

  while (currentDate <= endOfYear) {
    const period = getCurrentPaymentPeriod(currentDate, paymentType, paymentDay);

    // Evitar duplicados
    if (!periods.some(p => p.periodKey === period.periodKey)) {
      periods.push(period);
    }

    // Avanzar al siguiente periodo
    switch (paymentType) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'biweekly':
        currentDate.setDate(currentDate.getDate() + 15);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }

  return periods;
};
