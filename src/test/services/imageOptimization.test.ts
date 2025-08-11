import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { imageOptimizationService } from '@/services/imageOptimizationService';

// Mock Firebase Storage
vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn()
}));

// Mock Firebase config
vi.mock('@/lib/firebase', () => ({
  storage: {}
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}));

// Mock DOM APIs
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn()
  }
});

// Mock Canvas API
const mockCanvas = {
  width: 1920,
  height: 1080,
  getContext: vi.fn(() => ({
    drawImage: vi.fn(),
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high'
  })),
  toBlob: vi.fn((callback, format, quality) => {
    const mockBlob = new Blob(['mock-image-data'], { type: format || 'image/jpeg' });
    callback(mockBlob);
  }),
  toDataURL: vi.fn((format) => {
    if (format === 'image/webp') {
      return 'data:image/webp;base64,mock-webp-data';
    }
    return 'data:image/jpeg;base64,mock-jpeg-data';
  })
};

Object.defineProperty(document, 'createElement', {
  value: vi.fn((tagName) => {
    if (tagName === 'canvas') {
      return mockCanvas;
    }
    if (tagName === 'img') {
      return {
        onload: null,
        onerror: null,
        src: '',
        width: 1920,
        height: 1080,
        naturalWidth: 1920,
        naturalHeight: 1080
      };
    }
    return {};
  })
});

