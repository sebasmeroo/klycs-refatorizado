import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  ProfessionalAvailability,
  ProfessionalAvailabilityFirestore,
  AvailabilityType,
  AvailabilityStatus
} from '@/types/calendar';
import { format } from 'date-fns';

const COLLECTION_NAME = 'professional_availability';

/**
 * Servicio optimizado para gestionar disponibilidad de profesionales
 * - Queries compuestas para minimizar lecturas
 * - Batch writes para operaciones múltiples
 * - Sistema de aprobación integrado
 */
export class ProfessionalAvailabilityService {
  /**
   * Convierte documento Firestore a objeto TypeScript
   */
  private static firestoreToAvailability(
    doc: any
  ): ProfessionalAvailability {
    const data = doc.data() as ProfessionalAvailabilityFirestore;
    return {
      id: doc.id,
      calendarId: data.calendarId,
      professionalId: data.professionalId,
      professionalName: data.professionalName,
      professionalEmail: data.professionalEmail,
      professionalColor: data.professionalColor,
      type: data.type,
      date: data.date.toDate(),
      startTime: data.startTime,
      endTime: data.endTime,
      recurrence: data.recurrence || 'once',
      recurrenceEndDate: data.recurrenceEndDate?.toDate(),
      title: data.title,
      note: data.note,
      status: data.status,
      requestedAt: data.requestedAt.toDate(),
      reviewedAt: data.reviewedAt?.toDate(),
      reviewedBy: data.reviewedBy,
      rejectionReason: data.rejectionReason,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  }

  /**
   * Obtener disponibilidades por rango de fechas
   * ✅ Solo 1 lectura con query compuesta
   */
  static async getAvailabilityByDateRange(
    calendarId: string,
    startDate: Date,
    endDate: Date,
    status?: AvailabilityStatus
  ): Promise<{ availabilities: ProfessionalAvailability[]; count: number }> {
    try {
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);

      let q = query(
        collection(db, COLLECTION_NAME),
        where('calendarId', '==', calendarId),
        where('date', '>=', startTimestamp),
        where('date', '<=', endTimestamp),
        orderBy('date', 'asc')
      );

      // Si se especifica un status, filtrarlo
      if (status) {
        q = query(
          collection(db, COLLECTION_NAME),
          where('calendarId', '==', calendarId),
          where('status', '==', status),
          where('date', '>=', startTimestamp),
          where('date', '<=', endTimestamp),
          orderBy('date', 'asc')
        );
      }

      const snapshot = await getDocs(q);
      const availabilities = snapshot.docs.map(this.firestoreToAvailability);

      return {
        availabilities,
        count: snapshot.size,
      };
    } catch (error) {
      console.error('Error getting availability by date range:', error);
      throw error;
    }
  }

  /**
   * Obtener disponibilidades pendientes para el dueño (inbox)
   * ✅ Solo solicitudes que necesitan aprobación
   */
  static async getPendingAvailabilities(
    ownerId: string,
    calendarIds: string[],
    limitCount: number = 50
  ): Promise<{ availabilities: ProfessionalAvailability[]; count: number }> {
    try {
      if (!calendarIds || calendarIds.length === 0) {
        return { availabilities: [], count: 0 };
      }

      // Query optimizada con límite
      const q = query(
        collection(db, COLLECTION_NAME),
        where('calendarId', 'in', calendarIds.slice(0, 10)), // Firestore limita 'in' a 10 elementos
        where('status', '==', 'pending'),
        orderBy('requestedAt', 'desc'),
        firestoreLimit(limitCount)
      );

      const snapshot = await getDocs(q);
      const availabilities = snapshot.docs.map(this.firestoreToAvailability);

      return {
        availabilities,
        count: snapshot.size,
      };
    } catch (error) {
      console.error('Error getting pending availabilities:', error);
      throw error;
    }
  }

