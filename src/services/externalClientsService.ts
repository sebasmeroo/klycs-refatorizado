/**
 * External Clients Service
 * Gestión de clientes externos con optimizaciones y tracking de costes
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  ExternalClient,
  ExternalClientService,
  ExternalClientInput,
  ExternalClientStats,
  ExternalClientFilters
} from '@/types/externalClient';
import { costMonitoring } from '@/utils/costMonitoring';
import { logger } from '@/utils/logger';

const CLIENTS_COLLECTION = 'external_clients';
const SERVICES_SUBCOLLECTION = 'services';

/**
 * Servicio para gestión de clientes externos
 */
export class ExternalClientsService {
  /**
   * Crear nuevo cliente externo
   */
  static async createClient(
    ownerId: string,
    data: ExternalClientInput
  ): Promise<string> {
    try {
      const clientData: Omit<ExternalClient, 'id'> = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        ownerId,
        hourlyRate: data.hourlyRate,
        totalHours: 0,
        totalAmount: 0,
        currency: data.currency || 'EUR',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, CLIENTS_COLLECTION), clientData);

      costMonitoring.trackFirestoreWrite(1);
      logger.log('✅ Cliente externo creado', { clientId: docRef.id, name: data.name });

      return docRef.id;
    } catch (error) {
      logger.error('Error al crear cliente externo', error as Error);
      throw error;
    }
  }

  /**
   * Obtener cliente por ID
   */
  static async getClient(clientId: string): Promise<ExternalClient | null> {
    try {
      costMonitoring.trackFirestoreRead(1);

      const docRef = doc(db, CLIENTS_COLLECTION, clientId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      } as ExternalClient;
    } catch (error) {
      logger.error('Error al obtener cliente externo', error as Error);
      throw error;
    }
  }

  /**
   * Obtener todos los clientes de un usuario
   */
  static async getClientsByOwner(ownerId: string): Promise<ExternalClient[]> {
    try {
      // Usar createdAt para ordenar (todos los clientes lo tienen)
      // Esto evita el problema de que lastServiceDate no exista en clientes sin servicios
      const q = query(
        collection(db, CLIENTS_COLLECTION),
        where('ownerId', '==', ownerId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      costMonitoring.trackFirestoreRead(snapshot.size);

      let clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ExternalClient[];

      // Ordenar en memoria: primero por lastServiceDate si existe, luego por createdAt
      clients = clients.sort((a, b) => {
        const dateA = a.lastServiceDate || a.createdAt;
        const dateB = b.lastServiceDate || b.createdAt;

        const timeA = dateA instanceof Timestamp ? dateA.toMillis() : dateA.getTime();
        const timeB = dateB instanceof Timestamp ? dateB.toMillis() : dateB.getTime();

        return timeB - timeA; // Descendente (más reciente primero)
      });

      logger.log(`✅ Cargados ${clients.length} clientes externos`);
      return clients;
    } catch (error) {
      logger.error('Error al obtener clientes externos', error as Error);
      throw error;
    }
  }

  /**
   * Actualizar datos de cliente
   */
  static async updateClient(
    clientId: string,
    data: Partial<ExternalClientInput>
  ): Promise<void> {
    try {
      const docRef = doc(db, CLIENTS_COLLECTION, clientId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });

      costMonitoring.trackFirestoreWrite(1);
      logger.log('✅ Cliente externo actualizado', { clientId });
    } catch (error) {
      logger.error('Error al actualizar cliente externo', error as Error);
      throw error;
    }
  }

  /**
   * Eliminar cliente externo
   * Solo si no tiene servicios asociados
   */
  static async deleteClient(clientId: string): Promise<void> {
    try {
      // Verificar que no tenga servicios
      const servicesSnap = await getDocs(
        query(
          collection(db, CLIENTS_COLLECTION, clientId, SERVICES_SUBCOLLECTION),
          limit(1)
        )
      );

      costMonitoring.trackFirestoreRead(servicesSnap.size);

      if (!servicesSnap.empty) {
        throw new Error('No se puede eliminar un cliente con servicios asociados');
      }

      const docRef = doc(db, CLIENTS_COLLECTION, clientId);
      await deleteDoc(docRef);

      costMonitoring.trackFirestoreDelete(1);
      logger.log('✅ Cliente externo eliminado', { clientId });
    } catch (error) {
      logger.error('Error al eliminar cliente externo', error as Error);
      throw error;
    }
  }

  /**
   * Registrar servicio completado para cliente externo
   * Llamado automáticamente cuando se completa un evento
   */
  static async recordService(
    clientId: string,
    serviceData: {
      eventId: string;
      professionalId: string;
      professionalName: string;
      professionalRate: number;
      date: Date;
      title: string;
      hours: number;
    }
  ): Promise<void> {
    try {
      const amount = serviceData.hours * serviceData.professionalRate;

      // Crear registro de servicio
      const serviceRecord: Omit<ExternalClientService, 'id'> = {
        clientId,
        eventId: serviceData.eventId,
        professionalId: serviceData.professionalId,
        professionalName: serviceData.professionalName,
        professionalRate: serviceData.professionalRate,
        date: Timestamp.fromDate(serviceData.date),
        title: serviceData.title,
        hours: serviceData.hours,
        amount,
        status: 'completed',
        createdAt: Timestamp.now()
      };

      // Usar batch para atomicidad
      const batch = writeBatch(db);

      // Añadir servicio a subcolección
      const serviceRef = doc(
        collection(db, CLIENTS_COLLECTION, clientId, SERVICES_SUBCOLLECTION)
      );
      batch.set(serviceRef, serviceRecord);

      // Actualizar totales del cliente
      const clientRef = doc(db, CLIENTS_COLLECTION, clientId);
      batch.update(clientRef, {
        totalHours: increment(serviceData.hours),
        totalAmount: increment(amount),
        lastServiceDate: Timestamp.fromDate(serviceData.date),
        updatedAt: Timestamp.now()
      });

      await batch.commit();

      costMonitoring.trackFirestoreWrite(2); // Servicio + actualización cliente
      logger.log('✅ Servicio registrado para cliente externo', {
        clientId,
        eventId: serviceData.eventId,
        hours: serviceData.hours,
        amount
      });
    } catch (error) {
      logger.error('Error al registrar servicio para cliente externo', error as Error);
      throw error;
    }
  }

  /**
   * Obtener servicios de un cliente
   */
  static async getClientServices(
    clientId: string,
    filters?: { startDate?: Date; endDate?: Date }
  ): Promise<ExternalClientService[]> {
    try {
      let q = query(
        collection(db, CLIENTS_COLLECTION, clientId, SERVICES_SUBCOLLECTION),
        orderBy('date', 'desc')
      );

      // Aplicar filtros de fecha si existen
      if (filters?.startDate) {
        q = query(q, where('date', '>=', Timestamp.fromDate(filters.startDate)));
      }
      if (filters?.endDate) {
        q = query(q, where('date', '<=', Timestamp.fromDate(filters.endDate)));
      }

      const snapshot = await getDocs(q);
      costMonitoring.trackFirestoreRead(snapshot.size);

      const services = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ExternalClientService[];

      logger.log(`✅ Cargados ${services.length} servicios del cliente ${clientId}`);
      return services;
    } catch (error) {
      logger.error('Error al obtener servicios del cliente', error as Error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de un cliente con desglose por profesional
   */
  static async getClientStats(
    clientId: string,
    filters?: { startDate?: Date; endDate?: Date }
  ): Promise<ExternalClientStats | null> {
    try {
      // Obtener datos del cliente
      const client = await this.getClient(clientId);
      if (!client) {
        return null;
      }

      // Obtener servicios (con filtros si se especifican)
      const services = await this.getClientServices(clientId, filters);

      // Calcular totales por profesional
      const professionalMap = new Map<string, {
        professionalId: string;
        professionalName: string;
        hours: number;
        amount: number;
        serviceCount: number;
      }>();

      let totalHours = 0;
      let totalAmount = 0;

      services.forEach(service => {
        totalHours += service.hours;
        totalAmount += service.amount;

        const existing = professionalMap.get(service.professionalId);
        if (existing) {
          existing.hours += service.hours;
          existing.amount += service.amount;
          existing.serviceCount += 1;
        } else {
          professionalMap.set(service.professionalId, {
            professionalId: service.professionalId,
            professionalName: service.professionalName,
            hours: service.hours,
            amount: service.amount,
            serviceCount: 1
          });
        }
      });

      const professionalBreakdown = Array.from(professionalMap.values())
        .sort((a, b) => b.amount - a.amount); // Ordenar por importe descendente

      return {
        clientId: client.id,
        clientName: client.name,
        totalHours,
        totalAmount,
        currency: client.currency,
        serviceCount: services.length,
        lastServiceDate: services.length > 0
          ? (services[0].date instanceof Timestamp
            ? services[0].date.toDate()
            : services[0].date)
          : undefined,
        professionalBreakdown
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas del cliente', error as Error);
      throw error;
    }
  }

  /**
   * Cancelar servicio (restar del total del cliente)
   */
  static async cancelService(
    clientId: string,
    serviceId: string
  ): Promise<void> {
    try {
      // Obtener datos del servicio
      const serviceRef = doc(
        db,
        CLIENTS_COLLECTION,
        clientId,
        SERVICES_SUBCOLLECTION,
        serviceId
      );
      const serviceSnap = await getDoc(serviceRef);

      if (!serviceSnap.exists()) {
        throw new Error('Servicio no encontrado');
      }

      const service = serviceSnap.data() as ExternalClientService;

      // Usar batch para atomicidad
      const batch = writeBatch(db);

      // Marcar servicio como cancelado
      batch.update(serviceRef, { status: 'cancelled' });

      // Restar del total del cliente
      const clientRef = doc(db, CLIENTS_COLLECTION, clientId);
      batch.update(clientRef, {
        totalHours: increment(-service.hours),
        totalAmount: increment(-service.amount),
        updatedAt: Timestamp.now()
      });

      await batch.commit();

      costMonitoring.trackFirestoreWrite(2);
      logger.log('✅ Servicio cancelado', { clientId, serviceId });
    } catch (error) {
      logger.error('Error al cancelar servicio', error as Error);
      throw error;
    }
  }

  /**
   * Buscar clientes por nombre
   */
  static async searchClients(
    ownerId: string,
    searchTerm: string
  ): Promise<ExternalClient[]> {
    try {
      // Firestore no tiene búsqueda full-text, así que obtenemos todos y filtramos
      const clients = await this.getClientsByOwner(ownerId);

      const searchLower = searchTerm.toLowerCase();
      return clients.filter(client =>
        client.name.toLowerCase().includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower) ||
        client.company?.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      logger.error('Error al buscar clientes', error as Error);
      throw error;
    }
  }
}
