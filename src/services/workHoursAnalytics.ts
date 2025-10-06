import { CalendarEventService } from '@/services/collaborativeCalendar';
import { WorkHoursStats } from '@/types/calendar';

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
    calendarId: string,
    professionalName: string,
    startYear: number = new Date().getFullYear(),
    onlyCompleted: boolean = true
  ): Promise<WorkHoursStats> {
    try {
      const yearStart = new Date(startYear, 0, 1);
      const yearEnd = new Date(startYear, 11, 31, 23, 59, 59);

      const { events } = await CalendarEventService.getCalendarEvents([
        calendarId
      ], yearStart, yearEnd);

      // Agrupar por mes
      const monthlyData: Record<string, { hours: number; events: number }> = {};
      let totalHours = 0;

      events.forEach(event => {
        if (onlyCompleted && event.serviceStatus !== 'completed') {
          return;
        }

        if (event.duration && event.duration > 0) {
          const hours = event.duration / 60;
          totalHours += hours;

          const eventDate = event.startDate;
          const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;

          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { hours: 0, events: 0 };
          }

          monthlyData[monthKey].hours += hours;
          monthlyData[monthKey].events++;
        }
      });

      // Convertir a array y ordenar por mes
      const monthlyBreakdown = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          hours: Math.round(data.hours * 100) / 100,
          events: data.events
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Calcular promedio mensual
      const monthsWithData = monthlyBreakdown.length;
      const averagePerMonth = monthsWithData > 0 
        ? Math.round((totalHours / monthsWithData) * 100) / 100 
        : 0;

      return {
        professionalId: calendarId,
        professionalName,
        totalHours: Math.round(totalHours * 100) / 100,
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
    calendars: Array<{ id: string; name: string }>,
    startYear: number = new Date().getFullYear(),
    onlyCompleted: boolean = true
  ): Promise<WorkHoursStats[]> {
    try {
      const statsPromises = calendars.map(cal =>
        this.getProfessionalStats(cal.id, cal.name, startYear, onlyCompleted)
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
}
