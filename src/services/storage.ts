import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage, auth } from '@/lib/firebase';
import { ImageCompressionService } from './imageCompression';
import { info, error, devLog } from '@/utils/logger';

export interface UploadedImage {
  id: string;
  fileName: string;
  urls: {
    thumbnail: string;
    medium: string;
    large: string;
    original: string;
  };
  metadata: {
    width: number;
    height: number;
    size: number;
    uploadedAt: string;
  };
}

export class StorageService {
  /**
   * Verifica el estado de autenticación y permisos
   */
  private static async debugAuthState(): Promise<void> {
    const user = auth.currentUser;
    devLog('Debug Auth State', {
      component: 'StorageService',
      userAuthenticated: !!user,
      userId: user?.uid,
      userEmail: user?.email,
      storageBucket: storage.app.options.storageBucket
    });
    
    if (!user) {
      throw new Error('Usuario no autenticado. Por favor, inicia sesión.');
    }
  }

  /**
   * Sube una imagen comprimida en múltiples tamaños a Firebase Storage
   */
  static async uploadPortfolioImage(
    cardId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadedImage> {
    try {
      // Debug: Verificar autenticación
      await this.debugAuthState();
      
      // Validar archivo
      const validation = ImageCompressionService.validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      onProgress?.(10);

      // Comprimir en múltiples tamaños
      const compressed = await ImageCompressionService.compressMultipleSizes(file);
      onProgress?.(40);

      // Generar ID único para la imagen
      const imageId = this.generateImageId();
      const baseFileName = ImageCompressionService.generateFileName(file.name);

      devLog('Starting image upload', {
        component: 'StorageService',
        cardId,
        imageId,
        baseFileName
      });

      // Subir cada tamaño a Firebase Storage
      const uploadPromises = [
        this.uploadSingleFile(compressed.thumbnail.file, `cards/${cardId}/portfolio/${imageId}/thumbnail_${baseFileName}`),
        this.uploadSingleFile(compressed.medium.file, `cards/${cardId}/portfolio/${imageId}/medium_${baseFileName}`),
        this.uploadSingleFile(compressed.large.file, `cards/${cardId}/portfolio/${imageId}/large_${baseFileName}`),
        this.uploadSingleFile(compressed.original.file, `cards/${cardId}/portfolio/${imageId}/original_${baseFileName}`)
      ];

      onProgress?.(70);

      const [thumbnailUrl, mediumUrl, largeUrl, originalUrl] = await Promise.all(uploadPromises);
      onProgress?.(100);

      info('Portfolio image uploaded successfully', { component: 'StorageService', cardId, imageId });

      return {
        id: imageId,
        fileName: file.name,
        urls: {
          thumbnail: thumbnailUrl,
          medium: mediumUrl,
          large: largeUrl,
          original: originalUrl
        },
        metadata: {
          width: compressed.original.width,
          height: compressed.original.height,
          size: compressed.original.size,
          uploadedAt: new Date().toISOString()
        }
      };
    } catch (err) {
      error('Failed to upload portfolio image', err as Error, { component: 'StorageService', cardId });
      throw error;
    }
  }

  /**
   * Sube un archivo individual a Firebase Storage
   */
  private static async uploadSingleFile(file: File, path: string): Promise<string> {
    devLog('Uploading file', {
      component: 'StorageService',
      path,
      fileSizeMB: (file.size / 1024 / 1024).toFixed(2)
    });
    
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    devLog('File uploaded successfully', { component: 'StorageService', path });
    return downloadURL;
  }

  /**
   * Elimina una imagen del portfolio
   */
  static async deletePortfolioImage(cardId: string, imageId: string): Promise<void> {
    try {
      const basePath = `cards/${cardId}/portfolio/${imageId}`;
      
      // Listar todos los archivos de la imagen
      const listRef = ref(storage, basePath);
      const list = await listAll(listRef);
      
      // Eliminar todos los tamaños
      const deletePromises = list.items.map(item => deleteObject(item));
      await Promise.all(deletePromises);
    } catch (err) {
      error('Failed to delete portfolio image', err as Error, { component: 'StorageService', cardId, imageId });
      throw error;
    }
  }

  /**
   * Sube imagen de avatar
   */
  static async uploadAvatar(cardId: string, file: File): Promise<string> {
    try {
      // Debug: Verificar autenticación
      await this.debugAuthState();
      
      const validation = ImageCompressionService.validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Comprimir avatar (tamaño medio es suficiente)
      const compressed = await ImageCompressionService.compressImage(
        file, 
        ImageCompressionService.PROFILES.medium
      );

      const fileName = ImageCompressionService.generateFileName(file.name, '_avatar');
      const path = `cards/${cardId}/avatar/${fileName}`;
      
      devLog('Uploading avatar image', { component: 'StorageService', cardId, path });
      
      return await this.uploadSingleFile(compressed.file, path);
    } catch (err) {
      error('Failed to upload avatar image', err as Error, { component: 'StorageService', cardId });
      throw error;
    }
  }

  /**
   * Sube imagen de cover
   */
  static async uploadCoverImage(cardId: string, file: File): Promise<string> {
    try {
      // Debug: Verificar autenticación
      await this.debugAuthState();
      
      const validation = ImageCompressionService.validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Para cover usar tamaño grande
      const compressed = await ImageCompressionService.compressImage(
        file, 
        ImageCompressionService.PROFILES.large
      );

      const fileName = ImageCompressionService.generateFileName(file.name, '_cover');
      const path = `cards/${cardId}/cover/${fileName}`;
      
      devLog('Uploading cover image', { component: 'StorageService', cardId, path });
      
      return await this.uploadSingleFile(compressed.file, path);
    } catch (err) {
      error('Failed to upload cover image', err as Error, { component: 'StorageService', cardId });
      throw error;
    }
  }

  /**
   * Genera un ID único para las imágenes
   */
  private static generateImageId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Calcula el tamaño total usado por una tarjeta
   */
  static async calculateStorageUsage(_cardId: string): Promise<number> {
    try {
      // Firebase Storage no provee tamaños directamente via listAll
      // Necesitaríamos hacer getMetadata() para cada archivo
      // Por ahora retornamos 0, se puede implementar si es necesario
      return 0;
    } catch (err) {
      error('Failed to calculate storage usage', err as Error, { component: 'StorageService', cardId: _cardId });
      return 0;
    }
  }
}