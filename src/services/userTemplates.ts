import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'image' | 'color' | 'textarea' | 'select' | 'number';
  defaultValue: string;
  options?: string[];
  editable: boolean;
}

export interface UserTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  author: string;
  targetSection: 'profile' | 'links' | 'social' | 'services' | 'booking' | 'portfolio' | 'elements' | 'design';
  reactCode: string;
  cssCode: string;
  jsonConfig: TemplateField[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  downloadCount: number;
  rating: number;
  tags: string[];
}

export interface UserTemplateInstance {
  id: string;
  templateId: string;
  userId: string;
  cardId: string;
  data: Record<string, any>;
  isActive: boolean;
  appliedAt: string;
}

class UserTemplatesService {
  private collectionName = 'userTemplates';
  private instancesCollection = 'templateInstances';

  // Obtener plantillas públicas por sección
  async getTemplatesBySection(section: string): Promise<UserTemplate[]> {
    try {
      const templatesRef = collection(db, this.collectionName);
      const q = query(
        templatesRef,
        where('isPublic', '==', true),
        where('targetSection', '==', section),
        orderBy('downloadCount', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const templates: UserTemplate[] = [];
      
      querySnapshot.forEach((doc) => {
        templates.push({
          id: doc.id,
          ...doc.data()
        } as UserTemplate);
      });
      
      return templates;
    } catch (error) {
      console.error('Error fetching templates by section:', error);
      return [];
    }
  }

  // Obtener todas las plantillas públicas
  async getPublicTemplates(): Promise<UserTemplate[]> {
    try {
      const templatesRef = collection(db, this.collectionName);
      const q = query(
        templatesRef,
        where('isPublic', '==', true),
        orderBy('downloadCount', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const templates: UserTemplate[] = [];
      
      querySnapshot.forEach((doc) => {
        templates.push({
          id: doc.id,
          ...doc.data()
        } as UserTemplate);
      });
      
      return templates;
    } catch (error) {
      console.error('Error fetching public templates:', error);
      return [];
    }
  }

  // Obtener una plantilla específica
  async getTemplate(templateId: string): Promise<UserTemplate | null> {
    try {
      const templateRef = doc(db, this.collectionName, templateId);
      const templateDoc = await getDoc(templateRef);
      
      if (templateDoc.exists()) {
        return {
          id: templateDoc.id,
          ...templateDoc.data()
        } as UserTemplate;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching template:', error);
      return null;
    }
  }

  // Aplicar plantilla a una tarjeta de usuario
  async applyTemplateToCard(
    templateId: string, 
    userId: string, 
    cardId: string, 
    templateData: Record<string, any>
  ): Promise<UserTemplateInstance | null> {
    try {
      // Desactivar cualquier plantilla anterior en esta tarjeta
      await this.deactivateCardTemplates(cardId);

      // Crear nueva instancia de plantilla
      const instanceRef = collection(db, this.instancesCollection);
      const newInstance = {
        templateId,
        userId,
        cardId,
        data: templateData,
        isActive: true,
        appliedAt: serverTimestamp()
      };

      const docRef = await addDoc(instanceRef, newInstance);

      // Incrementar contador de descargas
      await this.incrementDownloadCount(templateId);

      return {
        id: docRef.id,
        ...newInstance,
        appliedAt: new Date().toISOString()
      } as UserTemplateInstance;
    } catch (error) {
      console.error('Error applying template to card:', error);
      return null;
    }
  }

  // Desactivar plantillas de una tarjeta
  private async deactivateCardTemplates(cardId: string): Promise<void> {
    try {
      const instancesRef = collection(db, this.instancesCollection);
      const q = query(
        instancesRef,
        where('cardId', '==', cardId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const updatePromises: Promise<void>[] = [];
      
      querySnapshot.forEach((docSnapshot) => {
        updatePromises.push(
          updateDoc(doc(db, this.instancesCollection, docSnapshot.id), {
            isActive: false
          })
        );
      });
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error deactivating card templates:', error);
    }
  }

  // Obtener plantilla activa de una tarjeta
  async getActiveTemplateForCard(cardId: string): Promise<{
    template: UserTemplate;
    instance: UserTemplateInstance;
  } | null> {
    try {
      // Validar entrada
      if (!cardId || cardId === 'undefined') {
        return null;
      }

      const instancesRef = collection(db, this.instancesCollection);
      const q = query(
        instancesRef,
        where('cardId', '==', cardId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const instanceDoc = querySnapshot.docs[0];
      const instance = {
        id: instanceDoc.id,
        ...instanceDoc.data()
      } as UserTemplateInstance;

      const template = await this.getTemplate(instance.templateId);
      
      if (!template) {
        return null;
      }

      return { template, instance };
    } catch (error: any) {
      // Manejar específicamente errores de permisos
      if (error?.code === 'permission-denied' || 
          error?.message?.includes('Missing or insufficient permissions')) {
        console.warn('⚠️ Sin permisos para plantillas - esto es normal para usuarios no autenticados');
        return null;
      }
      
      console.error('Error getting active template for card:', error);
      return null;
    }
  }

  // Actualizar datos de una instancia de plantilla
  async updateTemplateInstance(
    instanceId: string, 
    newData: Record<string, any>
  ): Promise<boolean> {
    try {
      const instanceRef = doc(db, this.instancesCollection, instanceId);
      await updateDoc(instanceRef, {
        data: newData,
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating template instance:', error);
      return false;
    }
  }

  // Incrementar contador de descargas
  private async incrementDownloadCount(templateId: string): Promise<void> {
    try {
      const templateRef = doc(db, this.collectionName, templateId);
      const templateDoc = await getDoc(templateRef);
      
      if (templateDoc.exists()) {
        const currentCount = templateDoc.data()?.downloadCount || 0;
        // Solo actualizar downloadCount para cumplir reglas de Firestore
        await updateDoc(templateRef, {
          downloadCount: currentCount + 1
        });
      }
    } catch (error) {
      console.error('Error incrementing download count:', error);
    }
  }

  // Buscar plantillas
  async searchTemplates(searchTerm: string, section?: string): Promise<UserTemplate[]> {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('isPublic', '==', true)
      );

      if (section) {
        q = query(
          collection(db, this.collectionName),
          where('isPublic', '==', true),
          where('targetSection', '==', section)
        );
      }

      const querySnapshot = await getDocs(q);
      const allTemplates: UserTemplate[] = [];
      
      querySnapshot.forEach((doc) => {
        allTemplates.push({
          id: doc.id,
          ...doc.data()
        } as UserTemplate);
      });

      // Filtrar por término de búsqueda en el cliente
      const filteredTemplates = allTemplates.filter(template => 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      return filteredTemplates;
    } catch (error) {
      console.error('Error searching templates:', error);
      return [];
    }
  }

  // Remover plantilla de tarjeta
  async removeTemplateFromCard(cardId: string): Promise<boolean> {
    try {
      await this.deactivateCardTemplates(cardId);
      return true;
    } catch (error) {
      console.error('Error removing template from card:', error);
      return false;
    }
  }
}

export const userTemplatesService = new UserTemplatesService();