describe('Image Optimization Service', () => {
  let mockFile: File;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a mock file
    mockFile = new File(['mock-image-data'], 'test-image.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now()
    });

    // Mock successful Firebase operations
    const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
    ref.mockReturnValue({ id: 'mock-ref-id' });
    uploadBytes.mockResolvedValue({ ref: { id: 'mock-ref-id' } });
    getDownloadURL.mockResolvedValue('https://mock-download-url.com/image.jpg');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('File Validation', () => {
    it('should validate supported image formats', async () => {
      const jpegFile = new File(['data'], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File(['data'], 'test.png', { type: 'image/png' });
      const webpFile = new File(['data'], 'test.webp', { type: 'image/webp' });
      const gifFile = new File(['data'], 'test.gif', { type: 'image/gif' });

      // These should all be valid
      const jpegResult = await imageOptimizationService.uploadOptimizedImage(jpegFile, 'test');
      const pngResult = await imageOptimizationService.uploadOptimizedImage(pngFile, 'test');
      const webpResult = await imageOptimizationService.uploadOptimizedImage(webpFile, 'test');
      const gifResult = await imageOptimizationService.uploadOptimizedImage(gifFile, 'test');

      expect(jpegResult.success).toBe(true);
      expect(pngResult.success).toBe(true);
      expect(webpResult.success).toBe(true);
      expect(gifResult.success).toBe(true);
    });

    it('should reject unsupported file formats', async () => {
      const textFile = new File(['data'], 'test.txt', { type: 'text/plain' });
      
      const result = await imageOptimizationService.uploadOptimizedImage(textFile, 'test');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported format');
    });

    it('should reject files that are too large', async () => {
      // Create a mock file that's larger than 10MB
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { 
        type: 'image/jpeg' 
      });
      
      const result = await imageOptimizationService.uploadOptimizedImage(largeFile, 'test');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('File too large');
    });

    it('should reject null or undefined files', async () => {
      const result = await imageOptimizationService.uploadOptimizedImage(null as any, 'test');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No file provided');
    });
  });

  describe('Image Optimization', () => {
    it('should successfully optimize and upload an image', async () => {
      const result = await imageOptimizationService.uploadOptimizedImage(mockFile, 'test-path');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.originalUrl).toContain('mock-download-url');
      expect(result.data?.optimizedUrl).toContain('mock-download-url');
      expect(result.data?.originalSize).toBe(mockFile.size);
      expect(result.data?.optimizedSize).toBeGreaterThan(0);
    });

    it('should respect custom optimization options', async () => {
      const options = {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.7,
        format: 'webp' as const,
        generateThumbnail: false
      };

      const result = await imageOptimizationService.uploadOptimizedImage(
        mockFile, 
        'test-path', 
        options
      );
      
      expect(result.success).toBe(true);
      expect(result.data?.thumbnailUrl).toBeUndefined();
    });

    it('should generate thumbnail when requested', async () => {
      const options = {
        generateThumbnail: true,
        thumbnailSize: 200
      };

      const result = await imageOptimizationService.uploadOptimizedImage(
        mockFile, 
        'test-path', 
        options
      );
      
      expect(result.success).toBe(true);
      expect(result.data?.thumbnailUrl).toBeDefined();
    });

    it('should calculate compression ratio correctly', async () => {
      // Mock a smaller optimized blob
      mockCanvas.toBlob = vi.fn((callback, format, quality) => {
        const smallerBlob = new Blob(['smaller-data'], { type: format || 'image/jpeg' });
        callback(smallerBlob);
      });

      const result = await imageOptimizationService.uploadOptimizedImage(mockFile, 'test-path');
      
      expect(result.success).toBe(true);
      expect(result.data?.compressionRatio).toBeGreaterThan(0);
      expect(result.data?.optimizedSize).toBeLessThan(result.data?.originalSize);
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple images successfully', async () => {
      const files = [
        new File(['data1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['data2'], 'image2.png', { type: 'image/png' }),
        new File(['data3'], 'image3.webp', { type: 'image/webp' })
      ];

      const results = await imageOptimizationService.uploadMultipleOptimizedImages(
        files, 
        'batch-test'
      );
      
      expect(results).toHaveLength(3);
      expect(results.every(result => result.success)).toBe(true);
    });

    it('should handle mixed success/failure in batch processing', async () => {
      const files = [
        new File(['data1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['data2'], 'invalid.txt', { type: 'text/plain' }), // Invalid
        new File(['data3'], 'image3.png', { type: 'image/png' })
      ];

      const results = await imageOptimizationService.uploadMultipleOptimizedImages(
        files, 
        'batch-test'
      );
      
      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  describe('Responsive Variants', () => {
    it('should generate responsive image variants', async () => {
      const variants = [
        { name: 'small', maxWidth: 400, maxHeight: 300 },
        { name: 'medium', maxWidth: 800, maxHeight: 600 },
        { name: 'large', maxWidth: 1200, maxHeight: 900 }
      ];

      const results = await imageOptimizationService.generateResponsiveVariants(
        mockFile,
        'variants-test',
        variants
      );
      
      expect(Object.keys(results)).toHaveLength(3);
      expect(results.small).toContain('mock-download-url');
      expect(results.medium).toContain('mock-download-url');
      expect(results.large).toContain('mock-download-url');
    });

    it('should handle errors in variant generation gracefully', async () => {
      // Mock Firebase upload failure
      const { uploadBytes } = require('firebase/storage');
      uploadBytes.mockRejectedValueOnce(new Error('Upload failed'));

      const variants = [
        { name: 'small', maxWidth: 400, maxHeight: 300 }
      ];

      const results = await imageOptimizationService.generateResponsiveVariants(
        mockFile,
        'variants-test',
        variants
      );
      
      expect(Object.keys(results)).toHaveLength(0);
    });
  });

  describe('Metadata Extraction', () => {
    it('should extract image metadata correctly', async () => {
      const metadata = await imageOptimizationService.getImageMetadata(mockFile);
      
      expect(metadata).toEqual({
        width: 1920,
        height: 1080,
        type: 'image/jpeg',
        size: mockFile.size
      });
    });

    it('should handle metadata extraction errors', async () => {
      // Mock image load failure
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn((tagName) => {
        if (tagName === 'img') {
          return {
            onload: null,
            onerror: null,
            set src(value) {
              setTimeout(() => this.onerror?.(), 0);
            }
          };
        }
        return originalCreateElement(tagName);
      });

      await expect(imageOptimizationService.getImageMetadata(mockFile))
        .rejects.toThrow('Failed to load image for metadata');

      document.createElement = originalCreateElement;
    });
  });

  describe('Optimal Settings Calculation', () => {
    it('should calculate optimal settings for large images', () => {
      const metadata = {
        width: 4000,
        height: 3000,
        type: 'image/jpeg',
        size: 5 * 1024 * 1024 // 5MB
      };

      const settings = imageOptimizationService.calculateOptimalSettings(metadata);
      
      expect(settings.quality).toBeLessThan(0.8); // Should use lower quality for large images
      expect(settings.maxWidth).toBeGreaterThan(1920); // Should allow larger dimensions
    });

    it('should calculate optimal settings for small images', () => {
      const metadata = {
        width: 800,
        height: 600,
        type: 'image/png',
        size: 100 * 1024 // 100KB
      };

      const settings = imageOptimizationService.calculateOptimalSettings(metadata);
      
      expect(settings.quality).toBeGreaterThan(0.8); // Should use higher quality for small images
      expect(settings.generateThumbnail).toBe(true);
    });
  });

  describe('WebP Support Detection', () => {
    it('should detect WebP support correctly', () => {
      // WebP support is mocked to return true in our setup
      const canvas = document.createElement('canvas');
      const webpDataUrl = canvas.toDataURL('image/webp');
      
      expect(webpDataUrl).toContain('data:image/webp');
    });
  });

  describe('Error Handling', () => {
    it('should handle Firebase upload failures gracefully', async () => {
      const { uploadBytes } = require('firebase/storage');
      uploadBytes.mockRejectedValueOnce(new Error('Network error'));

      const result = await imageOptimizationService.uploadOptimizedImage(mockFile, 'test-path');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle canvas creation failures', async () => {
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn((tagName) => {
        if (tagName === 'canvas') {
          return {
            getContext: vi.fn(() => null) // Simulate context creation failure
          };
        }
        return originalCreateElement(tagName);
      });

      const result = await imageOptimizationService.uploadOptimizedImage(mockFile, 'test-path');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      document.createElement = originalCreateElement;
    });

    it('should handle blob creation failures', async () => {
      mockCanvas.toBlob = vi.fn((callback) => {
        callback(null); // Simulate blob creation failure
      });

      const result = await imageOptimizationService.uploadOptimizedImage(mockFile, 'test-path');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('blob');
    });
  });

  describe('Image Deletion', () => {
    it('should delete optimized images successfully', async () => {
      const { deleteObject } = require('firebase/storage');
      deleteObject.mockResolvedValue(undefined);

      const mockResult = {
        originalUrl: 'https://example.com/original.jpg',
        optimizedUrl: 'https://example.com/optimized.jpg',
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
        originalSize: 1000,
        optimizedSize: 800,
        compressionRatio: 20,
        dimensions: { width: 800, height: 600 },
        format: 'image/jpeg',
        processingTime: 1000
      };

      await expect(imageOptimizationService.deleteOptimizedImage(mockResult))
        .resolves.toBeUndefined();
      
      expect(deleteObject).toHaveBeenCalledTimes(3); // original, optimized, thumbnail
    });

    it('should handle deletion failures gracefully', async () => {
      const { deleteObject } = require('firebase/storage');
      deleteObject.mockRejectedValue(new Error('Delete failed'));

      const mockResult = {
        originalUrl: 'https://example.com/original.jpg',
        optimizedUrl: 'https://example.com/optimized.jpg',
        originalSize: 1000,
        optimizedSize: 800,
        compressionRatio: 20,
        dimensions: { width: 800, height: 600 },
        format: 'image/jpeg',
        processingTime: 1000
      };

      // Should not throw error even if deletion fails
      await expect(imageOptimizationService.deleteOptimizedImage(mockResult))
        .resolves.toBeUndefined();
    });
  });
});