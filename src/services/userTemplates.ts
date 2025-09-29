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
  serverTimestamp,
  onSnapshot
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
  targetSection: 'profile' | 'links' | 'social' | 'services' | 'portfolio' | 'booking' | 'elements' | 'design';
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
  targetSection?: 'profile' | 'links' | 'social' | 'services' | 'portfolio' | 'booking' | 'elements' | 'design';
  // Nuevo: cuando la plantilla se aplica a un item específico dentro de una sección (por ejemplo, un enlace)
  targetItemId?: string;
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
    templateData: Record<string, any>,
    options?: { targetItemId?: string }
  ): Promise<UserTemplateInstance | null> {
    try {
      // Obtener plantilla para conocer su sección
      const template = await this.getTemplate(templateId);
      const targetSection = template?.targetSection;

      // Desactivar cualquier plantilla anterior en esta tarjeta PERO solo de la misma sección y (si aplica) del mismo item
      await this.deactivateCardTemplates(cardId, targetSection, options?.targetItemId);

      // Crear nueva instancia de plantilla
      const instanceRef = collection(db, this.instancesCollection);
      const newInstance: any = {
        templateId,
        userId,
        cardId,
        targetSection: targetSection,
        // Solo incluir targetItemId cuando exista, Firestore no permite undefined
        ...(options?.targetItemId ? { targetItemId: options.targetItemId } : {}),
        data: templateData,
        isActive: true,
        appliedAt: serverTimestamp()
      };

      const docRef = await addDoc(instanceRef, newInstance);

      // Incrementar contador de descargas (no bloquear en caso de fallo de permisos)
      try {
        await this.incrementDownloadCount(templateId);
      } catch (incErr) {
        console.warn('No se pudo incrementar downloadCount (continuando):', incErr);
      }

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
  private async deactivateCardTemplates(cardId: string, section?: string, targetItemId?: string): Promise<void> {
    try {
      const instancesRef = collection(db, this.instancesCollection);
      // Usar query simple para evitar problemas de índices
      const q = query(
        instancesRef,
        where('cardId', '==', cardId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const updatePromises: Promise<void>[] = [];
      
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        
        // Filtrar en cliente con la misma lógica que los otros métodos
        let shouldDeactivate = false;
        
        // Verificar sección si se especifica
        if (section && data.targetSection !== section) {
          return; // Skip si no coincide la sección
        }
        
        // Aplicar lógica de targetItemId
        if (targetItemId) {
          // Si buscamos una plantilla específica, solo desactivar plantillas para ese item
          shouldDeactivate = data.targetItemId === targetItemId;
        } else {
          // Si no especificamos targetItemId, solo desactivar plantillas generales
          shouldDeactivate = !data.targetItemId;
        }
        
        if (shouldDeactivate) {
          updatePromises.push(
            updateDoc(doc(db, this.instancesCollection, docSnapshot.id), {
              isActive: false
            })
          );
        }
      });
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error deactivating card templates:', error);
    }
  }

  // Obtener plantilla activa de una tarjeta
  async getActiveTemplateForCard(
    cardId: string,
    section?: 'profile' | 'links' | 'social' | 'services' | 'portfolio' | 'booking' | 'elements' | 'design',
    targetItemId?: string
  ): Promise<{
    template: UserTemplate;
    instance: UserTemplateInstance;
  } | null> {
    try {
      // Validar entrada
      if (!cardId || cardId === 'undefined') {
        return null;
      }

      const instancesRef = collection(db, this.instancesCollection);
      // Usar sólo filtro por cardId para evitar necesidad de índices compuestos
      const q = query(instancesRef, where('cardId', '==', cardId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      // Filtrar en cliente por sección, item y activo
      const docs = querySnapshot.docs
        .map(d => ({ id: d.id, ...(d.data() as any) }))
        .filter(d => d.isActive === true)
        .filter(d => (section ? d.targetSection === section : true))
        .filter(d => {
          // Si se especifica targetItemId, solo devolver instancias para ese item específico
          if (targetItemId) {
            return d.targetItemId === targetItemId;
          }
          // Si NO se especifica targetItemId, solo devolver instancias generales (sin targetItemId)
          return !d.targetItemId;
        });

      if (docs.length === 0) return null;

      const instanceDoc = { id: docs[0].id, ...docs[0] } as any;
      const instance = {
        id: instanceDoc.id,
        ...instanceDoc
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

  /**
   * Suscribirse en tiempo real a la plantilla activa de una tarjeta.
   * Llama al callback con { template, instance } o null cuando no hay activa.
   * Devuelve una función para desuscribirse.
   */
  subscribeActiveTemplateForCard(
    cardId: string,
    section: 'profile' | 'links' | 'social' | 'services' | 'portfolio' | 'booking' | 'elements' | 'design' | undefined,
    callback: (data: { template: UserTemplate; instance: UserTemplateInstance } | null) => void,
    options?: { targetItemId?: string }
  ): () => void {
    if (!cardId || cardId === 'undefined') {
      callback(null);
      return () => {};
    }

    let unsubscribeTemplateDoc: (() => void) | null = null;

    const instancesRef = collection(db, this.instancesCollection);
    // Sólo por cardId; filtramos en cliente para evitar índices compuestos
    const q = query(instancesRef, where('cardId', '==', cardId));

    const unsubscribeInstances = onSnapshot(q, async (querySnapshot) => {
      try {
        // Reset listener del template si cambia la instancia
        if (unsubscribeTemplateDoc) {
          unsubscribeTemplateDoc();
          unsubscribeTemplateDoc = null;
        }

        const docs = querySnapshot.docs
          .map(d => ({ id: d.id, ...(d.data() as any) }))
          .filter(d => d.isActive === true)
          .filter(d => (section ? d.targetSection === section : true))
          .filter(d => {
            // Si se especifica targetItemId, solo devolver instancias para ese item específico
            if (options?.targetItemId) {
              return d.targetItemId === options.targetItemId;
            }
            // Si NO se especifica targetItemId, solo devolver instancias generales (sin targetItemId)
            return !d.targetItemId;
          });

        if (docs.length === 0) {
          callback(null);
          return;
        }

        const instance = {
          id: docs[0].id,
          ...docs[0]
        } as UserTemplateInstance;

        // Escuchar cambios del documento de la plantilla también (react/css/json)
        const templateRef = doc(db, this.collectionName, instance.templateId);
        unsubscribeTemplateDoc = onSnapshot(templateRef, (templateSnap) => {
          if (!templateSnap.exists()) {
            callback(null);
            return;
          }
          const template = {
            id: templateSnap.id,
            ...templateSnap.data()
          } as UserTemplate;
          callback({ template, instance });
        });
      } catch (error) {
        console.error('Error subscribing active template for card:', error);
        callback(null);
      }
    }, (error) => {
      // Errores de permisos o similares
      console.warn('Suscripción a plantillas activa falló:', error);
      callback(null);
    });

    return () => {
      unsubscribeInstances();
      if (unsubscribeTemplateDoc) unsubscribeTemplateDoc();
    };
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
  async removeTemplateFromCard(cardId: string, section?: string, targetItemId?: string): Promise<boolean> {
    try {
      await this.deactivateCardTemplates(cardId, section, targetItemId);
      return true;
    } catch (error) {
      console.error('Error removing template from card:', error);
      return false;
    }
  }
}

export const userTemplatesService = new UserTemplatesService();
