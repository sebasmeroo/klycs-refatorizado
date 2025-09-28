import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  User,
  TeamProfessional 
} from '@/types';
import { CollaborativeCalendarService } from '@/services/collaborativeCalendar';
import { info, error as logError } from '@/utils/logger';

// ===== SERVICIO SIMPLIFICADO DE PROFESIONALES =====

export class ProfessionalService {
  
  // ===== GESTIÓN DE PROFESIONALES EN EL USUARIO =====
  
  static async addProfessionalToUser(
    userId: string, 
    professionalData: {
      name: string;
      email: string;
      role: string;
      color: string;
      permissions: TeamProfessional['permissions'];
    }
  ): Promise<string> {
    try {
      console.log('👨‍⚕️ Agregando profesional al usuario:', userId);
      
      // Obtener usuario actual
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('Usuario no encontrado');
      }

      const userData = userDoc.data() as User;
      const currentProfessionals = userData.professionals || [];

      // Verificar que el email no esté ya en el equipo
      const emailExists = currentProfessionals.some(p => p.email === professionalData.email);
      if (emailExists) {
        throw new Error('Ya existe un profesional con este email');
      }

      // ✅ VERIFICAR SI YA EXISTE UN CALENDARIO PARA ESE EMAIL
      console.log('🔍 Verificando calendarios existentes para el email:', professionalData.email);
      const existingCalendars = await CollaborativeCalendarService.getUserCalendars(userId);
      const existingCalendar = existingCalendars.find(cal => cal.linkedEmail === professionalData.email);
      
      if (existingCalendar) {
        console.log('❌ Ya existe un calendario para este email:', existingCalendar.id);
        throw new Error(`Ya existe un calendario para el email ${professionalData.email}. Por favor elimina el calendario duplicado primero.`);
      }

      // Crear el profesional (sin valores undefined para Firebase)
      const newProfessional: TeamProfessional = {
        id: `prof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: professionalData.name,
        email: professionalData.email,
        role: professionalData.role,
        color: professionalData.color,
        isActive: true,
        hasAccount: false,
        inviteStatus: 'pending',
        invitedAt: new Date(),
        // joinedAt es opcional - se agregará cuando se registre
        permissions: professionalData.permissions,
        // avatar y linkedCalendarId se agregarán después si son necesarios
      };

      // Crear calendario para el profesional
      console.log('📅 Creando calendario para el profesional...');
      const calendarId = await CollaborativeCalendarService.createProfessionalCalendar({
        name: `Calendario de ${professionalData.name}`,
        description: `Calendario profesional de ${professionalData.name} - ${professionalData.role}`,
        color: professionalData.color,
        ownerId: userId,
        linkedEmail: professionalData.email,
        members: [
          {
            id: userId,
            name: userData.displayName || 'Administrador',
            email: userData.email,
            role: 'admin',
            color: '#3B82F6',
            joinedAt: new Date(),
            isActive: true
          }
        ],
        settings: {
          allowMemberInvites: false,
          allowEventEditing: true,
          allowEventDeleting: professionalData.permissions.canDeleteEvents,
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
        isPublic: false
      });

      // Vincular calendario al profesional (agregar campo ahora que no es undefined)
      (newProfessional as any).linkedCalendarId = calendarId;
      console.log('🔗 Calendario vinculado:', calendarId);

      // Debug: mostrar el profesional completo antes de guardarlo
      console.log('👨‍⚕️ Profesional a guardar:', JSON.stringify(newProfessional, null, 2));

      // Preparar los datos de actualización
      // Si el campo professionals no existe, lo inicializamos como array vacío
      const updateData: any = {
        professionals: currentProfessionals.length === 0 && !userData.professionals ? 
          [newProfessional] : arrayUnion(newProfessional),
        updatedAt: serverTimestamp()
      };

      console.log('💾 Datos de actualización:', JSON.stringify(updateData, null, 2));

      // Si es el primer profesional, crear nombre del equipo automáticamente
      if (currentProfessionals.length === 0 && !userData.teamName) {
        updateData.teamName = `Equipo de ${userData.displayName || userData.email}`;
      }

      // Actualizar el usuario con el nuevo profesional
      await updateDoc(doc(db, 'users', userId), updateData);

      console.log('✅ Profesional agregado exitosamente:', newProfessional.id);
      info('Profesional agregado al usuario', { 
        userId, 
        professionalId: newProfessional.id, 
        email: professionalData.email,
        calendarId 
      });
      
      return newProfessional.id;
      
    } catch (error) {
      console.error('❌ Error agregando profesional:', error);
      logError('Error al agregar profesional', error as Error, { userId, email: professionalData.email });
      throw error;
    }
  }

  static async removeProfessionalFromUser(userId: string, professionalId: string): Promise<void> {
    try {
      // Obtener usuario actual
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('Usuario no encontrado');
      }

      const userData = userDoc.data() as User;
      const currentProfessionals = userData.professionals || [];

      const professional = currentProfessionals.find(p => p.id === professionalId);
      if (!professional) {
        throw new Error('Profesional no encontrado');
      }

      // Eliminar calendario vinculado si existe
      if (professional.linkedCalendarId) {
        // TODO: Implementar eliminación de calendario
        console.log('🗑️ Eliminando calendario:', professional.linkedCalendarId);
      }

      // Remover profesional del usuario
      await updateDoc(doc(db, 'users', userId), {
        professionals: arrayRemove(professional),
        updatedAt: serverTimestamp()
      });

      info('Profesional removido del usuario', { userId, professionalId });
      
    } catch (error) {
      logError('Error al remover profesional', error as Error, { userId, professionalId });
      throw error;
    }
  }

  // ===== ACCESO DE PROFESIONALES =====
  
  static async getProfessionalByEmail(email: string): Promise<{
    professional: TeamProfessional;
    owner: User;
  } | null> {
    try {
      console.log('🔍 Buscando profesional por email:', email);
      
      // Buscar en todos los usuarios que tengan profesionales
      // Nota: En una implementación real, sería mejor tener un índice para esto
      // Por ahora, buscamos por el linkedEmail en los calendarios
      
      return null; // TODO: Implementar búsqueda eficiente
      
    } catch (error) {
      console.error('Error buscando profesional:', error);
      logError('Error al buscar profesional por email', error as Error, { email });
      return null;
    }
  }

  static async markProfessionalAsRegistered(userId: string, professionalEmail: string, professionalUserId: string): Promise<void> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('Usuario no encontrado');
      }

      const userData = userDoc.data() as User;
      const currentProfessionals = userData.professionals || [];
      
      const professionalIndex = currentProfessionals.findIndex(p => p.email === professionalEmail);
      if (professionalIndex === -1) {
        throw new Error('Profesional no encontrado en el usuario');
      }

      // Crear nueva lista con el profesional actualizado
      const updatedProfessionals = [...currentProfessionals];
      updatedProfessionals[professionalIndex] = {
        ...updatedProfessionals[professionalIndex],
        hasAccount: true,
        inviteStatus: 'accepted',
        joinedAt: new Date()
      };

      // Actualizar en Firebase
      await updateDoc(doc(db, 'users', userId), {
        professionals: updatedProfessionals,
        updatedAt: serverTimestamp()
      });

      info('Profesional marcado como registrado', { userId, professionalEmail, professionalUserId });
      
    } catch (error) {
      logError('Error al marcar profesional como registrado', error as Error, { userId, professionalEmail });
      throw error;
    }
  }

  // ===== GESTIÓN DE NOMBRE DE EQUIPO =====
  
  static async updateTeamName(userId: string, teamName: string, teamDescription?: string): Promise<void> {
    try {
      const updateData: any = {
        teamName: teamName.trim(),
        updatedAt: serverTimestamp()
      };

      if (teamDescription !== undefined) {
        updateData.teamDescription = teamDescription.trim() || null;
      }

      await updateDoc(doc(db, 'users', userId), updateData);
      
      info('Nombre de equipo actualizado', { userId, teamName });
      
    } catch (error) {
      logError('Error al actualizar nombre de equipo', error as Error, { userId, teamName });
      throw error;
    }
  }

  // ===== UTILIDADES =====
  
  static async getUserProfessionals(userId: string): Promise<TeamProfessional[]> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        return [];
      }

      const userData = userDoc.data() as User;
      return userData.professionals || [];
      
    } catch (error) {
      logError('Error al obtener profesionales del usuario', error as Error, { userId });
      return [];
    }
  }

  // ===== LIMPIEZA DE DUPLICADOS =====
  
  static async cleanDuplicateCalendars(userId: string): Promise<{ cleaned: number; remaining: string[] }> {
    try {
      console.log('🧹 Iniciando limpieza de calendarios duplicados...');
      
      const calendars = await CollaborativeCalendarService.getUserCalendars(userId);
      const emailGroups: { [email: string]: any[] } = {};
      
      // Agrupar calendarios por email
      calendars.forEach(calendar => {
        if (calendar.linkedEmail) {
          if (!emailGroups[calendar.linkedEmail]) {
            emailGroups[calendar.linkedEmail] = [];
          }
          emailGroups[calendar.linkedEmail].push(calendar);
        }
      });
      
      let cleanedCount = 0;
      const remainingCalendars: string[] = [];
      
      // Para cada grupo de emails, mantener solo el más reciente
      for (const [email, calendarsForEmail] of Object.entries(emailGroups)) {
        if (calendarsForEmail.length > 1) {
          console.log(`🔄 Encontrados ${calendarsForEmail.length} calendarios para ${email}`);
          
          // Ordenar por fecha de creación (más reciente primero)
          calendarsForEmail.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          
          // Mantener el primero (más reciente), eliminar los demás
          const [keepCalendar, ...duplicates] = calendarsForEmail;
          remainingCalendars.push(keepCalendar.id);
          
          for (const duplicate of duplicates) {
            console.log(`🗑️ Eliminando calendario duplicado: ${duplicate.id}`);
            try {
              await CollaborativeCalendarService.deleteCalendar(duplicate.id);
              cleanedCount++;
            } catch (error) {
              console.error(`❌ Error eliminando calendario ${duplicate.id}:`, error);
            }
          }
        } else {
          remainingCalendars.push(calendarsForEmail[0].id);
        }
      }
      
      console.log(`✅ Limpieza completada. Eliminados: ${cleanedCount}, Restantes: ${remainingCalendars.length}`);
      
      return { cleaned: cleanedCount, remaining: remainingCalendars };
      
    } catch (error) {
      console.error('❌ Error en limpieza de duplicados:', error);
      logError('Error al limpiar calendarios duplicados', error as Error, { userId });
      return { cleaned: 0, remaining: [] };
    }
  }
}

export default ProfessionalService;
