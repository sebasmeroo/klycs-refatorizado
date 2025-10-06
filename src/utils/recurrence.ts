import { CalendarEvent } from '@/types/calendar'

export function generateRecurringInstances(
  parentEvent: CalendarEvent,
  startDate: Date,
  endDate: Date
): CalendarEvent[] {
  if (!parentEvent.recurring || !parentEvent.recurring.weekdays || parentEvent.recurring.weekdays.length === 0) {
    return [];
  }

  const instances: CalendarEvent[] = [];
  const { recurring } = parentEvent;
  const duration = parentEvent.endDate
    ? parentEvent.endDate.getTime() - parentEvent.startDate.getTime()
    : 0;

  const originalHours = parentEvent.startDate.getHours();
  const originalMinutes = parentEvent.startDate.getMinutes();

  const exceptions = recurring.exceptions || [];
  const exceptionDates = exceptions.map((ex: any) => {
    const date = ex instanceof Date ? ex : ex.toDate();
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  });

  const firstPossibleDate = new Date(startDate);
  firstPossibleDate.setHours(0, 0, 0, 0);
  const parentDateOnly = new Date(parentEvent.startDate);
  parentDateOnly.setHours(0, 0, 0, 0);

  // Empezar desde el mayor entre la fecha del padre y la fecha de inicio solicitada
  const generationStart = parentDateOnly > firstPossibleDate ? parentDateOnly : firstPossibleDate;
  generationStart.setHours(0, 0, 0, 0);

  const recurrenceEndDateSource = recurring.endDate
    ? new Date(recurring.endDate)
    : new Date(endDate);
  recurrenceEndDateSource.setHours(23, 59, 59, 999);

  const recurrenceEndDate = recurrenceEndDateSource;

  let currentDate = new Date(generationStart);
  let generatedWeeks = 0;
  const maxWeeks = Math.min(recurring.count || 12, 52);
  const intervalInDays = (recurring.interval || 1) * 7;

  while (generatedWeeks < maxWeeks && currentDate <= recurrenceEndDate) {
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const checkDate = new Date(currentDate);
      checkDate.setDate(currentDate.getDate() + dayOffset);

      if (checkDate > recurrenceEndDate) break;

      const dayOfWeek = checkDate.getDay();

      if (recurring.weekdays.includes(dayOfWeek) && checkDate >= generationStart) {
        const instanceStart = new Date(
          checkDate.getFullYear(),
          checkDate.getMonth(),
          checkDate.getDate(),
          originalHours,
          originalMinutes,
          0,
          0
        );

        const instanceDateOnly = new Date(instanceStart);
        instanceDateOnly.setHours(0, 0, 0, 0);

        if (instanceStart.getTime() === parentEvent.startDate.getTime()) {
          continue;
        }

        if (!exceptionDates.includes(instanceDateOnly.getTime())) {
          const instanceEnd = duration > 0 ? new Date(instanceStart.getTime() + duration) : undefined;

          instances.push({
            ...parentEvent,
            id: `${parentEvent.id}_${instanceStart.getTime()}`,
            startDate: instanceStart,
            endDate: instanceEnd,
            isRecurringInstance: true,
            parentEventId: parentEvent.id,
            recurring: undefined,
          });
        }
      }
    }

    currentDate.setDate(currentDate.getDate() + intervalInDays);
    generatedWeeks++;
  }

  return instances.filter(instance => instance.startDate >= generationStart && instance.startDate <= recurrenceEndDate);
}
