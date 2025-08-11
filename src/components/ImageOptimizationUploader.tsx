import React, { useState, useCallback } from 'react';
import { useDragDropImageOptimization, useImageOptimization } from '@/hooks/useImageOptimization';
import { ImageOptimizationOptions } from '@/services/imageOptimizationService';

interface ImageOptimizationUploaderProps {
  onUploadComplete?: (result: any) => void;
  path?: string;
  options?: ImageOptimizationOptions;
  className?: string;
  showPreview?: boolean;
  showOptimizationSettings?: boolean;
}

export const ImageOptimizationUploader: React.FC<ImageOptimizationUploaderProps> = ({
  onUploadComplete,
  path = 'uploads',
  options: defaultOptions,
  className = '',
  showPreview = true,
  showOptimizationSettings = false
}) => {
  const [optimizationOptions, setOptimizationOptions] = useState<ImageOptimizationOptions>(
    defaultOptions || {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.8,
      format: 'auto',
      progressive: true,
      removeMetadata: true,
      generateThumbnail: true,
      thumbnailSize: 300
    }
  );

  const {
    uploading,
    progress,
    error,
    result,
    isDragOver,
    dragError,
    uploadImage,
    uploadMultipleImages,
    getImageMetadata,
    calculateOptimalSettings,
    getDragProps,
    reset
  } = useDragDropImageOptimization({
    defaultPath: path,
    defaultOptions: optimizationOptions,
    onUploadComplete: (result) => {
      onUploadComplete?.(result);
    },
    maxFiles: 10,
    maxFileSize: 10 * 1024 * 1024 // 10MB
  });

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    if (fileArray.length === 1) {
      // For single files, calculate optimal settings first
      try {
        const optimalSettings = await calculateOptimalSettings(fileArray[0]);
        const finalOptions = { ...optimizationOptions, ...optimalSettings };
        await uploadImage(fileArray[0], path, finalOptions);
      } catch (err) {
        await uploadImage(fileArray[0], path, optimizationOptions);
      }
    } else {
      await uploadMultipleImages(fileArray, path, optimizationOptions);
    }

    // Reset file input
    e.target.value = '';
  }, [uploadImage, uploadMultipleImages, calculateOptimalSettings, optimizationOptions, path]);

  const handleOptimizationChange = useCallback((key: keyof ImageOptimizationOptions, value: any) => {
    setOptimizationOptions(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`image-optimization-uploader ${className}`}>
      {/* Optimization Settings */}
      {showOptimizationSettings && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Optimization Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Width (px)
              </label>
              <input
                type="number"
                value={optimizationOptions.maxWidth || 1920}
                onChange={(e) => handleOptimizationChange('maxWidth', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Height (px)
              </label>
              <input
                type="number"
                value={optimizationOptions.maxHeight || 1080}
                onChange={(e) => handleOptimizationChange('maxHeight', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quality (0.1 - 1.0)
              </label>
              <input
                type="number"
                min="0.1"
                max="1.0"
                step="0.1"
                value={optimizationOptions.quality || 0.8}
                onChange={(e) => handleOptimizationChange('quality', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Output Format
              </label>
              <select
                value={optimizationOptions.format || 'auto'}
                onChange={(e) => handleOptimizationChange('format', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">Auto (WebP when supported)</option>
                <option value="webp">WebP</option>
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="progressive"
                checked={optimizationOptions.progressive || false}
                onChange={(e) => handleOptimizationChange('progressive', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="progressive" className="text-sm font-medium text-gray-700">
                Progressive JPEG
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="generateThumbnail"
                checked={optimizationOptions.generateThumbnail || false}
                onChange={(e) => handleOptimizationChange('generateThumbnail', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="generateThumbnail" className="text-sm font-medium text-gray-700">
                Generate Thumbnail
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        {...getDragProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        
        <div className="space-y-4">
          <div className="text-6xl">📸</div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isDragOver ? 'Drop images here!' : 'Upload Images'}
            </h3>
            <p className="text-gray-600 mt-2">
              Drag and drop images here, or click to select files
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Supports JPEG, PNG, WebP, GIF • Max 10MB per file • Up to 10 files
            </p>
          </div>
          
          {!uploading && (
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors">
              Choose Files
            </button>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Optimizing and uploading...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {(error || dragError) && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">Upload Error</p>
          <p className="text-red-600 text-sm mt-1">{error || dragError}</p>
          <button
            onClick={reset}
            className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Results Display */}
      {result && showPreview && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-lg font-semibold text-green-800 mb-4">Optimization Complete!</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Optimization Stats */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Original Size:</span>
                <span className="font-medium">{formatFileSize(result.originalSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Optimized Size:</span>
                <span className="font-medium">{formatFileSize(result.optimizedSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Compression:</span>
                <span className="font-medium text-green-600">{result.compressionRatio}% smaller</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dimensions:</span>
                <span className="font-medium">{result.dimensions.width}×{result.dimensions.height}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Format:</span>
                <span className="font-medium">{result.format.replace('image/', '').toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Processing Time:</span>
                <span className="font-medium">{result.processingTime}ms</span>
              </div>
            </div>
            
            {/* Image Preview */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Optimized Image:</p>
                <img
                  src={result.optimizedUrl}
                  alt="Optimized"
                  className="w-full h-32 object-cover rounded-lg border"
                />
              </div>
              
              {result.thumbnailUrl && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Thumbnail:</p>
                  <img
                    src={result.thumbnailUrl}
                    alt="Thumbnail"
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Copy URLs */}
          <div className="mt-4 space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Optimized URL:</label>
              <div className="flex">
                <input
                  type="text"
                  value={result.optimizedUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(result.optimizedUrl)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 text-sm"
                >
                  Copy
                </button>
              </div>
            </div>
            
            {result.thumbnailUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL:</label>
                <div className="flex">
                  <input
                    type="text"
                    value={result.thumbnailUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(result.thumbnailUrl!)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageOptimizationUploader;