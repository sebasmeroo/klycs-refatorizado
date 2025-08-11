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
    const [thumbnail, medium, large, original] = await Promise.all([
      this.compressImage(file, this.PROFILES.thumbnail),
      this.compressImage(file, this.PROFILES.medium),
      this.compressImage(file, this.PROFILES.large),
      this.compressImage(file, this.PROFILES.original)
    ]);

    return { thumbnail, medium, large, original };
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
   * Genera un nombre único para el archivo
   */
  static generateFileName(originalName: string, suffix: string = ''): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop()?.toLowerCase() || 'webp';
    const baseName = originalName.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    return `${baseName}_${timestamp}_${random}${suffix}.${extension}`;
  }
}