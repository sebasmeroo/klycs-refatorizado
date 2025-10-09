import { CalendarEventService } from '@/services/collaborativeCalendar';
import { WorkHoursStats } from '@/types/calendar';

interface ProfessionalCalendarConfig {
  id: string;
  name: string;
  hourlyRate?: number;
  currency?: string;
}

class CurrencyFormatterRegistry {
  private static cache = new Map<string, Intl.NumberFormat>();

  static format({ amount, currency, locale }: { amount: number; currency: string; locale: string }): string {
    const normalizedCurrency = currency?.trim().toUpperCase() || 'EUR';
    const normalizedLocale = locale || 'es-ES';
    const cacheKey = `${normalizedLocale}-${normalizedCurrency}`;

    let formatter = this.cache.get(cacheKey);

    if (!formatter) {
      formatter = this.createFormatter(normalizedLocale, normalizedCurrency);
      this.cache.set(cacheKey, formatter);
    }

    return formatter.format(amount);
  }

  private static createFormatter(locale: string, currency: string): Intl.NumberFormat {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } catch (error) {
      console.warn('Fallo creando Intl.NumberFormat, usando formato por defecto', { locale, currency, error });
      const fallbackCurrency = currency === 'EUR' ? currency : 'EUR';
      try {
        return new Intl.NumberFormat(locale || 'es-ES', {
          style: 'currency',
          currency: fallbackCurrency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      } catch (fallbackError) {
        console.warn('Fallo creando formatter de respaldo, devolviendo formatter simple', { fallbackError });
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }
    }
  }
}

/**
 * Servicio para calcular horas trabajadas y analytics de profesionales
 */
export class WorkHoursAnalyticsService {
  /**
   * Calcular horas trabajadas de un profesional en un rango de fechas
   * @param calendarId - ID del calendario del profesional
   * @param startDate - Fecha de inicio
   * @param endDate - Fecha de fin
   * @param onlyCompleted - Si true, solo cuenta servicios marcados como completados
   */
  static async calculateWorkHours(
    calendarId: string,
    startDate: Date,
    endDate: Date,
    onlyCompleted: boolean = true
  ): Promise<number> {
    try {
      const { events } = await CalendarEventService.getCalendarEvents([
        calendarId
      ], startDate, endDate);

      const totalMinutes = events.reduce((sum, event) => {
        if (onlyCompleted && event.serviceStatus !== 'completed') {
          return sum;
        }

        if (event.duration && event.duration > 0) {
          return sum + event.duration;
        }

        return sum;
      }, 0);

      return totalMinutes / 60; // Convertir a horas
    } catch (error) {
      console.error('Error al calcular horas trabajadas:', error);
      return 0;
    }
  }

  /**
   * Obtener estadísticas completas de horas trabajadas para un profesional
   * @param onlyCompleted - Si true, solo cuenta servicios completados
   */
  static async getProfessionalStats(
    calendar: ProfessionalCalendarConfig,
    startYear: number = new Date().getFullYear(),
    onlyCompleted: boolean = true
  ): Promise<WorkHoursStats> {
    const {
      id: calendarId,
      name: professionalName,
      hourlyRate: rawHourlyRate,
      currency: rawCurrency
    } = calendar;

    const hourlyRate = typeof rawHourlyRate === 'number' && !Number.isNaN(rawHourlyRate)
      ? rawHourlyRate
      : 0;
    const currency = rawCurrency || 'EUR';

    try {
      const yearStart = new Date(startYear, 0, 1);
      const yearEnd = new Date(startYear, 11, 31, 23, 59, 59);

      const { events } = await CalendarEventService.getCalendarEvents([
        calendarId
      ], yearStart, yearEnd);

      // Agrupar por mes
      const monthlyData: Record<string, { hours: number; events: number; amount: number }> = {};
      let totalHours = 0;
      let totalAmount = 0;

      events.forEach(event => {
        if (onlyCompleted && event.serviceStatus !== 'completed') {
          return;
        }

        if (event.duration && event.duration > 0) {
          const hours = event.duration / 60;
          const amount = hours * hourlyRate;
          totalHours += hours;
          totalAmount += amount;

          const eventDate = event.startDate instanceof Date
            ? event.startDate
            : new Date(event.startDate);

          if (Number.isNaN(eventDate.getTime())) {
            return;
          }
          const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;

          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { hours: 0, events: 0, amount: 0 };
          }

          monthlyData[monthKey].hours += hours;
          monthlyData[monthKey].events++;
          monthlyData[monthKey].amount += amount;
        }
      });

      // Convertir a array y ordenar por mes
      const monthlyBreakdown = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          hours: Math.round(data.hours * 100) / 100,
          events: data.events,
          amount: Math.round(data.amount * 100) / 100
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Calcular promedio mensual en horas (mantenido para compatibilidad)
      const monthsWithData = monthlyBreakdown.length;
      const averagePerMonth = monthsWithData > 0
        ? Math.round((totalHours / monthsWithData) * 100) / 100
        : 0;

      return {
        professionalId: calendarId,
        professionalName,
        totalHours: Math.round(totalHours * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        currency,
        hourlyRate,
        monthlyBreakdown,
        yearlyTotal: Math.round(totalHours * 100) / 100,
        averagePerMonth
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {
        professionalId: calendarId,
        professionalName,
        totalHours: 0,
        totalAmount: 0,
        currency,
        hourlyRate,
        monthlyBreakdown: [],
        yearlyTotal: 0,
        averagePerMonth: 0
      };
    }
  }

  /**
   * Obtener estadísticas de todos los profesionales
   * @param onlyCompleted - Si true, solo cuenta servicios completados
   */
  static async getAllProfessionalsStats(
    calendars: ProfessionalCalendarConfig[],
    startYear: number = new Date().getFullYear(),
    onlyCompleted: boolean = true
  ): Promise<WorkHoursStats[]> {
    try {
      const statsPromises = calendars.map(cal =>
        this.getProfessionalStats(cal, startYear, onlyCompleted)
      );

      return await Promise.all(statsPromises);
    } catch (error) {
      console.error('Error al obtener estadísticas de todos los profesionales:', error);
      return [];
    }
  }

  /**
   * Formatear horas en formato legible
   */
  static formatHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);

    if (m === 0) {
      return `${h}h`;
    }

    return `${h}h ${m}m`;
  }

  /**
   * Formatear cantidades monetarias en función de la moneda
  */
  static formatCurrency(amount: number, currency: string = 'EUR', locale: string = 'es-ES'): string {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      return '0.00 EUR';
    }

    const safeCurrency = currency || 'EUR';
    const safeAmount = Math.round(amount * 100) / 100;

    try {
      return CurrencyFormatterRegistry.format({
        amount: safeAmount,
        currency: safeCurrency,
        locale
      });
    } catch (error) {
      console.warn('Error al formatear moneda, usando fallback', { amount, currency: safeCurrency, error });
      return `${safeAmount.toFixed(2)} ${safeCurrency}`;
    }
  }
}