  /**
   * Crear nueva solicitud de disponibilidad
   * ✅ Solo 1 escritura
   */
  static async createAvailability(
    data: Omit<ProfessionalAvailability, 'id' | 'status' | 'requestedAt' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const firestoreData: any = {
        calendarId: data.calendarId,
        professionalId: data.professionalId,
        professionalName: data.professionalName,
        professionalEmail: data.professionalEmail,
        professionalColor: data.professionalColor,
        type: data.type,
        date: Timestamp.fromDate(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        title: data.title,
        recurrence: data.recurrence || 'once',
        status: 'pending', // Siempre inicia como pendiente
        requestedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Campos opcionales
      if (data.note) {
        firestoreData.note = data.note;
      }
      if (data.recurrenceEndDate) {
        firestoreData.recurrenceEndDate = Timestamp.fromDate(data.recurrenceEndDate);
      }

      const docRef = await addDoc(collection(db, COLLECTION_NAME), firestoreData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating availability:', error);
      throw error;
    }
  }

  /**
   * Crear múltiples disponibilidades en batch
   * ✅ Escrituras agrupadas (máximo 500 por batch)
   */
  static async createBatchAvailabilities(
    dataArray: Omit<ProfessionalAvailability, 'id' | 'status' | 'requestedAt' | 'createdAt' | 'updatedAt'>[]
  ): Promise<number> {
    try {
      const batchSize = 500;
      let totalCreated = 0;

      for (let i = 0; i < dataArray.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = dataArray.slice(i, i + batchSize);

        chunk.forEach((data) => {
          const docRef = doc(collection(db, COLLECTION_NAME));
          const firestoreData: any = {
            calendarId: data.calendarId,
            professionalId: data.professionalId,
            professionalName: data.professionalName,
            professionalEmail: data.professionalEmail,
            professionalColor: data.professionalColor,
            type: data.type,
            date: Timestamp.fromDate(data.date),
            title: data.title,
            status: 'pending',
            requestedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          // Solo agregar campos opcionales si existen
          if (data.startTime) firestoreData.startTime = data.startTime;
          if (data.endTime) firestoreData.endTime = data.endTime;
          if (data.note) firestoreData.note = data.note;

          batch.set(docRef, firestoreData);
        });

        await batch.commit();
        totalCreated += chunk.length;
      }

      return totalCreated;
    } catch (error) {
      console.error('Error creating batch availabilities:', error);
      throw error;
    }
  }

  /**
   * Aprobar solicitud de disponibilidad
   * ✅ Solo 1 escritura
   */
  static async approveAvailability(
    availabilityId: string,
    reviewedBy: string
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, availabilityId);
      await updateDoc(docRef, {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error approving availability:', error);
      throw error;
    }
  }

  /**
   * Rechazar solicitud de disponibilidad
   * ✅ Solo 1 escritura
   */
  static async rejectAvailability(
    availabilityId: string,
    reviewedBy: string,
    rejectionReason?: string
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, availabilityId);
      await updateDoc(docRef, {
        status: 'rejected',
        reviewedAt: serverTimestamp(),
        reviewedBy,
        rejectionReason: rejectionReason || 'No aprobado',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error rejecting availability:', error);
      throw error;
    }
  }

  /**
   * Aprobar múltiples solicitudes en batch
   * ✅ Escrituras agrupadas
   */
  static async approveBatchAvailabilities(
    availabilityIds: string[],
    reviewedBy: string
  ): Promise<number> {
    try {
      const batchSize = 500;
      let totalApproved = 0;

      for (let i = 0; i < availabilityIds.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = availabilityIds.slice(i, i + batchSize);

        chunk.forEach((id) => {
          const docRef = doc(db, COLLECTION_NAME, id);
          batch.update(docRef, {
            status: 'approved',
            reviewedAt: serverTimestamp(),
            reviewedBy,
            updatedAt: serverTimestamp(),
          });
        });

        await batch.commit();
        totalApproved += chunk.length;
      }

      return totalApproved;
    } catch (error) {
      console.error('Error approving batch availabilities:', error);
      throw error;
    }
  }

  /**
   * Actualizar disponibilidad existente
   * ✅ Solo 1 escritura
   */
  static async updateAvailability(
    availabilityId: string,
    updates: Partial<Omit<ProfessionalAvailability, 'id' | 'createdAt'>>
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, availabilityId);

      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // Convertir Date a Timestamp si existe
      if (updates.date) {
        updateData.date = Timestamp.fromDate(updates.date);
      }
      if (updates.reviewedAt) {
        updateData.reviewedAt = Timestamp.fromDate(updates.reviewedAt);
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating availability:', error);
      throw error;
    }
  }

  /**
   * Eliminar disponibilidad
   * ✅ Solo 1 escritura
   */
  static async deleteAvailability(availabilityId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, availabilityId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting availability:', error);
      throw error;
    }
  }

  /**
   * Obtener conteo de solicitudes pendientes (para badge)
   * ✅ Query optimizada solo para contar
   */
  static async getPendingCount(calendarIds: string[]): Promise<number> {
    try {
      if (!calendarIds || calendarIds.length === 0) return 0;

      const q = query(
        collection(db, COLLECTION_NAME),
        where('calendarId', 'in', calendarIds.slice(0, 10)),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting pending count:', error);
      return 0;
    }
  }

  /**
   * Obtener disponibilidades aprobadas para un rango específico (expande recurrencias)
   */
  static async getApprovedAvailabilitiesForRange(
    calendarId: string,
    rangeStart: Date,
    rangeEnd: Date
  ): Promise<ProfessionalAvailability[]> {
    try {
      const normalizedStart = new Date(rangeStart);
      normalizedStart.setHours(0, 0, 0, 0);

      const normalizedEnd = new Date(rangeEnd);
      normalizedEnd.setHours(23, 59, 59, 999);

      // Traer disponibilidades dentro del rango (se incluye buffer de 1 año para cubrir recurrencias)
      const queryStart = new Date(normalizedStart);
      queryStart.setFullYear(queryStart.getFullYear() - 1);

      const q = query(
        collection(db, COLLECTION_NAME),
        where('calendarId', '==', calendarId),
        where('status', '==', 'approved'),
        where('date', '>=', Timestamp.fromDate(queryStart)),
        where('date', '<=', Timestamp.fromDate(normalizedEnd)),
        orderBy('date', 'asc')
      );

      const snapshot = await getDocs(q);
      const availabilities = snapshot.docs.map(this.firestoreToAvailability);

      const expanded: ProfessionalAvailability[] = [];
      for (const availability of availabilities) {
        expanded.push(
          ...this.expandAvailabilityInstances(availability, normalizedStart, normalizedEnd)
        );
      }

      return expanded;
    } catch (error) {
      console.error('Error getting approved availabilities for range:', error);
      return [];
    }
  }

  /**
   * Expande instancias de una disponibilidad considerando recurrencia
   */
  private static expandAvailabilityInstances(
    availability: ProfessionalAvailability,
    rangeStart: Date,
    rangeEnd: Date
  ): ProfessionalAvailability[] {
    const recurrence = availability.recurrence || 'once';
    const instances: ProfessionalAvailability[] = [];
    const baseDate = new Date(availability.date);

    if (recurrence === 'once') {
      if (baseDate >= rangeStart && baseDate <= rangeEnd) {
        instances.push(availability);
      }
      return instances;
    }

    const limitDate = availability.recurrenceEndDate
      ? new Date(Math.min(availability.recurrenceEndDate.getTime(), rangeEnd.getTime()))
      : rangeEnd;

    let currentDate = new Date(baseDate);
    let count = 0;
    const MAX_INSTANCES = 365;

    while (currentDate <= limitDate && count < MAX_INSTANCES) {
      if (currentDate >= rangeStart && currentDate <= rangeEnd) {
        instances.push({
          ...availability,
          date: new Date(currentDate)
        });
      }

      switch (recurrence) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly': {
          const day = currentDate.getDate();
          currentDate.setMonth(currentDate.getMonth() + 1);

          // Ajustar cuando el mes no tiene el mismo número de días
          if (currentDate.getDate() !== day) {
            currentDate.setDate(0); // último día del mes anterior
          }
          break;
        }
        default:
          return instances;
      }

      count++;
    }

    return instances;
  }
}
