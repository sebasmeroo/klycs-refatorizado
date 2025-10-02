import { v4 as uuidv4 } from 'uuid';

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

interface CompressedImage {
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  size: number;
}

export class ImageCompressionService {
  // Configuraciones predefinidas tipo Instagram
  static readonly PROFILES = {
    thumbnail: { maxWidth: 150, maxHeight: 150, quality: 0.8, format: 'webp' as const },
    medium: { maxWidth: 640, maxHeight: 640, quality: 0.85, format: 'webp' as const },
    large: { maxWidth: 1080, maxHeight: 1080, quality: 0.9, format: 'webp' as const },
    original: { maxWidth: 1920, maxHeight: 1920, quality: 0.95, format: 'webp' as const }
  };

  /**
   * Comprime una imagen usando Canvas API
   */
  static async compressImage(
    file: File, 
    options: CompressionOptions = this.PROFILES.medium
  ): Promise<CompressedImage> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        // Calcular dimensiones manteniendo aspect ratio
        const { width, height } = this.calculateDimensions(
          img.width, 
          img.height, 
          options.maxWidth || 1080, 
          options.maxHeight || 1080
        );

        canvas.width = width;
        canvas.height = height;

        // Configurar compresión óptima
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a blob con calidad especificada
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: `image/${options.format || 'webp'}`,
              lastModified: Date.now()
            });

            const dataUrl = canvas.toDataURL(`image/${options.format || 'webp'}`, options.quality || 0.85);

            resolve({
              file: compressedFile,
              dataUrl,
              width,
              height,
              size: blob.size
            });
          },
          `image/${options.format || 'webp'}`,
          options.quality || 0.85
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Comprime una imagen en múltiples tamaños (como Instagram)
   */
  static async compressMultipleSizes(file: File): Promise<{
    thumbnail: CompressedImage;
    medium: CompressedImage;
    large: CompressedImage;
    original: CompressedImage;
  }> {
    const startTime = performance.now();
    const originalSize = file.size;

    console.group('📸 Compresión de Imagen - Estilo Instagram');
    console.log('📦 Archivo original:', {
      nombre: file.name,
      tamaño: this.formatFileSize(originalSize),
      tipo: file.type
    });

    const [thumbnail, medium, large, original] = await Promise.all([
      this.compressImage(file, this.PROFILES.thumbnail),
      this.compressImage(file, this.PROFILES.medium),
      this.compressImage(file, this.PROFILES.large),
      this.compressImage(file, this.PROFILES.original)
    ]);

    const endTime = performance.now();
    const compressionTime = ((endTime - startTime) / 1000).toFixed(2);
    
    const totalCompressedSize = thumbnail.size + medium.size + large.size + original.size;
    const compressionRatio = ((1 - totalCompressedSize / (originalSize * 4)) * 100).toFixed(1);

    console.log('✅ Compresión completada:');
    console.table({
      'Thumbnail (150px)': {
        'Tamaño': this.formatFileSize(thumbnail.size),
        'Dimensiones': `${thumbnail.width}x${thumbnail.height}`,
        'Compresión': `${((1 - thumbnail.size / originalSize) * 100).toFixed(1)}%`
      },
      'Medium (640px)': {
        'Tamaño': this.formatFileSize(medium.size),
        'Dimensiones': `${medium.width}x${medium.height}`,
        'Compresión': `${((1 - medium.size / originalSize) * 100).toFixed(1)}%`
      },
      'Large (1080px)': {
        'Tamaño': this.formatFileSize(large.size),
        'Dimensiones': `${large.width}x${large.height}`,
        'Compresión': `${((1 - large.size / originalSize) * 100).toFixed(1)}%`
      },
      'Original (1920px)': {
        'Tamaño': this.formatFileSize(original.size),
        'Dimensiones': `${original.width}x${original.height}`,
        'Compresión': `${((1 - original.size / originalSize) * 100).toFixed(1)}%`
      }
    });

    console.log(`⚡ Tiempo de compresión: ${compressionTime}s`);
    console.log(`💾 Ahorro promedio: ${compressionRatio}% por versión`);
    console.groupEnd();

    return { thumbnail, medium, large, original };
  }

  /**
   * Formatea el tamaño de archivo para mostrar
   */
  private static formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  /**
   * Calcula dimensiones manteniendo aspect ratio
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // Si la imagen es más grande que los límites, redimensionar
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  /**
   * Valida si el archivo es una imagen válida
   */
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Formato no válido. Solo se permiten: JPG, PNG, WebP'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'El archivo es demasiado grande. Máximo 10MB'
      };
    }

    return { valid: true };
  }

  /**
   * Calcula el hash SHA-256 de un archivo para detectar duplicados
   */
  static async getFileHash(file: File): Promise<string> {
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Error calculating file hash:', error);
      throw new Error('No se pudo calcular el hash del archivo');
    }
  }

  /**
   * Genera un nombre único y seguro para el archivo usando UUID v4
   */
  static generateFileName(originalName: string, suffix: string = ''): string {
    // Usar UUID v4 para garantizar unicidad global
    const uniqueId = uuidv4();

    // Sanitizar el nombre original: solo letras, números y guiones, máximo 50 caracteres
    const extension = originalName.split('.').pop()?.toLowerCase() || 'webp';
    const baseName = originalName
      .split('.')[0]
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')  // Solo alfanuméricos y guiones
      .substring(0, 50)  // Limitar longitud
      .replace(/^-+|-+$/g, '');  // Eliminar guiones al inicio/final

    // Formato seguro: nombre_uuid_suffix.ext
    const finalName = baseName
      ? `${baseName}_${uniqueId}${suffix}.${extension}`
      : `${uniqueId}${suffix}.${extension}`;

    return finalName;
  }
}