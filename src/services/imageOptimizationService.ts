import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { info, warn, error } from '@/utils/logger';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  progressive?: boolean;
  removeMetadata?: boolean;
  generateThumbnail?: boolean;
  thumbnailSize?: number;
}

export interface OptimizedImageResult {
  originalUrl: string;
  optimizedUrl: string;
  thumbnailUrl?: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  dimensions: {
    width: number;
    height: number;
  };
  format: string;
  processingTime: number;
}

export interface ImageUploadResult {
  success: boolean;
  data?: OptimizedImageResult;
  error?: string;
}

class ImageOptimizationService {
  private readonly DEFAULT_OPTIONS: Required<ImageOptimizationOptions> = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
    format: 'auto',
    progressive: true,
    removeMetadata: true,
    generateThumbnail: true,
    thumbnailSize: 300
  };

  private readonly SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  /**
   * Upload and optimize an image with various optimization options
   */
  async uploadOptimizedImage(
    file: File,
    path: string,
    options: ImageOptimizationOptions = {}
  ): Promise<ImageUploadResult> {
    const startTime = Date.now();

    try {
      // Validate file
      const validation = this.validateImageFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };

      info('Starting image optimization', {
        component: 'ImageOptimizationService',
        fileName: file.name,
        fileSize: file.size,
        options: finalOptions
      });

      // Load and process the image
      const canvas = await this.loadImageToCanvas(file);
      const originalDimensions = { width: canvas.width, height: canvas.height };

      // Optimize the image
      const optimizedCanvas = await this.optimizeImage(canvas, finalOptions);
      const optimizedBlob = await this.canvasToBlob(optimizedCanvas, finalOptions);

      // Generate thumbnail if requested
      let thumbnailBlob: Blob | null = null;
      if (finalOptions.generateThumbnail) {
        const thumbnailCanvas = await this.generateThumbnail(canvas, finalOptions.thumbnailSize);
        thumbnailBlob = await this.canvasToBlob(thumbnailCanvas, { ...finalOptions, quality: 0.7 });
      }

      // Upload optimized image
      const optimizedRef = ref(storage, `${path}/optimized/${Date.now()}_${file.name}`);
      await uploadBytes(optimizedRef, optimizedBlob);
      const optimizedUrl = await getDownloadURL(optimizedRef);

      // Upload thumbnail if generated
      let thumbnailUrl: string | undefined;
      if (thumbnailBlob) {
        const thumbnailRef = ref(storage, `${path}/thumbnails/${Date.now()}_thumb_${file.name}`);
        await uploadBytes(thumbnailRef, thumbnailBlob);
        thumbnailUrl = await getDownloadURL(thumbnailRef);
      }

      // Upload original for backup (optional)
      const originalRef = ref(storage, `${path}/originals/${Date.now()}_original_${file.name}`);
      await uploadBytes(originalRef, file);
      const originalUrl = await getDownloadURL(originalRef);

      const result: OptimizedImageResult = {
        originalUrl,
        optimizedUrl,
        thumbnailUrl,
        originalSize: file.size,
        optimizedSize: optimizedBlob.size,
        compressionRatio: Math.round((1 - optimizedBlob.size / file.size) * 100),
        dimensions: {
          width: optimizedCanvas.width,
          height: optimizedCanvas.height
        },
        format: this.determineOutputFormat(file.type, finalOptions.format),
        processingTime: Date.now() - startTime
      };

      info('Image optimization completed', {
        component: 'ImageOptimizationService',
        result: {
          originalSize: result.originalSize,
          optimizedSize: result.optimizedSize,
          compressionRatio: result.compressionRatio,
          processingTime: result.processingTime
        }
      });

      return {
        success: true,
        data: result
      };

    } catch (err) {
      error('Image optimization failed', err as Error, {
        component: 'ImageOptimizationService',
        fileName: file.name,
        fileSize: file.size
      });

      return {
        success: false,
        error: err instanceof Error ? err.message : 'Image optimization failed'
      };
    }
  }

  /**
   * Batch process multiple images
   */
  async uploadMultipleOptimizedImages(
    files: File[],
    basePath: string,
    options: ImageOptimizationOptions = {}
  ): Promise<ImageUploadResult[]> {
    const results: ImageUploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = `${basePath}/batch_${Date.now()}_${i}`;
      
      try {
        const result = await this.uploadOptimizedImage(file, filePath, options);
        results.push(result);
      } catch (err) {
        results.push({
          success: false,
          error: `Failed to process ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`
        });
      }
    }

    info('Batch image optimization completed', {
      component: 'ImageOptimizationService',
      totalFiles: files.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

    return results;
  }

  /**
   * Generate responsive image variants (different sizes)
   */
  async generateResponsiveVariants(
    file: File,
    path: string,
    variants: { name: string; maxWidth: number; maxHeight: number }[]
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};

    try {
      const canvas = await this.loadImageToCanvas(file);

      for (const variant of variants) {
        const resizedCanvas = await this.resizeCanvas(canvas, variant.maxWidth, variant.maxHeight);
        const blob = await this.canvasToBlob(resizedCanvas, {
          quality: 0.8,
          format: 'webp',
          progressive: true,
          removeMetadata: true
        });

        const variantRef = ref(storage, `${path}/variants/${variant.name}_${Date.now()}_${file.name}`);
        await uploadBytes(variantRef, blob);
        results[variant.name] = await getDownloadURL(variantRef);
      }

      info('Responsive variants generated', {
        component: 'ImageOptimizationService',
        variants: Object.keys(results)
      });

    } catch (err) {
      error('Failed to generate responsive variants', err as Error, {
        component: 'ImageOptimizationService',
        fileName: file.name
      });
    }

    return results;
  }

  /**
   * Delete optimized images and variants
   */
  async deleteOptimizedImage(optimizedResult: OptimizedImageResult): Promise<void> {
    try {
      // Extract paths from URLs and delete
      const urlsToDelete = [
        optimizedResult.originalUrl,
        optimizedResult.optimizedUrl,
        ...(optimizedResult.thumbnailUrl ? [optimizedResult.thumbnailUrl] : [])
      ];

      await Promise.all(
        urlsToDelete.map(async (url) => {
          try {
            const imageRef = ref(storage, url);
            await deleteObject(imageRef);
          } catch (err) {
            warn('Failed to delete image file', {
              component: 'ImageOptimizationService',
              url,
              error: err instanceof Error ? err.message : 'Unknown error'
            });
          }
        })
      );

      info('Optimized images deleted', {
        component: 'ImageOptimizationService',
        deletedCount: urlsToDelete.length
      });

    } catch (err) {
      error('Failed to delete optimized images', err as Error, {
        component: 'ImageOptimizationService'
      });
    }
  }

  // Private helper methods

  private validateImageFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (!this.SUPPORTED_FORMATS.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported format: ${file.type}. Supported formats: ${this.SUPPORTED_FORMATS.join(', ')}`
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File too large: ${Math.round(file.size / 1024 / 1024)}MB. Maximum: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    return { valid: true };
  }

  private loadImageToCanvas(file: File): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  private async optimizeImage(
    canvas: HTMLCanvasElement,
    options: Required<ImageOptimizationOptions>
  ): Promise<HTMLCanvasElement> {
    // Resize if needed
    const resizedCanvas = await this.resizeCanvas(canvas, options.maxWidth, options.maxHeight);
    
    // Apply additional optimizations
    if (options.removeMetadata) {
      // Metadata is automatically removed when creating new canvas
    }

    return resizedCanvas;
  }

  private async resizeCanvas(
    canvas: HTMLCanvasElement,
    maxWidth: number,
    maxHeight: number
  ): Promise<HTMLCanvasElement> {
    const { width: originalWidth, height: originalHeight } = canvas;

    // Calculate new dimensions while maintaining aspect ratio
    let newWidth = originalWidth;
    let newHeight = originalHeight;

    if (originalWidth > maxWidth || originalHeight > maxHeight) {
      const widthRatio = maxWidth / originalWidth;
      const heightRatio = maxHeight / originalHeight;
      const ratio = Math.min(widthRatio, heightRatio);

      newWidth = Math.round(originalWidth * ratio);
      newHeight = Math.round(originalHeight * ratio);
    }

    // Skip resizing if dimensions are the same
    if (newWidth === originalWidth && newHeight === originalHeight) {
      return canvas;
    }

    // Create new canvas with optimized dimensions
    const resizedCanvas = document.createElement('canvas');
    const ctx = resizedCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context for resizing');
    }

    resizedCanvas.width = newWidth;
    resizedCanvas.height = newHeight;

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw resized image
    ctx.drawImage(canvas, 0, 0, newWidth, newHeight);

    return resizedCanvas;
  }

  private async generateThumbnail(
    canvas: HTMLCanvasElement,
    thumbnailSize: number
  ): Promise<HTMLCanvasElement> {
    return this.resizeCanvas(canvas, thumbnailSize, thumbnailSize);
  }

  private canvasToBlob(
    canvas: HTMLCanvasElement,
    options: Required<ImageOptimizationOptions>
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const outputFormat = this.determineOutputFormat('auto', options.format);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        outputFormat,
        options.quality
      );
    });
  }

  private determineOutputFormat(inputType: string, formatOption: string): string {
    if (formatOption === 'auto') {
      // Use WebP if supported, otherwise use original format or JPEG
      const supportsWebP = this.checkWebPSupport();
      if (supportsWebP) {
        return 'image/webp';
      }
      return inputType === 'image/png' ? 'image/png' : 'image/jpeg';
    }

    const formatMap: Record<string, string> = {
      webp: 'image/webp',
      jpeg: 'image/jpeg',
      png: 'image/png'
    };

    return formatMap[formatOption] || 'image/jpeg';
  }

  private checkWebPSupport(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Get image metadata without loading full image
   */
  async getImageMetadata(file: File): Promise<{
    width: number;
    height: number;
    type: string;
    size: number;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          type: file.type,
          size: file.size
        });
        URL.revokeObjectURL(img.src);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for metadata'));
        URL.revokeObjectURL(img.src);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate optimal compression settings based on image characteristics
   */
  calculateOptimalSettings(metadata: {
    width: number;
    height: number;
    type: string;
    size: number;
  }): ImageOptimizationOptions {
    const pixelCount = metadata.width * metadata.height;
    
    // Adjust quality based on image size and complexity
    let quality = 0.8;
    if (pixelCount > 2000000) { // Large images (>2MP)
      quality = 0.75;
    } else if (pixelCount < 500000) { // Small images (<0.5MP)
      quality = 0.85;
    }

    // Adjust dimensions based on use case
    let maxWidth = 1920;
    let maxHeight = 1080;
    
    if (pixelCount > 8000000) { // Very large images (>8MP)
      maxWidth = 2560;
      maxHeight = 1440;
    }

    return {
      quality,
      maxWidth,
      maxHeight,
      format: 'auto',
      progressive: true,
      removeMetadata: true,
      generateThumbnail: true,
      thumbnailSize: 300
    };
  }
}

// Create singleton instance
export const imageOptimizationService = new ImageOptimizationService();

export default imageOptimizationService;