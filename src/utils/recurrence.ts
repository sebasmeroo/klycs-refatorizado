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

  const recurrenceEndDate = recurring.endDate || endDate;

  let currentDate = new Date(parentEvent.startDate);
  let weekCount = 0;
  const maxWeeks = Math.min(recurring.count || 12, 52);
  const intervalInDays = (recurring.interval || 1) * 7;

  while (weekCount < maxWeeks && currentDate <= recurrenceEndDate) {
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const checkDate = new Date(currentDate);
      checkDate.setDate(currentDate.getDate() + dayOffset);

      if (checkDate > recurrenceEndDate) break;

      const dayOfWeek = checkDate.getDay();

      if (recurring.weekdays.includes(dayOfWeek) && checkDate >= startDate) {
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
    weekCount++;
  }

  return instances;
}
