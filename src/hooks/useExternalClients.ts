/**
 * External Clients Hooks
 * React Query hooks optimizados con caché multi-capa
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalClientsService } from '@/services/externalClientsService';
import {
  ExternalClient,
  ExternalClientService,
  ExternalClientInput,
  ExternalClientStats
} from '@/types/externalClient';
import { PersistentCache } from '@/utils/persistentCache';
import { logger } from '@/utils/logger';
import { toast } from '@/utils/toast';

const CACHE_TIME = 5 * 60 * 1000; // 5 minutos
const STALE_TIME = 3 * 60 * 1000; // 3 minutos

/**
 * Hook para obtener todos los clientes externos del usuario
 * ✅ Caché multi-capa: React Query + localStorage
 */
export const useExternalClients = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['externalClients', userId],
    queryFn: async (): Promise<ExternalClient[]> => {
      if (!userId) {
        return [];
      }

      // ✅ LAYER 2: Intentar obtener del PersistentCache
      const cacheKey = `externalClients:${userId}` as const;
      const cached = PersistentCache.get<ExternalClient[]>(cacheKey);

      if (cached) {
        logger.log('✅ Clientes externos obtenidos de localStorage (0 lecturas Firebase)');
        return cached;
      }

      // ✅ LAYER 3: Cargar desde Firebase
      logger.log('🔄 Cargando clientes externos desde Firebase...');
      const clients = await ExternalClientsService.getClientsByOwner(userId);

      // Guardar en cache
      PersistentCache.set(cacheKey, clients);

      logger.log(`✅ ${clients.length} clientes externos cargados y guardados en cache`);
      return clients;
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    enabled: !!userId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

/**
 * Hook para obtener un cliente específico
 */
export const useExternalClient = (clientId: string | undefined) => {
  return useQuery({
    queryKey: ['externalClient', clientId],
    queryFn: async (): Promise<ExternalClient | null> => {
      if (!clientId) {
        return null;
      }

      return await ExternalClientsService.getClient(clientId);
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    enabled: !!clientId,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para obtener servicios de un cliente
 */
export const useClientServices = (
  clientId: string | undefined,
  filters?: { startDate?: Date; endDate?: Date }
) => {
  return useQuery({
    queryKey: ['clientServices', clientId, filters],
    queryFn: async (): Promise<ExternalClientService[]> => {
      if (!clientId) {
        return [];
      }

      return await ExternalClientsService.getClientServices(clientId, filters);
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    enabled: !!clientId,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para obtener estadísticas de un cliente
 */
export const useClientStats = (
  clientId: string | undefined,
  filters?: { startDate?: Date; endDate?: Date }
) => {
  return useQuery({
    queryKey: ['clientStats', clientId, filters],
    queryFn: async (): Promise<ExternalClientStats | null> => {
      if (!clientId) {
        return null;
      }

      return await ExternalClientsService.getClientStats(clientId, filters);
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    enabled: !!clientId,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para crear cliente externo
 */
export const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      data
    }: {
      userId: string;
      data: ExternalClientInput;
    }) => {
      return await ExternalClientsService.createClient(userId, data);
    },
    onSuccess: (_, variables) => {
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['externalClients', variables.userId] });
      PersistentCache.delete(`externalClients:${variables.userId}`);

      toast.success('Cliente creado exitosamente');
      logger.log('✅ Cliente externo creado');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear cliente: ${error.message}`);
      logger.error('Error al crear cliente', error);
    },
  });
};

/**
 * Hook para actualizar cliente externo
 */
export const useUpdateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      data,
      userId
    }: {
      clientId: string;
      data: Partial<ExternalClientInput>;
      userId: string;
    }) => {
      return await ExternalClientsService.updateClient(clientId, data);
    },
    onSuccess: (_, variables) => {
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['externalClients', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['externalClient', variables.clientId] });
      PersistentCache.delete(`externalClients:${variables.userId}`);

      toast.success('Cliente actualizado exitosamente');
      logger.log('✅ Cliente externo actualizado');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar cliente: ${error.message}`);
      logger.error('Error al actualizar cliente', error);
    },
  });
};

/**
 * Hook para eliminar cliente externo
 */
export const useDeleteClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      userId
    }: {
      clientId: string;
      userId: string;
    }) => {
      return await ExternalClientsService.deleteClient(clientId);
    },
    onSuccess: (_, variables) => {
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['externalClients', variables.userId] });
      PersistentCache.delete(`externalClients:${variables.userId}`);

      toast.success('Cliente eliminado exitosamente');
      logger.log('✅ Cliente externo eliminado');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar cliente: ${error.message}`);
      logger.error('Error al eliminar cliente', error);
    },
  });
};

/**
 * Hook para registrar servicio
 * (Llamado automáticamente al completar evento)
 */
export const useRecordService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      serviceData
    }: {
      clientId: string;
      serviceData: {
        eventId: string;
        professionalId: string;
        professionalName: string;
        professionalRate: number;
        date: Date;
        title: string;
        hours: number;
      };
    }) => {
      return await ExternalClientsService.recordService(clientId, serviceData);
    },
    onSuccess: (_, variables) => {
      // Invalidar cache relacionado
      queryClient.invalidateQueries({ queryKey: ['externalClient', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['clientServices', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['clientStats', variables.clientId] });

      logger.log('✅ Servicio registrado para cliente externo');
    },
    onError: (error: Error) => {
      logger.error('Error al registrar servicio', error);
      // No mostrar toast aquí porque es automático
    },
  });
};

/**
 * Hook para cancelar servicio
 */
export const useCancelService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      serviceId
    }: {
      clientId: string;
      serviceId: string;
    }) => {
      return await ExternalClientsService.cancelService(clientId, serviceId);
    },
    onSuccess: (_, variables) => {
      // Invalidar cache relacionado
      queryClient.invalidateQueries({ queryKey: ['externalClient', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['clientServices', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['clientStats', variables.clientId] });

      toast.success('Servicio cancelado');
      logger.log('✅ Servicio cancelado');
    },
    onError: (error: Error) => {
      toast.error(`Error al cancelar servicio: ${error.message}`);
      logger.error('Error al cancelar servicio', error);
    },
  });
};

/**
 * Hook para buscar clientes
 */
export const useSearchClients = (userId: string | undefined, searchTerm: string) => {
  return useQuery({
    queryKey: ['searchClients', userId, searchTerm],
    queryFn: async (): Promise<ExternalClient[]> => {
      if (!userId || !searchTerm || searchTerm.length < 2) {
        return [];
      }

      return await ExternalClientsService.searchClients(userId, searchTerm);
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    enabled: !!userId && searchTerm.length >= 2,
    refetchOnWindowFocus: false,
  });
};
