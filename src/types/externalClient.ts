/**
 * External Client Types
 * Sistema de clientes externos para tracking de horas y facturación
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Cliente externo (empresa o persona) para la que se trabaja
 */
export interface ExternalClient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  ownerId: string; // Usuario propietario
  hourlyRate: number; // Tarifa horaria que cobra este cliente
  totalHours: number;
  totalAmount: number;
  currency: string;
  createdAt: Timestamp | Date;
  lastServiceDate?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

/**
 * Registro de servicio individual para un cliente externo
 */
export interface ExternalClientService {
  id: string;
  clientId: string;
  eventId: string; // Referencia al evento del calendario
  professionalId: string; // ID del calendario/profesional
  professionalName: string;
  professionalRate: number; // Tarifa horaria del profesional
  date: Timestamp | Date;
  title: string;
  hours: number;
  amount: number;
  status: 'completed' | 'cancelled';
  createdAt: Timestamp | Date;
}

/**
 * Estadísticas agregadas de un cliente externo
 */
export interface ExternalClientStats {
  clientId: string;
  clientName: string;
  totalHours: number;
  totalAmount: number;
  currency: string;
  serviceCount: number;
  lastServiceDate?: Date;
  professionalBreakdown: {
    professionalId: string;
    professionalName: string;
    hours: number;
    amount: number;
    serviceCount: number;
  }[];
}

/**
 * Filtros para consultas de clientes externos
 */
export interface ExternalClientFilters {
  ownerId: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

/**
 * Datos para crear/actualizar cliente externo
 */
export interface ExternalClientInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  hourlyRate: number; // Tarifa horaria requerida
  currency?: string;
}

/**
 * Export data para CSV/PDF
 */
export interface ExternalClientExportData {
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  period: {
    start: Date;
    end: Date;
  };
  services: {
    date: string;
    title: string;
    professionalName: string;
    hours: number;
    rate: number;
    amount: number;
  }[];
  totalHours: number;
  totalAmount: number;
  currency: string;
}
