/**
 * Esquemas de validación con Zod para todos los servicios
 * ✅ Validación estricta de datos antes de enviar a Firebase
 * ✅ Mensajes de error claros
 * ✅ Type-safety completo con TypeScript
 */

import { z } from 'zod';

// === ESQUEMAS BÁSICOS REUTILIZABLES ===

export const emailSchema = z
  .string()
  .email('Email inválido')
  .max(320, 'Email demasiado largo');

export const urlSchema = z
  .string()
  .url('URL inválida')
  .max(2000, 'URL demasiado larga');

export const slugSchema = z
  .string()
  .min(3, 'Slug debe tener al menos 3 caracteres')
  .max(100, 'Slug demasiado largo')
  .regex(/^[a-z0-9-]+$/, 'Slug solo puede contener letras minúsculas, números y guiones');

export const colorSchema = z
  .string()
  .regex(/^#[0-9A-F]{6}$/i, 'Color debe ser formato hexadecimal (#RRGGBB)');

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Teléfono inválido')
  .optional();

// === ESQUEMAS PARA USUARIOS ===

export const userCreateSchema = z.object({
  email: emailSchema,
  displayName: z.string().min(1).max(100),
  photoURL: urlSchema.optional(),
  role: z.enum(['user', 'professional', 'admin']).default('user'),
});

export const userUpdateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  photoURL: urlSchema.optional(),
  bio: z.string().max(500).optional(),
  phone: phoneSchema,
  website: urlSchema.optional(),
  location: z.string().max(200).optional(),
});

// === ESQUEMAS PARA TARJETAS ===

export const cardProfileSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  title: z.string().max(150).optional(),
  bio: z.string().max(500).optional(),
  avatar: urlSchema.optional(),
  cover: urlSchema.optional(),
  phone: phoneSchema,
  email: emailSchema.optional(),
  location: z.string().max(200).optional(),
  website: urlSchema.optional(),
});

export const cardLinkSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100),
  url: urlSchema,
  icon: z.string().optional(),
  description: z.string().max(200).optional(),
  order: z.number().int().min(0),
  isVisible: z.boolean().default(true),
});

export const cardServiceSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  price: z.number().min(0).max(1000000),
  duration: z.number().int().min(1).max(480), // máx 8 horas
  image: urlSchema.optional(),
  isActive: z.boolean().default(true),
  order: z.number().int().min(0),
});

export const cardPortfolioItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(150),
  description: z.string().max(500).optional(),
  image: urlSchema,
  video: urlSchema.optional(),
  link: urlSchema.optional(),
  category: z.string().max(50).optional(),
  order: z.number().int().min(0),
  isVisible: z.boolean().default(true),
});

export const cardCreateSchema = z.object({
  userId: z.string().min(1),
  slug: slugSchema,
  profile: cardProfileSchema,
  design: z.object({
    primaryColor: colorSchema.default('#3B82F6'),
    secondaryColor: colorSchema.default('#1E40AF'),
    fontFamily: z.string().max(50).default('Inter'),
    backgroundColor: colorSchema.default('#FFFFFF'),
  }).optional(),
  links: z.array(cardLinkSchema).max(50).default([]),
  services: z.array(cardServiceSchema).max(30).default([]),
  portfolio: z.array(cardPortfolioItemSchema).max(50).default([]),
  isPublic: z.boolean().default(false),
  seo: z.object({
    title: z.string().max(60).optional(),
    description: z.string().max(160).optional(),
    keywords: z.array(z.string().max(30)).max(10).optional(),
  }).optional(),
});

export const cardUpdateSchema = cardCreateSchema.partial().omit({ userId: true });

// === ESQUEMAS PARA CALENDARIOS ===

export const calendarMemberSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  email: emailSchema,
  role: z.enum(['admin', 'professional', 'viewer']),
  color: colorSchema,
  isActive: z.boolean().default(true),
});

