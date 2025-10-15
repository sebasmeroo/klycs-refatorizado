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
 * @param lastPaymentDate - Última fecha de pago registrada (opcional)
 * @returns Periodo de pago actual { start, end, label, periodKey }
 */
export const getCurrentPaymentPeriod = (
  referenceDate: Date,
  paymentType: PaymentFrequency,
  paymentDay: number | null | undefined,
  lastPaymentDate?: string
): PaymentPeriod => {
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
      // Periodo semanal: desde el día de pago configurado hasta 6 días después
      const normalizedDay = normalizePaymentDay(paymentDay, 5); // Por defecto viernes (5)
      const dayOfWeek = now.getDay(); // 0=domingo, 1=lunes, etc.

      // Calcular días desde el último día de pago
      let daysSincePayday = (dayOfWeek - normalizedDay + 7) % 7;

      // Si hoy es el día de pago y aún no se ha pagado, considerar el periodo actual
      if (daysSincePayday === 0) {
        // Verificar si ya se pagó hoy
        if (lastPaymentDate) {
          const lastPaid = new Date(lastPaymentDate);
          lastPaid.setHours(0, 0, 0, 0);
          if (lastPaid.getTime() === now.getTime()) {
            // Ya se pagó hoy, iniciar nuevo periodo
            start = new Date(now);
          } else {
            // No se ha pagado hoy, retroceder 7 días
            start = new Date(now);
            start.setDate(start.getDate() - 7);
          }
        } else {
          // No hay registro, retroceder 7 días
          start = new Date(now);
          start.setDate(start.getDate() - 7);
        }
      } else {
        // Retroceder al último día de pago
        start = new Date(now);
        start.setDate(start.getDate() - daysSincePayday);
      }

      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      label = `${start.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`;
      periodKey = `${start.getFullYear()}-W${String(getWeekNumber(start)).padStart(2, '0')}`;
      break;
    }

    case 'biweekly': {
      // Periodo quincenal: días 1-15 o 16-fin de mes
      const normalizedDay = normalizePaymentDay(paymentDay, 1);
      const currentDay = now.getDate();

      if (normalizedDay <= 15) {
        // Primera quincena: día X al 15
        if (currentDay >= normalizedDay && currentDay <= 15) {
          start = new Date(now.getFullYear(), now.getMonth(), normalizedDay);
          end = new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59, 999);
        } else if (currentDay < normalizedDay) {
          // Estamos antes del día de pago, periodo anterior (segunda quincena del mes anterior)
          const prevMonth = now.getMonth() - 1;
          const prevYear = prevMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
          const adjMonth = prevMonth < 0 ? 11 : prevMonth;
          start = new Date(prevYear, adjMonth, 16);
          end = new Date(prevYear, adjMonth + 1, 0, 23, 59, 59, 999);
        } else {
          // Segunda quincena: 16 al fin de mes
          start = new Date(now.getFullYear(), now.getMonth(), 16);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }
      } else {
        // Segunda quincena: día 16 al X
        if (currentDay >= 16 && currentDay <= normalizedDay) {
          start = new Date(now.getFullYear(), now.getMonth(), 16);
          end = new Date(now.getFullYear(), now.getMonth(), normalizedDay, 23, 59, 59, 999);
        } else if (currentDay > normalizedDay) {
          // Estamos después del día de pago, periodo anterior (primera quincena)
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59, 999);
        } else {
          // Primera quincena del mes siguiente
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59, 999);
        }
      }

      label = `${start.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`;
      periodKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-Q${start.getDate() <= 15 ? '1' : '2'}`;
      break;
    }

    case 'monthly':
    default: {
      // Periodo mensual: desde el día de pago hasta el día anterior del mes siguiente
      const normalizedDay = normalizePaymentDay(paymentDay, 1);
      const currentDay = now.getDate();

      if (currentDay >= normalizedDay) {
        // Estamos en el periodo actual
        const clampedDay = clampDayOfMonth(normalizedDay, now.getFullYear(), now.getMonth());
        start = new Date(now.getFullYear(), now.getMonth(), clampedDay);

        // Fin: día anterior al día de pago del mes siguiente
        const nextMonth = now.getMonth() + 1;
        const nextYear = nextMonth > 11 ? now.getFullYear() + 1 : now.getFullYear();
        const adjMonth = nextMonth > 11 ? 0 : nextMonth;
        const clampedNextDay = clampDayOfMonth(normalizedDay, nextYear, adjMonth);
        end = new Date(nextYear, adjMonth, clampedNextDay - 1, 23, 59, 59, 999);
      } else {
        // Estamos antes del día de pago, usar periodo del mes anterior
        const prevMonth = now.getMonth() - 1;
        const prevYear = prevMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
        const adjMonth = prevMonth < 0 ? 11 : prevMonth;
        const clampedPrevDay = clampDayOfMonth(normalizedDay, prevYear, adjMonth);
        start = new Date(prevYear, adjMonth, clampedPrevDay);

        const clampedDay = clampDayOfMonth(normalizedDay, now.getFullYear(), now.getMonth());
        end = new Date(now.getFullYear(), now.getMonth(), clampedDay - 1, 23, 59, 59, 999);
      }

      label = `${start.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
      periodKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
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
