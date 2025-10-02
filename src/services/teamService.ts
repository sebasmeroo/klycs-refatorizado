import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  UserTeam, 
  TeamProfessional, 
  User 
} from '@/types';
import { authService } from '@/services/auth';
import { CollaborativeCalendarService } from '@/services/collaborativeCalendar';
import { info, error as logError } from '@/utils/logger';

// ===== SERVICIO DE EQUIPOS =====

export class TeamService {
  
  // ===== GESTIÓN DE EQUIPOS =====
  
  static async createTeam(ownerId: string, teamName: string, description?: string): Promise<string> {
    try {
      console.log('🚀 Creando equipo para usuario:', ownerId);
      
      const teamData: Omit<UserTeam, 'id'> = {
        ownerId,
        name: teamName,
        description,
        professionals: [],
        settings: {
          allowSelfRegistration: false,
          requireApproval: true,
          maxProfessionals: 10 // Límite por defecto
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const teamDoc = await addDoc(collection(db, 'teams'), {
        ...teamData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('✅ Equipo creado con ID:', teamDoc.id);
      info('Equipo creado exitosamente', { teamId: teamDoc.id, ownerId, teamName });
      
      return teamDoc.id;
      
    } catch (error) {
      console.error('❌ Error creando equipo:', error);
      logError('Error al crear equipo', error as Error, { ownerId, teamName });
      throw error;
    }
  }

  static async getUserTeam(ownerId: string): Promise<UserTeam | null> {
    try {
      const q = query(
        collection(db, 'teams'),
        where('ownerId', '==', ownerId)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      const teamDoc = snapshot.docs[0];
      const teamData = teamDoc.data();
      
      return {
        id: teamDoc.id,
        ownerId: teamData.ownerId,
        name: teamData.name,
        description: teamData.description,
        professionals: teamData.professionals || [],
        settings: teamData.settings,
        createdAt: teamData.createdAt.toDate(),
        updatedAt: teamData.updatedAt.toDate()
      };
      
    } catch (error) {
      logError('Error al obtener equipo del usuario', error as Error, { ownerId });
      return null;
    }
  }

  // ===== GESTIÓN DE PROFESIONALES =====
  
  static async addProfessional(
    teamId: string, 
    professionalData: {
      name: string;
      email: string;
      role: string;
      color: string;
      permissions: TeamProfessional['permissions'];
    }
  ): Promise<string> {
    try {
      console.log('👨‍⚕️ Agregando profesional al equipo:', teamId);
      
      // Verificar que el email no esté ya en el equipo
      const team = await this.getTeamById(teamId);
      if (!team) {
        throw new Error('Equipo no encontrado');
      }

      const emailExists = team.professionals.some(p => p.email === professionalData.email);
      if (emailExists) {
        throw new Error('Ya existe un profesional con este email en el equipo');
      }

      // Crear el profesional
      const newProfessional: TeamProfessional = {
        id: `prof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: professionalData.name,
        email: professionalData.email,
        role: professionalData.role,
        avatar: undefined,
        color: professionalData.color,
        isActive: true,
        linkedCalendarId: undefined, // Se asignará cuando se cree el calendario
        hasAccount: false,
        inviteStatus: 'pending',
        invitedAt: new Date(),
        permissions: professionalData.permissions
      };

      // Crear calendario para el profesional
      console.log('📅 Creando calendario para el profesional...');
      const calendarId = await CollaborativeCalendarService.createProfessionalCalendar({
        name: `Calendario de ${professionalData.name}`,
        description: `Calendario profesional de ${professionalData.name} - ${professionalData.role}`,
        color: professionalData.color,
        ownerId: team.ownerId,
        linkedEmail: professionalData.email,
        members: [
          {
            id: team.ownerId,
            name: 'Administrador',
            email: 'admin@temp.com', // Se actualizará con datos reales
            role: 'admin',
            color: '#3B82F6',
            joinedAt: new Date(),
            isActive: true
          },
          {
            id: `professional_${Date.now()}`,
            name: professionalData.name,
            email: professionalData.email,
            role: 'professional',
            color: professionalData.color,
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

      // Vincular calendario al profesional
      newProfessional.linkedCalendarId = calendarId;
      console.log('🔗 Calendario vinculado:', calendarId);

      // Actualizar el equipo con el nuevo profesional
      const updatedProfessionals = [...team.professionals, newProfessional];
      
      await updateDoc(doc(db, 'teams', teamId), {
        professionals: updatedProfessionals,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Profesional agregado exitosamente:', newProfessional.id);
      info('Profesional agregado al equipo', { 
        teamId, 
        professionalId: newProfessional.id, 
        email: professionalData.email,
        calendarId 
      });
      
      return newProfessional.id;
      
    } catch (error) {
      console.error('❌ Error agregando profesional:', error);
      logError('Error al agregar profesional', error as Error, { teamId, email: professionalData.email });
      throw error;
    }
  }

  static async removeProfessional(teamId: string, professionalId: string): Promise<void> {
    try {
      const team = await this.getTeamById(teamId);
      if (!team) {
        throw new Error('Equipo no encontrado');
      }

      const professional = team.professionals.find(p => p.id === professionalId);
      if (!professional) {
        throw new Error('Profesional no encontrado');
      }

      // Eliminar calendario vinculado si existe
      if (professional.linkedCalendarId) {
        // TODO: Implementar eliminación de calendario
        console.log('🗑️ Eliminando calendario:', professional.linkedCalendarId);
      }

      // Remover profesional del equipo
      const updatedProfessionals = team.professionals.filter(p => p.id !== professionalId);
      
      await updateDoc(doc(db, 'teams', teamId), {
        professionals: updatedProfessionals,
        updatedAt: serverTimestamp()
      });

      info('Profesional removido del equipo', { teamId, professionalId });
      
    } catch (error) {
      logError('Error al remover profesional', error as Error, { teamId, professionalId });
      throw error;
    }
  }

  // ===== ACCESO DE PROFESIONALES =====
  
  static async getProfessionalByEmail(email: string): Promise<{
    professional: TeamProfessional;
    team: UserTeam;
  } | null> {
    try {
      console.log('🔍 Buscando profesional por email:', email);
      
      // Buscar en todos los equipos
      const teamsQuery = query(collection(db, 'teams'));
      const teamsSnapshot = await getDocs(teamsQuery);
      
      for (const teamDoc of teamsSnapshot.docs) {
        const teamData = teamDoc.data();
        const team: UserTeam = {
          id: teamDoc.id,
          ownerId: teamData.ownerId,
          name: teamData.name,
          description: teamData.description,
          professionals: teamData.professionals || [],
          settings: teamData.settings,
          createdAt: teamData.createdAt.toDate(),
          updatedAt: teamData.updatedAt.toDate()
        };
        
        const professional = team.professionals.find(p => p.email === email);
        if (professional) {
          console.log('✅ Profesional encontrado en equipo:', team.name);
          return { professional, team };
        }
      }
      
      console.log('❌ Profesional no encontrado');
      return null;
      
    } catch (error) {
      console.error('Error buscando profesional:', error);
      logError('Error al buscar profesional por email', error as Error, { email });
      return null;
    }
  }

  static async markProfessionalAsRegistered(teamId: string, professionalEmail: string, userId: string): Promise<void> {
    try {
      const team = await this.getTeamById(teamId);
      if (!team) {
        throw new Error('Equipo no encontrado');
      }

      const professionalIndex = team.professionals.findIndex(p => p.email === professionalEmail);
      if (professionalIndex === -1) {
        throw new Error('Profesional no encontrado en el equipo');
      }

      // Actualizar estado del profesional
      const updatedProfessionals = [...team.professionals];
      updatedProfessionals[professionalIndex] = {
        ...updatedProfessionals[professionalIndex],
        hasAccount: true,
        inviteStatus: 'accepted',
        joinedAt: new Date()
      };

      await updateDoc(doc(db, 'teams', teamId), {
        professionals: updatedProfessionals,
        updatedAt: serverTimestamp()
      });

      // Vincular usuario al calendario
      const professional = updatedProfessionals[professionalIndex];
      if (professional.linkedCalendarId) {
        await authService.linkUserToCalendar(userId, professional.linkedCalendarId);
      }

      info('Profesional marcado como registrado', { teamId, professionalEmail, userId });
      
    } catch (error) {
      logError('Error al marcar profesional como registrado', error as Error, { teamId, professionalEmail });
      throw error;
    }
  }

  // ===== UTILIDADES =====
  
  private static async getTeamById(teamId: string): Promise<UserTeam | null> {
    try {
      const teamDoc = await getDoc(doc(db, 'teams', teamId));
      
      if (!teamDoc.exists()) {
        return null;
      }

      const teamData = teamDoc.data();
      return {
        id: teamDoc.id,
        ownerId: teamData.ownerId,
        name: teamData.name,
        description: teamData.description,
        professionals: teamData.professionals || [],
        settings: teamData.settings,
        createdAt: teamData.createdAt.toDate(),
        updatedAt: teamData.updatedAt.toDate()
      };
      
    } catch (error) {
      logError('Error al obtener equipo por ID', error as Error, { teamId });
      return null;
    }
  }

  // Escuchar cambios en el equipo
  static subscribeToTeam(ownerId: string, callback: (team: UserTeam | null) => void): () => void {
    const q = query(
      collection(db, 'teams'),
      where('ownerId', '==', ownerId)
    );

    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback(null);
        return;
      }

      const teamDoc = snapshot.docs[0];
      const teamData = teamDoc.data();
      
      const team: UserTeam = {
        id: teamDoc.id,
        ownerId: teamData.ownerId,
        name: teamData.name,
        description: teamData.description,
        professionals: teamData.professionals || [],
        settings: teamData.settings,
        createdAt: teamData.createdAt.toDate(),
        updatedAt: teamData.updatedAt.toDate()
      };
      
      callback(team);
    });
  }
}

export default TeamService;
