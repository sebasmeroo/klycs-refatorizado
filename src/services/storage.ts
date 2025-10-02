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
  private static async ensureAuthenticated(): Promise<void> {
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
      await this.ensureAuthenticated();

      const validation = ImageCompressionService.validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      onProgress?.(10);

      const compressed = await ImageCompressionService.compressMultipleSizes(file);
      onProgress?.(40);

      const imageId = this.generateImageId();
      const baseFileName = ImageCompressionService.generateFileName(file.name);

      devLog('Starting image upload', {
        component: 'StorageService',
        cardId,
        imageId,
        baseFileName
      });

      const uploadPromises = [
        this.uploadSingleFile(
          compressed.thumbnail.file,
          `cards/${cardId}/portfolio/${imageId}/thumbnail_${baseFileName}`
        ),
        this.uploadSingleFile(
          compressed.medium.file,
          `cards/${cardId}/portfolio/${imageId}/medium_${baseFileName}`
        ),
        this.uploadSingleFile(
          compressed.large.file,
          `cards/${cardId}/portfolio/${imageId}/large_${baseFileName}`
        ),
        this.uploadSingleFile(
          compressed.original.file,
          `cards/${cardId}/portfolio/${imageId}/original_${baseFileName}`
        )
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
      throw err;
    }
  }

  /**
   * Sube un video a Firebase Storage
   */
  static async uploadPortfolioVideo(
    cardId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      await this.ensureAuthenticated();

      if (!file.type.startsWith('video/')) {
        throw new Error('El archivo debe ser un video');
      }

      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('El video no debe exceder 50MB');
      }

      onProgress?.(10);

      const videoId = this.generateImageId();
      const fileExtension = file.name.split('.').pop() || 'mp4';
      const fileName = `video_${videoId}.${fileExtension}`;
      const path = `cards/${cardId}/portfolio/${videoId}/${fileName}`;

      devLog('Starting video upload', {
        component: 'StorageService',
        cardId,
        videoId,
        fileName,
        sizeMB: (file.size / 1024 / 1024).toFixed(2)
      });

      onProgress?.(30);

      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);

      onProgress?.(90);

      const downloadURL = await getDownloadURL(snapshot.ref);

      onProgress?.(100);

      info('Portfolio video uploaded successfully', { component: 'StorageService', cardId, videoId });

      return downloadURL;
    } catch (err) {
      error('Failed to upload portfolio video', err as Error, { component: 'StorageService', cardId });
      throw err;
    }
  }

  /**
   * Elimina una imagen del portfolio
   */
  static async deletePortfolioAsset(cardId: string, imageId: string): Promise<void> {
    try {
      await this.ensureAuthenticated();

      const basePath = `cards/${cardId}/portfolio/${imageId}`;
      const listRef = ref(storage, basePath);
      const list = await listAll(listRef);

      const deletePromises = list.items.map(item => deleteObject(item));
      await Promise.all(deletePromises);

      info('Portfolio asset deleted', { component: 'StorageService', cardId, imageId });
    } catch (err) {
      error('Failed to delete portfolio image', err as Error, { component: 'StorageService', cardId, imageId });
      throw err;
    }
  }

  private static async uploadSingleFile(file: File, path: string): Promise<string> {
    console.group('📤 SUBIENDO ARCHIVO');
    console.log('Path:', path);
    console.log('Tamaño:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('Tipo:', file.type);
    console.log('Nombre:', file.name);
    
    // Verificar autenticación
    const user = auth.currentUser;
    console.log('Usuario autenticado:', user ? user.uid : 'NO AUTENTICADO ❌');
    
    try {
      const storageRef = ref(storage, path);
      console.log('Storage Ref creado:', storageRef.fullPath);
      
      console.log('Iniciando uploadBytes...');
      const snapshot = await uploadBytes(storageRef, file);
      console.log('✅ Upload exitoso!');
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('✅ URL obtenida:', downloadURL);
      console.groupEnd();
      
      return downloadURL;
    } catch (err: any) {
      console.error('❌ ERROR EN UPLOAD:');
      console.error('Código:', err.code);
      console.error('Mensaje:', err.message);
      console.error('Server Response:', err.serverResponse);
      console.error('Error completo:', err);
      console.groupEnd();
      throw err;
    }
  }

  private static generateImageId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

export default StorageService;
