import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  setDoc 
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { secureLogger } from '@/utils/secureLogger';
import type { TemplateArtifact } from '@/services/templateCompiler';

export interface TemplateStats {
  totalTemplates: number;
  publicTemplates: number;
  privateTemplates: number;
  totalDownloads: number;
  averageRating: number;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  isPublic: boolean;
  downloads: number;
  usage: number;
  trend: number;
  targetSection?: 'profile' | 'links' | 'social' | 'services' | 'booking' | 'portfolio' | 'elements' | 'design';
  reactCode?: string;
  cssCode?: string;
  jsonConfig?: any[];
  version?: string;
  author?: string;
  tags?: string[];
}

export interface AdminTemplate {
  id?: string;
  name: string;
  description: string;
  category: string;
  version: string;
  author: string;
  targetSection: 'profile' | 'links' | 'social' | 'services' | 'booking' | 'portfolio' | 'elements' | 'design';
  reactCode: string;
  cssCode: string;
  jsonConfig: any[];
  isPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
  downloadCount?: number;
  rating?: number;
  tags?: string[];

  // Artefacto precompilado opcional
  artifact?: TemplateArtifact;
}

class TemplateDistributionService {
  private collectionName = 'userTemplates';
  private adminsCollection = 'admins';

  private async ensureAdminUser(): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No autenticado. Inicia sesión como admin.');
    }
    const adminRef = doc(db, this.adminsCollection, user.uid);
    const adminDoc = await getDoc(adminRef);
    if (!adminDoc.exists()) {
      const bootstrapEnabled = import.meta.env.MODE !== 'production' || import.meta.env.VITE_ADMIN_BOOTSTRAP_ENABLED === 'true';
      if (!bootstrapEnabled) {
        throw new Error('El usuario no tiene permisos de admin para eliminar plantillas.');
      }
      await setDoc(adminRef, {
        id: user.uid,
        email: user.email || 'admin@local',
        name: user.displayName || 'Administrador',
        role: 'admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }

  // Crear o actualizar plantilla desde admin
  async saveTemplate(templateData: AdminTemplate): Promise<string | null> {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        secureLogger.devOnly(`Intento ${attempts}/${maxAttempts} de guardar plantilla`);
        
        // Eliminar campos undefined y el id del payload a Firestore
        const { id: _omitId, ...rest } = templateData as any;
        const cleaned: Record<string, any> = {};
        Object.keys(rest).forEach((k) => {
          const v = (rest as any)[k];
          if (v !== undefined) cleaned[k] = v;
        });

        const template = {
          ...cleaned,
          downloadCount: templateData.downloadCount || 0,
          rating: templateData.rating || 0,
          tags: templateData.tags || [],
          createdAt: templateData.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        if (templateData.id) {
          // Actualizar plantilla existente
          const templateRef = doc(db, this.collectionName, templateData.id);
          await updateDoc(templateRef, template);
          // Operación exitosa - sin log
          return templateData.id;
        } else {
          // Crear nueva plantilla
          const templateRef = await addDoc(collection(db, this.collectionName), template);
          // Plantilla creada exitosamente - sin log
          return templateRef.id;
        }
      } catch (error: any) {
        secureLogger.error(`Error en intento ${attempts}`, error);
        
        if (attempts === maxAttempts) {
          secureLogger.error('Todos los intentos fallaron al guardar plantilla');
          return null;
        }
        
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
    
    return null;
  }

  async getStats(): Promise<TemplateStats> {
    try {
      const templatesRef = collection(db, this.collectionName);
      const allTemplatesQuery = getDocs(templatesRef);
      const publicTemplatesQuery = getDocs(query(templatesRef, where('isPublic', '==', true)));

      const [allTemplates, publicTemplates] = await Promise.all([allTemplatesQuery, publicTemplatesQuery]);

      const totalDownloads = allTemplates.docs.reduce((sum, doc) => {
        return sum + (doc.data()?.downloadCount || 0);
      }, 0);

      const totalRating = allTemplates.docs.reduce((sum, doc) => {
        return sum + (doc.data()?.rating || 0);
      }, 0);

      const averageRating = allTemplates.size > 0 ? totalRating / allTemplates.size : 0;

      return {
        totalTemplates: allTemplates.size,
        publicTemplates: publicTemplates.size,
        privateTemplates: allTemplates.size - publicTemplates.size,
        totalDownloads,
        averageRating
      };
    } catch (error) {
      secureLogger.error('Error obteniendo estadísticas', error);
      return {
        totalTemplates: 0,
        publicTemplates: 0,
        privateTemplates: 0,
        totalDownloads: 0,
        averageRating: 0
      };
    }
  }

  async getTemplates(): Promise<Template[]> {
    try {
      const templatesRef = collection(db, this.collectionName);
      const q = query(templatesRef, orderBy('downloadCount', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const templates: Template[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        templates.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          category: data.category,
          isPublic: data.isPublic,
          downloads: data.downloadCount || 0,
          usage: data.downloadCount || 0,
          trend: Math.floor(Math.random() * 20) - 10, // Simulado por ahora
          targetSection: data.targetSection,
          reactCode: data.reactCode,
          cssCode: data.cssCode,
          jsonConfig: Array.isArray(data.jsonConfig) ? data.jsonConfig : [],
          version: data.version,
          author: data.author,
          tags: Array.isArray(data.tags) ? data.tags : []
        });
      });
      
      return templates;
    } catch (error) {
      secureLogger.error('Error obteniendo plantillas', error);
      return [];
    }
  }

  // Obtener una plantilla específica por ID
  async getTemplateById(templateId: string): Promise<AdminTemplate | null> {
    try {
      const templateRef = doc(db, this.collectionName, templateId);
      const templateDoc = await getDoc(templateRef);
      
      if (templateDoc.exists()) {
        return {
          id: templateDoc.id,
          ...templateDoc.data()
        } as AdminTemplate;
      }
      
      return null;
    } catch (error) {
      secureLogger.error('Error obteniendo plantilla por ID', error);
      return null;
    }
  }

  // Actualizar una plantilla existente
  async updateTemplate(templateId: string, updates: Partial<AdminTemplate>): Promise<boolean> {
    try {
      // Eliminar campos undefined y el id del payload
      const { id: _omitId, ...rest } = updates as any;
      const cleaned: Record<string, any> = {};
      Object.keys(rest).forEach((k) => {
        const v = (rest as any)[k];
        if (v !== undefined) cleaned[k] = v;
      });

      // Agregar timestamp de actualización
      const updateData = {
        ...cleaned,
        updatedAt: serverTimestamp()
      };

      const templateRef = doc(db, this.collectionName, templateId);
      await updateDoc(templateRef, updateData);
      
      // Plantilla actualizada - sin log
      return true;
    } catch (error) {
      secureLogger.error('Error actualizando plantilla', error);
      return false;
    }
  }

  // Eliminar una plantilla
  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      await this.ensureAdminUser();
      const templateRef = doc(db, this.collectionName, templateId);
      await deleteDoc(templateRef);
      
      // Plantilla eliminada - sin log
      return true;
    } catch (error) {
      secureLogger.error('Error eliminando plantilla', error);
      return false;
    }
  }

  // Duplicar una plantilla
  async duplicateTemplate(templateId: string): Promise<string | null> {
    try {
      // Obtener la plantilla original
      const originalTemplate = await this.getTemplateById(templateId);
      if (!originalTemplate) {
        throw new Error('Plantilla no encontrada');
      }

      // Crear nueva plantilla con datos duplicados
      const duplicatedTemplate: AdminTemplate = {
        ...originalTemplate,
        id: undefined, // Se generará un nuevo ID
        name: `${originalTemplate.name} (Copia)`,
        isPublic: false, // Las copias empiezan como borradores
        createdAt: undefined, // Se generará nuevo timestamp
        updatedAt: undefined
      };

      // Guardar la plantilla duplicada
      const newTemplateId = await this.saveTemplate(duplicatedTemplate);
      
      if (newTemplateId) {
        // Plantilla duplicada - sin log
      }
      
      return newTemplateId;
    } catch (error) {
      secureLogger.error('Error duplicando plantilla', error);
      return null;
    }
  }

  // Cambiar estado de publicación de una plantilla
  async togglePublishStatus(templateId: string, isPublic: boolean): Promise<boolean> {
    try {
      return await this.updateTemplate(templateId, { isPublic });
    } catch (error) {
      secureLogger.error('Error cambiando estado de publicación', error);
      return false;
    }
  }

  // Exportar plantilla como JSON
  async exportTemplate(templateId: string): Promise<any | null> {
    try {
      const template = await this.getTemplateById(templateId);
      if (!template) {
        throw new Error('Plantilla no encontrada');
      }

      // Preparar datos para exportación
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        template: {
          name: template.name,
          description: template.description,
          category: template.category,
          version: template.version,
          author: template.author,
          targetSection: template.targetSection,
          reactCode: template.reactCode,
          cssCode: template.cssCode,
          jsonConfig: template.jsonConfig,
          tags: template.tags || []
        }
      };

      // Plantilla exportada - sin log
      return exportData;
    } catch (error) {
      secureLogger.error('Error exportando plantilla', error);
      return null;
    }
  }
}

export const templateDistributionService = new TemplateDistributionService();
