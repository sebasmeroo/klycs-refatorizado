import { useState, useCallback } from 'react';
import { 
  imageOptimizationService, 
  ImageOptimizationOptions, 
  OptimizedImageResult,
  ImageUploadResult
} from '@/services/imageOptimizationService';
import { info, error } from '@/utils/logger';

export interface UseImageOptimizationOptions {
  onUploadStart?: () => void;
  onUploadProgress?: (progress: number) => void;
  onUploadComplete?: (result: OptimizedImageResult) => void;
  onUploadError?: (error: string) => void;
  defaultPath?: string;
  defaultOptions?: ImageOptimizationOptions;
}

export interface UseImageOptimizationResult {
  uploading: boolean;
  progress: number;
  error: string | null;
  result: OptimizedImageResult | null;
  uploadImage: (file: File, path?: string, options?: ImageOptimizationOptions) => Promise<ImageUploadResult>;
  uploadMultipleImages: (files: File[], basePath?: string, options?: ImageOptimizationOptions) => Promise<ImageUploadResult[]>;
  generateResponsiveVariants: (file: File, path: string, variants: { name: string; maxWidth: number; maxHeight: number }[]) => Promise<Record<string, string>>;
  getImageMetadata: (file: File) => Promise<{ width: number; height: number; type: string; size: number }>;
  calculateOptimalSettings: (file: File) => Promise<ImageOptimizationOptions>;
  reset: () => void;
}

export function useImageOptimization(options: UseImageOptimizationOptions = {}): UseImageOptimizationResult {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizedImageResult | null>(null);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  const uploadImage = useCallback(async (
    file: File,
    path?: string,
    optimizationOptions?: ImageOptimizationOptions
  ): Promise<ImageUploadResult> => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);
      setResult(null);

      options.onUploadStart?.();

      const uploadPath = path || options.defaultPath || 'images';
      const finalOptions = { ...options.defaultOptions, ...optimizationOptions };

      // Simulate progress updates (since we don't have real progress from the service)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const uploadResult = await imageOptimizationService.uploadOptimizedImage(
        file,
        uploadPath,
        finalOptions
      );

      clearInterval(progressInterval);
      setProgress(100);

      if (uploadResult.success && uploadResult.data) {
        setResult(uploadResult.data);
        options.onUploadComplete?.(uploadResult.data);
        
        info('Image uploaded and optimized successfully', {
          component: 'useImageOptimization',
          fileName: file.name,
          compressionRatio: uploadResult.data.compressionRatio
        });
      } else {
        const errorMessage = uploadResult.error || 'Upload failed';
        setError(errorMessage);
        options.onUploadError?.(errorMessage);
      }

      return uploadResult;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      options.onUploadError?.(errorMessage);
      
      error('Image upload failed', err as Error, {
        component: 'useImageOptimization',
        fileName: file.name
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setUploading(false);
    }
  }, [options]);

  const uploadMultipleImages = useCallback(async (
    files: File[],
    basePath?: string,
    optimizationOptions?: ImageOptimizationOptions
  ): Promise<ImageUploadResult[]> => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);
      setResult(null);

      options.onUploadStart?.();

      const uploadPath = basePath || options.defaultPath || 'images';
      const finalOptions = { ...options.defaultOptions, ...optimizationOptions };

      // Track progress across multiple files
      let completedFiles = 0;
      const updateProgress = () => {
        completedFiles++;
        const progressPercent = (completedFiles / files.length) * 100;
        setProgress(progressPercent);
        options.onUploadProgress?.(progressPercent);
      };

      const results = await imageOptimizationService.uploadMultipleOptimizedImages(
        files,
        uploadPath,
        finalOptions
      );

      // Update progress as files complete
      results.forEach(() => updateProgress());

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      if (failureCount > 0) {
        const errorMessage = `${failureCount} of ${files.length} files failed to upload`;
        setError(errorMessage);
        options.onUploadError?.(errorMessage);
      }

      info('Multiple images upload completed', {
        component: 'useImageOptimization',
        totalFiles: files.length,
        successful: successCount,
        failed: failureCount
      });

      return results;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch upload failed';
      setError(errorMessage);
      options.onUploadError?.(errorMessage);
      
      error('Multiple images upload failed', err as Error, {
        component: 'useImageOptimization',
        fileCount: files.length
      });

      return files.map(() => ({
        success: false,
        error: errorMessage
      }));
    } finally {
      setUploading(false);
    }
  }, [options]);

  const generateResponsiveVariants = useCallback(async (
    file: File,
    path: string,
    variants: { name: string; maxWidth: number; maxHeight: number }[]
  ): Promise<Record<string, string>> => {
    try {
      setUploading(true);
      setError(null);

      const results = await imageOptimizationService.generateResponsiveVariants(
        file,
        path,
        variants
      );

      info('Responsive variants generated', {
        component: 'useImageOptimization',
        fileName: file.name,
        variantCount: Object.keys(results).length
      });

      return results;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate variants';
      setError(errorMessage);
      
      error('Failed to generate responsive variants', err as Error, {
        component: 'useImageOptimization',
        fileName: file.name
      });

      return {};
    } finally {
      setUploading(false);
    }
  }, []);

  const getImageMetadata = useCallback(async (file: File) => {
    return await imageOptimizationService.getImageMetadata(file);
  }, []);

  const calculateOptimalSettings = useCallback(async (file: File): Promise<ImageOptimizationOptions> => {
    try {
      const metadata = await imageOptimizationService.getImageMetadata(file);
      return imageOptimizationService.calculateOptimalSettings(metadata);
    } catch (err) {
      error('Failed to calculate optimal settings', err as Error, {
        component: 'useImageOptimization',
        fileName: file.name
      });
      
      // Return default settings on error
      return {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        format: 'auto',
        progressive: true,
        removeMetadata: true,
        generateThumbnail: true,
        thumbnailSize: 300
      };
    }
  }, []);

  return {
    uploading,
    progress,
    error,
    result,
    uploadImage,
    uploadMultipleImages,
    generateResponsiveVariants,
    getImageMetadata,
    calculateOptimalSettings,
    reset
  };
}

