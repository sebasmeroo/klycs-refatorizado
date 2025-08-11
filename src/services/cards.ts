import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  increment,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Card, CardTemplate, CardAnalytics } from '@/types';
import { error as logError, info } from '@/utils/logger';

const COLLECTION_NAME = 'cards';
const ANALYTICS_COLLECTION = 'cardAnalytics';
const TEMPLATES_COLLECTION = 'cardTemplates';

export class CardsService {
  
  static async createCard(userId: string, cardData: Omit<Card, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'clickCount'>): Promise<string> {
    try {
      const newCard = {
        ...cardData,
        userId,
        viewCount: 0,
        clickCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), newCard);
      
      info('Card created successfully', { 
        component: 'CardsService', 
        cardId: docRef.id, 
        userId 
      });
      
      return docRef.id;
    } catch (err) {
      logError('Failed to create card', err, { 
        component: 'CardsService', 
        userId 
      });
      throw new Error('Error al crear la tarjeta');
    }
  }

  static async updateCard(cardId: string, userId: string, updates: Partial<Card>): Promise<void> {
    try {
      const cardRef = doc(db, COLLECTION_NAME, cardId);
      
      // Verificar que la tarjeta pertenece al usuario
      const cardDoc = await getDoc(cardRef);
      if (!cardDoc.exists()) {
        throw new Error('Tarjeta no encontrada');
      }
      
      const cardData = cardDoc.data();
      if (cardData.userId !== userId) {
        throw new Error('No tienes permisos para editar esta tarjeta');
      }

      await updateDoc(cardRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      info('Card updated successfully', { 
        component: 'CardsService', 
        cardId, 
        userId 
      });
    } catch (err) {
      logError('Failed to update card', err, { 
        component: 'CardsService', 
        cardId, 
        userId 
      });
      throw err;
    }
  }

  static async deleteCard(cardId: string, userId: string): Promise<void> {
    try {
      const cardRef = doc(db, COLLECTION_NAME, cardId);
      
      // Verificar que la tarjeta pertenece al usuario
      const cardDoc = await getDoc(cardRef);
      if (!cardDoc.exists()) {
        throw new Error('Tarjeta no encontrada');
      }
      
      const cardData = cardDoc.data();
      if (cardData.userId !== userId) {
        throw new Error('No tienes permisos para eliminar esta tarjeta');
      }

      // Eliminar imágenes asociadas
      await this.deleteCardAssets(cardId);
      
      // Eliminar la tarjeta
      await deleteDoc(cardRef);

      info('Card deleted successfully', { 
        component: 'CardsService', 
        cardId, 
        userId 
      });
    } catch (err) {
      logError('Failed to delete card', err, { 
        component: 'CardsService', 
        cardId, 
        userId 
      });
      throw err;
    }
  }

  static async getCard(cardId: string): Promise<Card | null> {
    try {
      const cardRef = doc(db, COLLECTION_NAME, cardId);
      const cardDoc = await getDoc(cardRef);
      
      if (!cardDoc.exists()) {
        return null;
      }

      const data = cardDoc.data();
      return {
        id: cardDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Card;
    } catch (err) {
      logError('Failed to get card', err, { 
        component: 'CardsService', 
        cardId 
      });
      throw new Error('Error al obtener la tarjeta');
    }
  }

  static async getCardBySlug(slug: string): Promise<Card | null> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('slug', '==', slug),
        where('isPublic', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const cardDoc = querySnapshot.docs[0];
      const data = cardDoc.data();
      
      return {
        id: cardDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Card;
    } catch (err) {
      logError('Failed to get card by slug', err, { 
        component: 'CardsService', 
        slug 
      });
      throw new Error('Error al obtener la tarjeta');
    }
  }

  static async getUserCards(userId: string): Promise<Card[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Card;
      });
    } catch (err) {
      logError('Failed to get user cards', err, { 
        component: 'CardsService', 
        userId 
      });
      throw new Error('Error al obtener las tarjetas del usuario');
    }
  }

  static async incrementViewCount(cardId: string): Promise<void> {
    try {
      const cardRef = doc(db, COLLECTION_NAME, cardId);
      await updateDoc(cardRef, {
        viewCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      // También registrar en analytics
      await this.recordAnalyticsEvent(cardId, 'view');
    } catch (err) {
      logError('Failed to increment view count', err, { 
        component: 'CardsService', 
        cardId 
      });
      // No throw - esto no debería romper la experiencia del usuario
    }
  }

  static async incrementLinkClick(cardId: string, linkId: string): Promise<void> {
    try {
      const cardRef = doc(db, COLLECTION_NAME, cardId);
      const cardDoc = await getDoc(cardRef);
      
      if (!cardDoc.exists()) return;
      
      const cardData = cardDoc.data() as Card;
      const updatedLinks = cardData.links.map(link => 
        link.id === linkId 
          ? { 
              ...link, 
              analytics: { 
                ...link.analytics, 
                clicks: link.analytics.clicks + 1,
                lastClicked: new Date()
              } 
            }
          : link
      );

      await updateDoc(cardRef, {
        links: updatedLinks,
        clickCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      // También registrar en analytics
      await this.recordAnalyticsEvent(cardId, 'click', { linkId });
    } catch (err) {
      logError('Failed to increment link click', err, { 
        component: 'CardsService', 
        cardId, 
        linkId 
      });
      // No throw - esto no debería romper la experiencia del usuario
    }
  }

  static async uploadCardAsset(cardId: string, file: File, type: 'avatar' | 'background' | 'element'): Promise<string> {
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExtension}`;
      const filePath = `cards/${cardId}/${type}/${fileName}`;
      
      const storageRef = ref(storage, filePath);
      
      // Subir el archivo
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      info('Card asset uploaded successfully', { 
        component: 'CardsService', 
        cardId, 
        type, 
        fileName 
      });

      return downloadURL;
    } catch (err) {
      logError('Failed to upload card asset', err, { 
        component: 'CardsService', 
        cardId, 
        type 
      });
      throw new Error('Error al subir el archivo');
    }
  }

  static async isSlugAvailable(slug: string, excludeCardId?: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('slug', '==', slug)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return true;
      
      // Si estamos editando una tarjeta, verificar que no sea la misma
      if (excludeCardId) {
        return querySnapshot.docs.every(doc => doc.id === excludeCardId);
      }
      
      return false;
    } catch (err) {
      logError('Failed to check slug availability', err, { 
        component: 'CardsService', 
        slug 
      });
      throw new Error('Error al verificar la disponibilidad del enlace');
    }
  }

  private static async deleteCardAssets(cardId: string): Promise<void> {
    try {
      const cardAssetsRef = ref(storage, `cards/${cardId}`);
      // Note: Firebase Storage no tiene una función para eliminar carpetas directamente
      // En una implementación real, necesitarías listar todos los archivos y eliminarlos uno por uno
      // Por ahora, esto es solo un placeholder
    } catch (err) {
      logError('Failed to delete card assets', err, { 
        component: 'CardsService', 
        cardId 
      });
      // No throw - esto no debería impedir la eliminación de la tarjeta
    }
  }

  private static async recordAnalyticsEvent(
    cardId: string, 
    eventType: 'view' | 'click', 
    metadata?: any
  ): Promise<void> {
    try {
      const today = new Date();
      const dateKey = today.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const analyticsRef = doc(db, ANALYTICS_COLLECTION, `${cardId}_${dateKey}`);
      const analyticsDoc = await getDoc(analyticsRef);
      
      if (analyticsDoc.exists()) {
        // Actualizar estadísticas existentes
        const currentData = analyticsDoc.data();
        await updateDoc(analyticsRef, {
          [`${eventType}s`]: increment(1),
          lastUpdated: serverTimestamp(),
          ...(metadata && { [`${eventType}Metadata`]: [...(currentData[`${eventType}Metadata`] || []), metadata] }),
        });
      } else {
        // Crear nuevo registro de analytics
        await updateDoc(analyticsRef, {
          cardId,
          date: dateKey,
          views: eventType === 'view' ? 1 : 0,
          clicks: eventType === 'click' ? 1 : 0,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
          ...(metadata && { [`${eventType}Metadata`]: [metadata] }),
        });
      }
    } catch (err) {
      logError('Failed to record analytics event', err, { 
        component: 'CardsService', 
        cardId, 
        eventType 
      });
      // No throw - analytics no debería afectar la funcionalidad principal
    }
  }

  // Métodos para templates
  static async getCardTemplates(): Promise<CardTemplate[]> {
    try {
      const q = query(
        collection(db, TEMPLATES_COLLECTION),
        orderBy('category'),
        orderBy('name')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CardTemplate));
    } catch (err) {
      logError('Failed to get card templates', err, { 
        component: 'CardsService' 
      });
      throw new Error('Error al obtener los templates');
    }
  }
}