export const calendarSettingsSchema = z.object({
  allowMemberInvites: z.boolean().default(false),
  allowEventEditing: z.boolean().default(true),
  allowEventDeleting: z.boolean().default(false),
  requireApproval: z.boolean().default(false),
  defaultEventDuration: z.number().int().min(15).max(480).default(60),
  workingHours: z.object({
    enabled: z.boolean().default(true),
    start: z.string().regex(/^\d{2}:\d{2}$/, 'Formato debe ser HH:MM'),
    end: z.string().regex(/^\d{2}:\d{2}$/, 'Formato debe ser HH:MM'),
    weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  }).optional(),
  notifications: z.object({
    newEvents: z.boolean().default(true),
    eventChanges: z.boolean().default(true),
    reminders: z.boolean().default(true),
    comments: z.boolean().default(true),
  }).optional(),
  timezone: z.string().max(50).default('Europe/Madrid'),
});

export const calendarCreateSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  description: z.string().max(500).optional(),
  color: colorSchema.default('#3B82F6'),
  ownerId: z.string().min(1),
  linkedEmail: emailSchema.optional(),
  members: z.array(calendarMemberSchema).min(1),
  settings: calendarSettingsSchema,
  isPublic: z.boolean().default(false),
});

export const calendarUpdateSchema = calendarCreateSchema.partial().omit({ ownerId: true });

// === ESQUEMAS PARA EVENTOS ===

export const eventCreateSchema = z.object({
  title: z.string().min(1, 'Título requerido').max(200),
  description: z.string().max(2000).optional(),
  calendarId: z.string().min(1),
  startDate: z.date(),
  endDate: z.date(),
  location: z.string().max(300).optional(),
  attendees: z.array(emailSchema).max(100).optional(),
  reminders: z.array(z.number().int().min(0)).max(5).optional(),
  color: colorSchema.optional(),
  isAllDay: z.boolean().default(false),
  recurrence: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    interval: z.number().int().min(1).max(365),
    endDate: z.date().optional(),
    count: z.number().int().min(1).max(100).optional(),
  }).optional(),
}).refine(data => data.endDate > data.startDate, {
  message: 'Fecha de fin debe ser posterior a fecha de inicio',
  path: ['endDate'],
});

export const eventUpdateSchema = eventCreateSchema.partial().omit({ calendarId: true });

// === ESQUEMAS PARA RESERVAS ===

export const bookingCreateSchema = z.object({
  clientName: z.string().min(1, 'Nombre requerido').max(100),
  clientEmail: emailSchema,
  clientPhone: phoneSchema,
  userId: z.string().min(1), // Profesional que recibe la reserva
  serviceId: z.string().min(1).optional(),
  serviceName: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha debe ser YYYY-MM-DD'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora debe ser HH:MM'),
  duration: z.number().int().min(15, 'Duración mínima 15 minutos').max(480, 'Duración máxima 8 horas'),
  price: z.number().min(0).max(100000),
  notes: z.string().max(1000).optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).default('pending'),
});

export const bookingUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  notes: z.string().max(1000).optional(),
  cancellationReason: z.string().max(500).optional(),
});

// === ESQUEMAS PARA COMENTARIOS ===

export const commentCreateSchema = z.object({
  eventId: z.string().min(1),
  userId: z.string().min(1),
  userName: z.string().min(1).max(100),
  message: z.string().min(1, 'Comentario no puede estar vacío').max(1000, 'Comentario demasiado largo'),
});

// === ESQUEMAS PARA PROFESIONALES ===

export const professionalPermissionsSchema = z.object({
  canCreateEvents: z.boolean().default(true),
  canEditEvents: z.boolean().default(true),
  canDeleteEvents: z.boolean().default(false),
  canManageBookings: z.boolean().default(true),
  canViewAnalytics: z.boolean().default(false),
});

export const professionalCreateSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  email: emailSchema,
  role: z.string().min(1).max(100),
  color: colorSchema,
  permissions: professionalPermissionsSchema,
});

// === ESQUEMAS PARA INVITACIONES ===

export const invitationCreateSchema = z.object({
  recipientEmail: emailSchema,
  calendarId: z.string().min(1),
  role: z.enum(['professional', 'viewer']),
  message: z.string().max(500).optional(),
});

// === FUNCIONES DE VALIDACIÓN ===

/**
 * Validar datos con manejo de errores mejorado
 */
export const validate = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validación fallida:\n${messages.join('\n')}`);
    }
    throw error;
  }
};

/**
 * Validación safe (retorna resultado en lugar de lanzar error)
 */
export const validateSafe = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } => {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    return { success: false, errors };
  }
};
