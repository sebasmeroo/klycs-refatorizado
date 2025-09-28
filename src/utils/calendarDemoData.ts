import { 
  SharedCalendar, 
  CalendarEvent, 
  CalendarUser,
  EventComment 
} from '@/types/calendar';

// ===== DATOS DE EJEMPLO PARA EL CALENDARIO COLABORATIVO =====

export const createDemoCalendarData = (userId: string, userName: string, userEmail: string) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Usuarios de ejemplo
  const demoUsers: CalendarUser[] = [
    {
      id: userId,
      name: userName,
      email: userEmail,
      color: '#3B82F6',
      role: 'owner',
      joinedAt: new Date(2024, 0, 1),
      isActive: true
    },
    {
      id: 'diana-lopez',
      name: 'Diana López',
      email: 'diana@example.com',
      color: '#10B981',
      role: 'admin',
      joinedAt: new Date(2024, 0, 15),
      isActive: true
    },
    {
      id: 'adriana-martinez',
      name: 'Adriana Martínez',
      email: 'adriana@example.com',
      color: '#F59E0B',
      role: 'editor',
      joinedAt: new Date(2024, 1, 1),
      isActive: true
    },
    {
      id: 'juanita-cardona',
      name: 'Juanita Cardona',
      email: 'juanita@example.com',
      color: '#EF4444',
      role: 'editor',
      joinedAt: new Date(2024, 1, 10),
      isActive: true
    },
    {
      id: 'ynes-ruiz',
      name: 'Ynes Ruiz',
      email: 'ynes@example.com',
      color: '#8B5CF6',
      role: 'viewer',
      joinedAt: new Date(2024, 1, 20),
      isActive: true
    }
  ];

  // Calendarios de ejemplo
  const demoCalendars: SharedCalendar[] = [
    {
      id: 'familia-calendar',
      name: 'Diana López',
      description: 'Calendario personal y actividades familiares',
      color: '#3B82F6',
      ownerId: userId,
      members: [demoUsers[0], demoUsers[1]],
      settings: {
        allowMemberInvites: true,
        allowEventEditing: true,
        allowEventDeleting: false,
        requireApproval: false,
        defaultEventDuration: 60,
        workingHours: {
          enabled: true,
          start: '09:00',
          end: '18:00',
          weekdays: [1, 2, 3, 4, 5]
        },
        notifications: {
          newEvents: true,
          eventChanges: true,
          reminders: true,
          comments: true
        },
        timezone: 'Europe/Madrid'
      },
      createdAt: new Date(2024, 0, 1),
      updatedAt: new Date(),
      isPublic: false
    },
    {
      id: 'adriana-calendar',
      name: 'Adriana',
      description: 'Trabajo y citas profesionales',
      color: '#10B981',
      ownerId: 'adriana-martinez',
      members: [demoUsers[0], demoUsers[2]],
      settings: {
        allowMemberInvites: false,
        allowEventEditing: true,
        allowEventDeleting: false,
        requireApproval: false,
        defaultEventDuration: 45,
        workingHours: {
          enabled: true,
          start: '08:00',
          end: '19:00',
          weekdays: [1, 2, 3, 4, 5]
        },
        notifications: {
          newEvents: true,
          eventChanges: true,
          reminders: true,
          comments: false
        },
        timezone: 'Europe/Madrid'
      },
      createdAt: new Date(2024, 0, 15),
      updatedAt: new Date(),
      isPublic: false
    },
    {
      id: 'juanita-calendar',
      name: 'Juanita Cardona',
      description: 'Actividades personales y salud',
      color: '#F59E0B',
      ownerId: 'juanita-cardona',
      members: [demoUsers[0], demoUsers[3]],
      settings: {
        allowMemberInvites: true,
        allowEventEditing: true,
        allowEventDeleting: true,
        requireApproval: false,
        defaultEventDuration: 30,
        workingHours: {
          enabled: false,
          start: '09:00',
          end: '17:00',
          weekdays: [1, 2, 3, 4, 5, 6]
        },
        notifications: {
          newEvents: true,
          eventChanges: false,
          reminders: true,
          comments: true
        },
        timezone: 'Europe/Madrid'
      },
      createdAt: new Date(2024, 1, 1),
      updatedAt: new Date(),
      isPublic: false
    },
    {
      id: 'ynes-calendar',
      name: 'Ynes Ruiz',
      description: 'Eventos sociales y entretenimiento',
      color: '#EF4444',
      ownerId: 'ynes-ruiz',
      members: [demoUsers[0], demoUsers[4]],
      settings: {
        allowMemberInvites: true,
        allowEventEditing: false,
        allowEventDeleting: false,
        requireApproval: true,
        defaultEventDuration: 120,
        workingHours: {
          enabled: false,
          start: '10:00',
          end: '22:00',
          weekdays: [1, 2, 3, 4, 5, 6, 0]
        },
        notifications: {
          newEvents: true,
          eventChanges: true,
          reminders: true,
          comments: true
        },
        timezone: 'Europe/Madrid'
      },
      createdAt: new Date(2024, 1, 10),
      updatedAt: new Date(),
      isPublic: true
    },
    {
      id: 'karen-calendar',
      name: 'Karen',
      description: 'Calendario compartido del equipo',
      color: '#8B5CF6',
      ownerId: userId,
      members: demoUsers.slice(0, 4),
      settings: {
        allowMemberInvites: true,
        allowEventEditing: true,
        allowEventDeleting: false,
        requireApproval: false,
        defaultEventDuration: 60,
        workingHours: {
          enabled: true,
          start: '09:00',
          end: '18:00',
          weekdays: [1, 2, 3, 4, 5]
        },
        notifications: {
          newEvents: true,
          eventChanges: true,
          reminders: true,
          comments: true
        },
        timezone: 'Europe/Madrid'
      },
      createdAt: new Date(2024, 1, 15),
      updatedAt: new Date(),
      isPublic: false
    },
    {
      id: 'lina-calendar',
      name: 'Lina Marcela',
      description: 'Actividades de fin de semana y hobbies',
      color: '#06B6D4',
      ownerId: userId,
      members: [demoUsers[0]],
      settings: {
        allowMemberInvites: false,
        allowEventEditing: true,
        allowEventDeleting: true,
        requireApproval: false,
        defaultEventDuration: 90,
        workingHours: {
          enabled: false,
          start: '10:00',
          end: '20:00',
          weekdays: [6, 0]
        },
        notifications: {
          newEvents: false,
          eventChanges: false,
          reminders: true,
          comments: false
        },
        timezone: 'Europe/Madrid'
      },
      createdAt: new Date(2024, 2, 1),
      updatedAt: new Date(),
      isPublic: false
    }
  ];

  // Eventos de ejemplo para el mes actual
  const demoEvents: CalendarEvent[] = [
    // Septiembre 2025
    {
      id: 'event-1',
      calendarId: 'familia-calendar',
      title: 'Cita médica',
      description: 'Revisión anual con el doctor García',
      startDate: new Date(currentYear, currentMonth, 2, 10, 0),
      endDate: new Date(currentYear, currentMonth, 2, 11, 0),
      isAllDay: false,
      location: 'Centro Médico San Rafael',
      createdBy: userId,
      attendees: [userId],
      comments: [],
      attachments: [],
      status: 'confirmed',
      visibility: 'private',
      reminders: [],
      createdAt: new Date(2024, 8, 1),
      updatedAt: new Date(2024, 8, 1)
    },
    {
      id: 'event-2',
      calendarId: 'adriana-calendar',
      title: 'Reunión de equipo',
      description: 'Revisión semanal de proyectos',
      startDate: new Date(currentYear, currentMonth, 3, 14, 0),
      endDate: new Date(currentYear, currentMonth, 3, 15, 30),
      isAllDay: false,
      location: 'Sala de juntas',
      createdBy: 'adriana-martinez',
      attendees: [userId, 'adriana-martinez'],
      comments: [],
      attachments: [],
      status: 'confirmed',
      visibility: 'public',
      reminders: [],
      createdAt: new Date(2024, 8, 2),
      updatedAt: new Date(2024, 8, 2)
    },
    {
      id: 'event-3',
      calendarId: 'juanita-calendar',
      title: 'Clase de yoga',
      description: 'Yoga nivel intermedio',
      startDate: new Date(currentYear, currentMonth, 4, 18, 0),
      endDate: new Date(currentYear, currentMonth, 4, 19, 30),
      isAllDay: false,
      location: 'Centro Wellness',
      createdBy: 'juanita-cardona',
      attendees: ['juanita-cardona'],
      comments: [],
      attachments: [],
      status: 'confirmed',
      visibility: 'public',
      reminders: [],
      createdAt: new Date(2024, 8, 3),
      updatedAt: new Date(2024, 8, 3)
    },
    {
      id: 'event-4',
      calendarId: 'ynes-calendar',
      title: 'Cena con amigos',
      description: 'Cena en el restaurante italiano',
      startDate: new Date(currentYear, currentMonth, 5, 20, 0),
      endDate: new Date(currentYear, currentMonth, 5, 22, 30),
      isAllDay: false,
      location: 'La Tavola Italiana',
      createdBy: 'ynes-ruiz',
      attendees: ['ynes-ruiz', userId],
      comments: [],
      attachments: [],
      status: 'tentative',
      visibility: 'public',
      reminders: [],
      createdAt: new Date(2024, 8, 4),
      updatedAt: new Date(2024, 8, 4)
    },
    {
      id: 'event-5',
      calendarId: 'karen-calendar',
      title: 'Presentación mensual',
      description: 'Presentación de resultados del mes',
      startDate: new Date(currentYear, currentMonth, 9, 10, 0),
      endDate: new Date(currentYear, currentMonth, 9, 12, 0),
      isAllDay: false,
      location: 'Auditorio principal',
      createdBy: userId,
      attendees: [userId, 'diana-lopez', 'adriana-martinez'],
      comments: [],
      attachments: [],
      status: 'confirmed',
      visibility: 'public',
      reminders: [],
      createdAt: new Date(2024, 8, 5),
      updatedAt: new Date(2024, 8, 5)
    },
    {
      id: 'event-6',
      calendarId: 'lina-calendar',
      title: 'Taller de pintura',
      description: 'Taller de acuarela para principiantes',
      startDate: new Date(currentYear, currentMonth, 7, 16, 0),
      endDate: new Date(currentYear, currentMonth, 7, 18, 0),
      isAllDay: false,
      location: 'Escuela de Arte',
      createdBy: userId,
      attendees: [userId],
      comments: [],
      attachments: [],
      status: 'confirmed',
      visibility: 'private',
      reminders: [],
      createdAt: new Date(2024, 8, 6),
      updatedAt: new Date(2024, 8, 6)
    },
    // Más eventos del mes
    {
      id: 'event-7',
      calendarId: 'familia-calendar',
      title: 'Cumpleaños de mamá',
      description: 'Celebración familiar',
      startDate: new Date(currentYear, currentMonth, 12, 0, 0),
      endDate: new Date(currentYear, currentMonth, 12, 23, 59),
      isAllDay: true,
      createdBy: userId,
      attendees: [userId, 'diana-lopez'],
      comments: [],
      attachments: [],
      status: 'confirmed',
      visibility: 'private',
      reminders: [],
      createdAt: new Date(2024, 8, 7),
      updatedAt: new Date(2024, 8, 7)
    },
    {
      id: 'event-8',
      calendarId: 'adriana-calendar',
      title: 'Conferencia tech',
      description: 'Conferencia sobre nuevas tecnologías',
      startDate: new Date(currentYear, currentMonth, 15, 9, 0),
      endDate: new Date(currentYear, currentMonth, 15, 17, 0),
      isAllDay: false,
      location: 'Centro de Convenciones',
      createdBy: 'adriana-martinez',
      attendees: ['adriana-martinez', userId],
      comments: [],
      attachments: [],
      status: 'confirmed',
      visibility: 'public',
      reminders: [],
      createdAt: new Date(2024, 8, 8),
      updatedAt: new Date(2024, 8, 8)
    }
  ];

  // Comentarios de ejemplo
  const demoComments: EventComment[] = [
    {
      id: 'comment-1',
      eventId: 'event-2',
      userId: userId,
      userName: userName,
      message: '¿Podemos mover la reunión 30 minutos más tarde?',
      createdAt: new Date(2024, 8, 2, 10, 15)
    },
    {
      id: 'comment-2',
      eventId: 'event-2',
      userId: 'adriana-martinez',
      userName: 'Adriana Martínez',
      message: 'Perfecto, sin problema. Actualizo la invitación.',
      createdAt: new Date(2024, 8, 2, 10, 20)
    },
    {
      id: 'comment-3',
      eventId: 'event-4',
      userId: 'ynes-ruiz',
      userName: 'Ynes Ruiz',
      message: '¿Confirmamos para las 8? El restaurante cierra tarde.',
      createdAt: new Date(2024, 8, 4, 15, 30)
    }
  ];

  return {
    calendars: demoCalendars,
    events: demoEvents,
    comments: demoComments,
    users: demoUsers
  };
};

// Función para obtener estadísticas de ejemplo
export const getDemoStats = () => {
  return {
    totalEvents: 15,
    upcomingEvents: 8,
    totalCalendars: 6,
    sharedCalendars: 4,
    eventsThisMonth: 12,
    eventsThisWeek: 3,
    mostActiveCalendar: 'familia-calendar',
    collaborators: 4
  };
};
