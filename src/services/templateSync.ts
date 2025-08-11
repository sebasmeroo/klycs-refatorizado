import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where,
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AdminTemplate } from './templateDistribution';
import { UserTemplate } from './userTemplates';

/**
 * Sincroniza plantillas públicas de admin a la colección de plantillas de usuario
 */
export class TemplateSyncService {
  private adminCollection = 'adminTemplates';
  private userCollection = 'userTemplates';

  /**
   * Sincroniza todas las plantillas públicas desde adminTemplates a userTemplates
   */
  async syncPublicTemplates(): Promise<{ success: boolean; synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      console.log('🔄 Iniciando sincronización de plantillas públicas...');

      // Obtener todas las plantillas públicas de admin
      const adminTemplatesRef = collection(db, this.adminCollection);
      const publicTemplatesQuery = query(
        adminTemplatesRef,
        where('isPublic', '==', true)
      );
      
      const adminSnapshot = await getDocs(publicTemplatesQuery);
      
      if (adminSnapshot.empty) {
        console.log('ℹ️ No hay plantillas públicas para sincronizar');
        return { success: true, synced: 0, errors: [] };
      }

      // Sincronizar cada plantilla
      for (const adminDoc of adminSnapshot.docs) {
        try {
          const adminTemplate = {
            id: adminDoc.id,
            ...adminDoc.data()
          } as AdminTemplate;

          // Convertir a formato de plantilla de usuario
          const userTemplate: UserTemplate = {
            id: adminTemplate.id!,
            name: adminTemplate.name,
            description: adminTemplate.description,
            category: adminTemplate.category,
            version: adminTemplate.version,
            author: adminTemplate.author,
            targetSection: adminTemplate.targetSection,
            reactCode: adminTemplate.reactCode,
            cssCode: adminTemplate.cssCode,
            jsonConfig: adminTemplate.jsonConfig,
            isPublic: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            downloadCount: 0,
            rating: 5,
            tags: [adminTemplate.category, adminTemplate.targetSection]
          };

          // Guardar en userTemplates
          const userTemplateRef = doc(db, this.userCollection, adminTemplate.id!);
          await setDoc(userTemplateRef, {
            ...userTemplate,
            syncedAt: serverTimestamp()
          }, { merge: true });

          synced++;
          console.log(`✅ Sincronizada: ${adminTemplate.name}`);

        } catch (error: any) {
          const errorMsg = `Error sincronizando ${adminDoc.id}: ${error.message}`;
          console.error('❌', errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log(`🎉 Sincronización completada: ${synced} plantillas`);
      
      return { 
        success: true, 
        synced, 
        errors 
      };

    } catch (error: any) {
      console.error('❌ Error en sincronización:', error);
      return {
        success: false,
        synced,
        errors: [error.message]
      };
    }
  }

  /**
   * Verifica si una plantilla específica existe en userTemplates
   */
  async templateExistsInUserCollection(templateId: string): Promise<boolean> {
    try {
      const userTemplateRef = doc(db, this.userCollection, templateId);
      const userTemplateDoc = await getDoc(userTemplateRef);
      return userTemplateDoc.exists();
    } catch (error) {
      console.error('Error verificando plantilla:', error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas de sincronización
   */
  async getSyncStats(): Promise<{
    adminPublic: number;
    userTemplates: number;
    needsSync: number;
  }> {
    try {
      // Contar plantillas públicas en adminTemplates
      const adminQuery = query(
        collection(db, this.adminCollection),
        where('isPublic', '==', true)
      );
      const adminSnapshot = await getDocs(adminQuery);
      const adminPublic = adminSnapshot.size;

      // Contar plantillas en userTemplates
      const userSnapshot = await getDocs(collection(db, this.userCollection));
      const userTemplates = userSnapshot.size;

      // Calcular las que necesitan sincronización
      const needsSync = Math.max(0, adminPublic - userTemplates);

      return {
        adminPublic,
        userTemplates,
        needsSync
      };

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        adminPublic: 0,
        userTemplates: 0,
        needsSync: 0
      };
    }
  }
}

export const templateSyncService = new TemplateSyncService();

// Hacer disponible globalmente para debug
(window as any).syncTemplates = () => templateSyncService.syncPublicTemplates();
(window as any).templateSyncStats = () => templateSyncService.getSyncStats();