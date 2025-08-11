import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Grid, Eye, Trash2, Camera, Move } from 'lucide-react';
import { StorageService, type UploadedImage } from '@/services/storage';
import { error } from '@/utils/logger';

interface PortfolioManagerProps {
  cardId: string;
  portfolioImages: UploadedImage[];
  portfolioType: 'cover' | 'carousel';
  coverImage?: string;
  onImagesUpdate: (images: UploadedImage[]) => void;
  onTypeChange: (type: 'cover' | 'carousel') => void;
  onCoverImageChange: (coverImage: string) => void;
}

export const PortfolioManager: React.FC<PortfolioManagerProps> = ({
  cardId,
  portfolioImages,
  portfolioType,
  coverImage,
  onImagesUpdate,
  onTypeChange,
  onCoverImageChange
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        return await StorageService.uploadPortfolioImage(
          cardId,
          file,
          (progress) => setUploadProgress(progress)
        );
      });

      const newImages = await Promise.all(uploadPromises);
      onImagesUpdate([...portfolioImages, ...newImages]);
    } catch (err) {
      error('Failed to upload portfolio images', err as Error, { component: 'PortfolioManager', cardId, imageCount: files.length });
      alert('Error al subir las imágenes. Por favor, intenta de nuevo.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCoverImageSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const coverUrl = await StorageService.uploadCoverImage(cardId, files[0]);
      onCoverImageChange(coverUrl);
    } catch (err) {
      error('Failed to upload cover image', err as Error, { component: 'PortfolioManager', cardId });
      alert('Error al subir la imagen de portada. Por favor, intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta imagen?')) return;

    try {
      await StorageService.deletePortfolioImage(cardId, imageId);
      const updatedImages = portfolioImages.filter(img => img.id !== imageId);
      onImagesUpdate(updatedImages);
    } catch (err) {
      error('Failed to delete portfolio image', err as Error, { component: 'PortfolioManager', cardId, imageId });
      alert('Error al eliminar la imagen. Por favor, intenta de nuevo.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...portfolioImages];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onImagesUpdate(newImages);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white border-2 border-gray-200 rounded-3xl shadow-lg p-8">
        {/* Header del Portfolio */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Camera size={20} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Portfolio</h3>
          </div>
          
          {/* Selector de tipo de portfolio */}
          <div className="flex space-x-4">
            <button
              onClick={() => onTypeChange('cover')}
              className={`flex items-center space-x-3 px-6 py-3 rounded-2xl font-bold transition-all duration-200 border-2 hover:scale-105 ${
                portfolioType === 'cover'
                  ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg border-pink-500'
                  : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              <ImageIcon size={18} />
              <span>📸 Imagen Fija</span>
            </button>
            
            <button
              onClick={() => onTypeChange('carousel')}
              className={`flex items-center space-x-3 px-6 py-3 rounded-2xl font-bold transition-all duration-200 border-2 hover:scale-105 ${
                portfolioType === 'carousel'
                  ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg border-pink-500'
                  : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              <Grid size={18} />
              <span>🎠 Carrusel</span>
            </button>
          </div>
        </div>

        {/* Imagen de Portada (Solo para tipo 'cover') */}
        {portfolioType === 'cover' && (
          <div className="border-2 border-gray-300 rounded-2xl p-6 bg-gray-50">
            <h4 className="text-gray-900 font-bold text-lg mb-4 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mr-3">
                <ImageIcon size={16} className="text-white" />
              </div>
              🖼️ Imagen de Portada
            </h4>
            
            <div className="space-y-4">
              {coverImage ? (
                <div className="relative group bg-white rounded-2xl overflow-hidden border-2 border-gray-300 shadow-sm">
                  <img
                    src={coverImage}
                    alt="Cover"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                    <button
                      onClick={() => onCoverImageChange('')}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white p-3 rounded-2xl hover:scale-110 transition-transform shadow-lg border-2 border-red-400"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => coverFileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-400 rounded-2xl p-12 text-center cursor-pointer hover:border-gray-600 hover:bg-gray-100 transition-all duration-200 bg-white"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Camera size={24} className="text-white" />
                  </div>
                  <p className="text-gray-900 font-bold text-lg mb-2">Haz clic para subir imagen de portada</p>
                  <p className="text-gray-600 font-medium">JPG, PNG, WebP - Máx 10MB</p>
                </div>
              )}
              
              <input
                ref={coverFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleCoverImageSelect(e.target.files)}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Galería de Imágenes (Solo para tipo 'carousel') */}
        {portfolioType === 'carousel' && (
          <div className="border-2 border-gray-300 rounded-2xl p-6 bg-gray-50">
            <h4 className="text-gray-900 font-bold text-lg mb-6 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                <Grid size={16} className="text-white" />
              </div>
              🎠 Galería de Imágenes
            </h4>
            
            {/* Zona de subida */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 mb-6 ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 scale-105'
                  : 'border-gray-400 hover:border-gray-600 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload size={24} className="text-white" />
              </div>
              <p className="text-gray-900 font-bold text-lg mb-2">
                {isUploading ? '📤 Subiendo...' : '📁 Arrastra imágenes aquí o haz clic para seleccionar'}
              </p>
              <p className="text-gray-600 font-medium">JPG, PNG, WebP - Máx 10MB por imagen</p>
              
              {isUploading && (
                <div className="mt-6">
                  <div className="w-full bg-gray-300 rounded-full h-3 border border-gray-400">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300 shadow-sm"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-gray-800 font-bold text-sm mt-2">📊 {uploadProgress}% completado</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />

            {/* Galería de imágenes */}
            {portfolioImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {portfolioImages.map((image, index) => (
                  <div key={image.id} className="relative group bg-white rounded-2xl overflow-hidden border-2 border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">
                    <img
                      src={image.urls.medium}
                      alt={image.fileName}
                      className="w-full h-24 object-cover"
                    />
                    
                    {/* Controles de la imagen */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center space-x-2">
                      <button
                        onClick={() => window.open(image.urls.original, '_blank')}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-2 rounded-xl hover:scale-110 transition-transform shadow-lg border border-blue-400"
                      >
                        <Eye size={16} />
                      </button>
                      
                      {index > 0 && (
                        <button
                          onClick={() => moveImage(index, index - 1)}
                          className="bg-gradient-to-r from-gray-500 to-gray-600 text-white p-2 rounded-xl hover:scale-110 transition-transform shadow-lg border border-gray-400"
                        >
                          <Move size={16} />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        className="bg-gradient-to-r from-red-500 to-red-600 text-white p-2 rounded-xl hover:scale-110 transition-transform shadow-lg border border-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    {/* Indicador de orden */}
                    <div className="absolute top-2 left-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded-xl border border-gray-600">
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {portfolioImages.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border-2 border-gray-300">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Grid size={24} className="text-white" />
                </div>
                <p className="text-gray-900 font-bold text-lg mb-2">No hay imágenes en el portfolio</p>
                <p className="text-gray-600 font-medium">Sube algunas imágenes para mostrar tu trabajo</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};