// Hook for drag and drop image optimization
export interface UseDragDropImageOptimizationOptions extends UseImageOptimizationOptions {
  accept?: string[];
  maxFiles?: number;
  maxFileSize?: number;
}

export function useDragDropImageOptimization(options: UseDragDropImageOptimizationOptions = {}) {
  const imageOptimization = useImageOptimization(options);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    setDragError(null);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragError(null);

    const files = Array.from(e.dataTransfer.files);
    
    // Validate files
    const acceptedFormats = options.accept || ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxFiles = options.maxFiles || 10;
    const maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB

    if (files.length > maxFiles) {
      setDragError(`Too many files. Maximum ${maxFiles} files allowed.`);
      return;
    }

    const invalidFiles = files.filter(file => 
      !acceptedFormats.includes(file.type) || file.size > maxFileSize
    );

    if (invalidFiles.length > 0) {
      setDragError(`Some files are invalid. Please check file types and sizes.`);
      return;
    }

    // Upload files
    if (files.length === 1) {
      await imageOptimization.uploadImage(files[0]);
    } else {
      await imageOptimization.uploadMultipleImages(files);
    }
  }, [options, imageOptimization]);

  const getDragProps = useCallback(() => ({
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop
  }), [handleDragOver, handleDragLeave, handleDrop]);

  return {
    ...imageOptimization,
    isDragOver,
    dragError,
    getDragProps
  };
}

// Hook for progressive image loading with optimization
export function useProgressiveImageLoad(src: string, placeholder?: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');

  const loadImage = useCallback(() => {
    if (!src) return;

    const img = new Image();
    
    img.onload = () => {
      setCurrentSrc(src);
      setLoading(false);
      setError(false);
    };

    img.onerror = () => {
      setError(true);
      setLoading(false);
    };

    img.src = src;
  }, [src]);

  React.useEffect(() => {
    loadImage();
  }, [loadImage]);

  return {
    src: currentSrc,
    loading,
    error,
    retry: loadImage
  };
}